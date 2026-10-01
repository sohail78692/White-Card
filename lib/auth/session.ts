import crypto from "crypto";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { unwrapDek } from "@/lib/crypto/keys";

const SESSION_COOKIE_NAME = "wc_session";
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface UserSession {
  userId: string;
  email: string;
  name?: string;
  walletId: string;
  dek: Buffer;
}

export interface SessionRecord {
  id: string;
  ua?: string;
  ip?: string;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a new session in MongoDB and sets the httpOnly cookie.
 */
export async function createSession(userId: string, ua?: string, ip?: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);

  const db = await getDb();
  await db.collection("sessions").insertOne({
    userId: new ObjectId(userId),
    tokenHash,
    ua: ua || "unknown",
    ip: ip || "unknown",
    createdAt: now,
    expiresAt,
  });

  const cookieStore = cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return token;
}

/**
 * Destroys the current user's session from the database and deletes the cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashToken(token);
    try {
      const db = await getDb();
      await db.collection("sessions").deleteOne({ tokenHash });
    } catch {
      // Ignore DB errors on logout
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Gets the current authenticated user and unwraps their DEK.
 * Returns null if unauthenticated or session expired.
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const tokenHash = hashToken(token);
    const db = await getDb();
    const session = await db.collection("sessions").findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    });

    if (!session) return null;

    const user = await db.collection("users").findOne({ _id: session.userId });
    if (!user) return null;

    const env = getEnv();
    const userId = user._id.toString();
    const dek = unwrapDek(env.MASTER_KEY, user.wrappedDek, userId);

    return {
      userId,
      email: user.email,
      name: user.name,
      walletId: user.walletId,
      dek,
    };
  } catch {
    return null;
  }
}

/**
 * Lists active sessions for a user.
 */
export async function listUserSessions(userId: string): Promise<SessionRecord[]> {
  try {
    const cookieStore = cookies();
    const currentToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const currentTokenHash = currentToken ? hashToken(currentToken) : null;

    const db = await getDb();
    const sessions = await db
      .collection("sessions")
      .find({
        userId: new ObjectId(userId),
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 })
      .toArray();

    return sessions.map((s) => ({
      id: s._id.toString(),
      ua: s.ua,
      ip: s.ip,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.tokenHash === currentTokenHash,
    }));
  } catch {
    return [];
  }
}

/**
 * Revokes a specific session by its document ID for a given user.
 */
export async function revokeSessionById(userId: string, sessionId: string): Promise<boolean> {
  try {
    const db = await getDb();
    const result = await db.collection("sessions").deleteOne({
      _id: new ObjectId(sessionId),
      userId: new ObjectId(userId),
    });
    return result.deletedCount > 0;
  } catch {
    return false;
  }
}
