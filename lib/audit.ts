import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

export const GENESIS_PREV_HASH = "0".repeat(64);

export interface AuditEntryData {
  userId: string;
  actor: string; // "user" | verifier ID | verifier name
  action:
    | "link_document"
    | "delete_document"
    | "create_share"
    | "revoke_share"
    | "verify"
    | "ration_dispense"
    | "polling_checkin"
    | "export_data"
    | "delete_account";
  fields: string[]; // Disclosed/accessed field names (NEVER store plaintext values)
  result: "success" | "denied" | "revoked" | "expired" | "failed";
  metadata?: Record<string, unknown>;
}

export interface AuditLogDocument {
  _id: ObjectId;
  userId: ObjectId;
  seq: number;
  ts: Date;
  actor: string;
  action: string;
  fields: string[];
  result: string;
  prevHash: string;
  hash: string;
}

/**
 * Deterministic JSON stringifier sorting all object keys lexicographically.
 */
export function canonicalJSON(val: unknown): string {
  if (val === null || typeof val !== "object") {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    return "[" + val.map((item) => canonicalJSON(item)).join(",") + "]";
  }
  const sortedKeys = Object.keys(val as Record<string, unknown>).sort();
  const entries = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${canonicalJSON((val as Record<string, unknown>)[key])}`
  );
  return "{" + entries.join(",") + "}";
}

/**
 * Computes SHA-256 hash of (prevHash + canonicalJSON(entryData)).
 */
export function computeAuditHash(
  prevHash: string,
  entry: {
    userId: string;
    seq: number;
    ts: string;
    actor: string;
    action: string;
    fields: string[];
    result: string;
  }
): string {
  const payload = prevHash + canonicalJSON(entry);
  return crypto.createHash("sha256").update(payload, "utf-8").digest("hex");
}

/**
 * Appends a tamper-evident audit record to the user's sequential hash chain.
 * Retries on concurrent sequence collision.
 */
export async function recordAuditLog(
  entryData: AuditEntryData,
  maxRetries = 3
): Promise<AuditLogDocument | null> {
  const db = await getDb();
  const auditLogs = db.collection<AuditLogDocument>("audit_logs");
  const userObjId = new ObjectId(entryData.userId);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Find latest entry for user to get current seq and hash
      const latest = await auditLogs.findOne(
        { userId: userObjId },
        { sort: { seq: -1 } }
      );

      const seq = latest ? latest.seq + 1 : 0;
      const prevHash = latest ? latest.hash : GENESIS_PREV_HASH;
      const ts = new Date();
      const tsIso = ts.toISOString();

      const hash = computeAuditHash(prevHash, {
        userId: entryData.userId,
        seq,
        ts: tsIso,
        actor: entryData.actor,
        action: entryData.action,
        fields: entryData.fields || [],
        result: entryData.result,
      });

      const doc: AuditLogDocument = {
        _id: new ObjectId(),
        userId: userObjId,
        seq,
        ts,
        actor: entryData.actor,
        action: entryData.action,
        fields: entryData.fields || [],
        result: entryData.result,
        prevHash,
        hash,
      };

      await auditLogs.insertOne(doc);
      return doc;
    } catch (err: unknown) {
      const isDuplicate =
        err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000;
      if (isDuplicate && attempt < maxRetries - 1) {
        // Retry sequence increment
        continue;
      }
      logger.error({ err, userId: entryData.userId }, "Failed to write audit log entry");
      return null;
    }
  }
  return null;
}

/**
 * Validates the entire mathematical hash chain for a user.
 * Returns { intact: true } if all hashes match, or { intact: false, firstBrokenIndex: number }
 */
export async function verifyAuditChain(
  userId: string
): Promise<{ intact: boolean; totalEntries: number; firstBrokenIndex?: number; reason?: string }> {
  const db = await getDb();
  const logs = await db
    .collection<AuditLogDocument>("audit_logs")
    .find({ userId: new ObjectId(userId) })
    .sort({ seq: 1 })
    .toArray();

  if (logs.length === 0) {
    return { intact: true, totalEntries: 0 };
  }

  let expectedPrevHash = GENESIS_PREV_HASH;

  for (let i = 0; i < logs.length; i++) {
    const entry = logs[i];

    // Check sequence continuity
    if (entry.seq !== i) {
      return {
        intact: false,
        totalEntries: logs.length,
        firstBrokenIndex: i,
        reason: `Sequence break at index ${i}: expected seq ${i}, got ${entry.seq}`,
      };
    }

    // Check prevHash link
    if (entry.prevHash !== expectedPrevHash) {
      return {
        intact: false,
        totalEntries: logs.length,
        firstBrokenIndex: i,
        reason: `Previous hash pointer mismatch at index ${i}`,
      };
    }

    // Recompute current hash
    const computedHash = computeAuditHash(entry.prevHash, {
      userId,
      seq: entry.seq,
      ts: new Date(entry.ts).toISOString(),
      actor: entry.actor,
      action: entry.action,
      fields: entry.fields,
      result: entry.result,
    });

    if (computedHash !== entry.hash) {
      return {
        intact: false,
        totalEntries: logs.length,
        firstBrokenIndex: i,
        reason: `Hash signature verification failed at index ${i}`,
      };
    }

    expectedPrevHash = entry.hash;
  }

  return { intact: true, totalEntries: logs.length };
}
