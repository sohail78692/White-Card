import { describe, it, expect } from "vitest";
import {
  canonicalJSON,
  computeAuditHash,
  GENESIS_PREV_HASH,
} from "../lib/audit";

describe("Audit Hash Chain Integrity", () => {
  it("should sort object keys deterministically in canonicalJSON", () => {
    const obj1 = { z: 1, a: 2, m: { y: "test", b: 123 } };
    const obj2 = { a: 2, m: { b: 123, y: "test" }, z: 1 };

    expect(canonicalJSON(obj1)).toBe(canonicalJSON(obj2));
    expect(canonicalJSON(obj1)).toBe('{"a":2,"m":{"b":123,"y":"test"},"z":1}');
  });

  it("should compute SHA-256 hash chain sequentially from genesis", () => {
    const userId = "usr_audit_test";
    const ts0 = "2026-10-01T10:00:00.000Z";
    const ts1 = "2026-10-01T10:05:00.000Z";

    // Block 0
    const hash0 = computeAuditHash(GENESIS_PREV_HASH, {
      userId,
      seq: 0,
      ts: ts0,
      actor: "user",
      action: "link_document",
      fields: ["type", "document_number"],
      result: "success",
    });

    expect(hash0).toHaveLength(64);

    // Block 1 links to hash0 as prevHash
    const hash1 = computeAuditHash(hash0, {
      userId,
      seq: 1,
      ts: ts1,
      actor: "Traffic Police",
      action: "verify",
      fields: ["drivingLicenseValid", "vehicleClasses"],
      result: "success",
    });

    expect(hash1).toHaveLength(64);
    expect(hash1).not.toBe(hash0);
  });

  it("should detect when an audit record in the chain has been tampered with and pinpoint the exact index", () => {
    const userId = "usr_audit_tamper_test";

    // Construct a simulated 4-block valid chain
    const entries = [
      { seq: 0, ts: "2026-10-01T10:00:00Z", actor: "user", action: "link_document", fields: ["type"], result: "success" },
      { seq: 1, ts: "2026-10-01T10:01:00Z", actor: "user", action: "create_share", fields: ["over18"], result: "success" },
      { seq: 2, ts: "2026-10-01T10:02:00Z", actor: "inspector", action: "verify", fields: ["over18"], result: "success" },
      { seq: 3, ts: "2026-10-01T10:03:00Z", actor: "user", action: "export_data", fields: ["documents"], result: "success" },
    ];

    let currentPrev = GENESIS_PREV_HASH;
    const chain = entries.map((entry) => {
      const prevHash = currentPrev;
      const hash = computeAuditHash(prevHash, {
        userId,
        seq: entry.seq,
        ts: entry.ts,
        actor: entry.actor,
        action: entry.action,
        fields: entry.fields,
        result: entry.result,
      });
      currentPrev = hash;
      return { ...entry, prevHash, hash };
    });

    // Verification helper matching lib/audit verifyAuditChain logic
    function verifySimulatedChain(logChain: typeof chain) {
      let expectedPrev = GENESIS_PREV_HASH;
      for (let i = 0; i < logChain.length; i++) {
        const item = logChain[i];
        if (item.seq !== i) {
          return { intact: false, firstBrokenIndex: i, reason: "seq mismatch" };
        }
        if (item.prevHash !== expectedPrev) {
          return { intact: false, firstBrokenIndex: i, reason: "prevHash mismatch" };
        }
        const computed = computeAuditHash(item.prevHash, {
          userId,
          seq: item.seq,
          ts: item.ts,
          actor: item.actor,
          action: item.action,
          fields: item.fields,
          result: item.result,
        });
        if (computed !== item.hash) {
          return { intact: false, firstBrokenIndex: i, reason: "hash signature mismatch" };
        }
        expectedPrev = item.hash;
      }
      return { intact: true };
    }

    // 1. Untampered chain MUST be intact
    expect(verifySimulatedChain(chain).intact).toBe(true);

    // 2. Tamper with block index 2 (e.g. modify actor in DB)
    const tamperedChain = JSON.parse(JSON.stringify(chain));
    tamperedChain[2].actor = "Malicious Imposter";

    const tamperedResult = verifySimulatedChain(tamperedChain);
    expect(tamperedResult.intact).toBe(false);
    expect(tamperedResult.firstBrokenIndex).toBe(2);
  });
});
