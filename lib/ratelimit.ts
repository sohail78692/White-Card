import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

// In-memory fallback map for unit tests or offline DB scenarios
const inMemoryStore = new Map<string, { count: number; expiresAt: Date }>();

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

  try {
    const db = await getDb();
    const collection = db.collection("rate_limits");

    // Upsert atomic increment
    const doc = await collection.findOneAndUpdate(
      { key },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    const currentCount = doc ? doc.count : 1;
    const docExpiresAt = doc?.expiresAt ? new Date(doc.expiresAt) : expiresAt;

    if (currentCount > limit) {
      logger.warn({ key, currentCount, limit }, "Rate limit exceeded");
      return {
        allowed: false,
        remaining: 0,
        resetAt: docExpiresAt,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - currentCount),
      resetAt: docExpiresAt,
    };
  } catch (error) {
    // Graceful fallback to memory store
    const existing = inMemoryStore.get(key);
    if (existing && existing.expiresAt > now) {
      existing.count += 1;
      const allowed = existing.count <= limit;
      return {
        allowed,
        remaining: Math.max(0, limit - existing.count),
        resetAt: existing.expiresAt,
      };
    } else {
      inMemoryStore.set(key, { count: 1, expiresAt });
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: expiresAt,
      };
    }
  }
}
