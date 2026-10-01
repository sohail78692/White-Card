import { describe, it, expect } from "vitest";
import { checkRateLimit } from "../lib/ratelimit";

describe("Rate Limiting Mechanism", () => {
  it("should allow requests under the threshold and block requests exceeding it", async () => {
    const key = `test_ratelimit_${Date.now()}`;
    const limit = 3;
    const windowSeconds = 10;

    // Requests 1, 2, 3 should be allowed
    const r1 = await checkRateLimit(key, limit, windowSeconds);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = await checkRateLimit(key, limit, windowSeconds);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = await checkRateLimit(key, limit, windowSeconds);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    // Request 4 must be BLOCKED
    const r4 = await checkRateLimit(key, limit, windowSeconds);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });
});

describe("Atomic Ration Quota Deduction Simulation", () => {
  it("should never exceed balance during concurrent dispense attempts", async () => {
    // Model atomic conditional update:
    // findOneAndUpdate({ rice: { $gte: qty } }, { $inc: { rice: -qty } })
    let riceBalance = 20; // 20 kg initial balance

    const atomicDispense = async (qty: number): Promise<boolean> => {
      // Simulates atomic DB transaction / condition
      if (riceBalance >= qty) {
        riceBalance -= qty;
        return true;
      }
      return false;
    };

    // Attempt 3 concurrent dispenses of 10kg each
    // Only 2 should succeed, 3rd must fail because 10 + 10 + 10 > 20!
    const results = await Promise.all([
      atomicDispense(10),
      atomicDispense(10),
      atomicDispense(10),
    ]);

    const successes = results.filter((r) => r === true).length;
    const failures = results.filter((r) => r === false).length;

    expect(successes).toBe(2);
    expect(failures).toBe(1);
    expect(riceBalance).toBe(0); // Balance cannot be negative
  });
});

describe("Polling Duplicate Check-in Prevention", () => {
  it("should allow check-in once per election ID and block subsequent attempts", async () => {
    // Simulates MongoDB unique index constraint (userId, electionId)
    const checkinStore = new Set<string>();

    const recordCheckin = (userId: string, electionId: string): { success: boolean; error?: string } => {
      const compositeKey = `${userId}:${electionId}`;
      if (checkinStore.has(compositeKey)) {
        return { success: false, error: "Already checked in" };
      }
      checkinStore.add(compositeKey);
      return { success: true };
    };

    const voterId = "usr_voter_123";
    const electionId = "GEN_ELECTION_2026";

    // 1st attempt: success
    const firstAttempt = recordCheckin(voterId, electionId);
    expect(firstAttempt.success).toBe(true);

    // 2nd attempt: blocked with "Already checked in"
    const secondAttempt = recordCheckin(voterId, electionId);
    expect(secondAttempt.success).toBe(false);
    expect(secondAttempt.error).toBe("Already checked in");
  });
});
