import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { verifyShareJwt } from "@/lib/tokens";
import { recordAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

export interface VerificationResponse {
  valid: boolean;
  status: "Valid" | "Expired" | "Revoked" | "Single-Use Exceeded" | "Blocked" | "Invalid";
  error?: string;
  preset?: string;
  purpose?: string;
  subject?: string;
  issuer?: string;
  expiresAt?: string;
  claims?: Record<string, unknown>;
}

/**
 * Standard verification pipeline executing the 8 strict verification steps:
 * 1. Signature & kid check via Ed25519 JWKS
 * 2. exp/iat temporal checks
 * 3. shares lookup by jti
 * 4. Check revokedAt
 * 5. Single-use enforcement (atomic findOneAndUpdate where usedAt is null)
 * 6. Verifier blocklist check
 * 7. Write tamper-evident audit log
 * 8. Return ONLY the disclosed claims
 */
export async function verifyAndConsumeShareToken(
  token: string,
  verifierContext: {
    actor: string; // e.g. "Public Web Verifier" or verifier org name
    verifierId?: string;
  }
): Promise<VerificationResponse> {
  // Step 1 & 2: Signature, kid, exp, iat
  const jwtCheck = await verifyShareJwt(token);
  if (!jwtCheck.valid || !jwtCheck.payload) {
    if (jwtCheck.error && jwtCheck.error.includes("expired")) {
      return { valid: false, status: "Expired", error: "Token expired" };
    }
    return { valid: false, status: "Invalid", error: jwtCheck.error || "Invalid token signature" };
  }

  const payload = jwtCheck.payload;
  const jti = payload.jti;
  if (!jti) {
    return { valid: false, status: "Invalid", error: "Missing jti claim" };
  }

  const db = await getDb();

  // Step 3: shares lookup by jti
  const shareRecord = await db.collection("shares").findOne({ jti });
  if (!shareRecord) {
    return { valid: false, status: "Invalid", error: "Share token record not found" };
  }

  const userId = shareRecord.userId.toString();

  // Step 4: Check revokedAt
  if (shareRecord.revokedAt) {
    await recordAuditLog({
      userId,
      actor: verifierContext.actor,
      action: "verify",
      fields: shareRecord.fields || [],
      result: "revoked",
    });
    return { valid: false, status: "Revoked", error: "Share token was revoked by the wallet owner" };
  }

  // Check temporal expiration
  if (new Date() > new Date(shareRecord.expiresAt)) {
    await recordAuditLog({
      userId,
      actor: verifierContext.actor,
      action: "verify",
      fields: shareRecord.fields || [],
      result: "expired",
    });
    return { valid: false, status: "Expired", error: "Share token has expired" };
  }

  // Step 5: Single-use check (atomic findOneAndUpdate where usedAt is null)
  if (shareRecord.singleUse) {
    const updated = await db.collection("shares").findOneAndUpdate(
      { jti, usedAt: null },
      { $set: { usedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!updated) {
      await recordAuditLog({
        userId,
        actor: verifierContext.actor,
        action: "verify",
        fields: shareRecord.fields || [],
        result: "denied",
      });
      return {
        valid: false,
        status: "Single-Use Exceeded",
        error: "Single-use token has already been accessed and consumed",
      };
    }
  }

  // Step 6: Verifier blocklist check
  if (verifierContext.verifierId) {
    const isBlocked = await db.collection("blocklist").findOne({
      userId: shareRecord.userId,
      verifierId: new ObjectId(verifierContext.verifierId),
    });

    if (isBlocked) {
      await recordAuditLog({
        userId,
        actor: verifierContext.actor,
        action: "verify",
        fields: shareRecord.fields || [],
        result: "denied",
      });
      return {
        valid: false,
        status: "Blocked",
        error: "Verifier is on user's blocked list",
      };
    }
  }

  // Step 7: Write audit entry
  await recordAuditLog({
    userId,
    actor: verifierContext.actor,
    action: "verify",
    fields: shareRecord.fields || [],
    result: "success",
  });

  // Step 8: Return only disclosed claims
  const claims = (payload.claims as Record<string, unknown>) || {};

  return {
    valid: true,
    status: "Valid",
    preset: payload.preset as string,
    purpose: payload.purpose as string,
    subject: payload.sub,
    issuer: payload.iss,
    expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
    claims,
  };
}
