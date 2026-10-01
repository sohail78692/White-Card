import crypto from "crypto";

const BLIND_INDEX_SALT = Buffer.from("white-card-blind-index-salt-v1", "utf-8");
const BLIND_INDEX_INFO = Buffer.from("blind-index", "utf-8");

/**
 * Derives a dedicated 32-byte key for blind indexing from MASTER_KEY using HKDF-SHA256.
 */
export function deriveBlindKey(masterKeyHex: string): Buffer {
  const masterKey = Buffer.from(masterKeyHex, "hex");
  const derived = crypto.hkdfSync(
    "sha256",
    masterKey,
    BLIND_INDEX_SALT,
    BLIND_INDEX_INFO,
    32
  );
  return Buffer.from(derived);
}

/**
 * Normalizes document numbers for deterministic comparison across variations in casing and formatting:
 * Removes spaces, dashes, slashes, and converts to uppercase.
 */
export function normalizeDocumentNumber(docNum: string): string {
  if (!docNum) return "";
  return docNum.replace(/[\s\-_/]/g, "").toUpperCase();
}

/**
 * Computes a blind index HMAC-SHA256(blindKey, normalizedNumber).
 * Enables exact duplicate detection in MongoDB without storing or indexing plaintext.
 */
export function computeBlindIndex(blindKey: Buffer, normalizedNumber: string): string {
  return crypto
    .createHmac("sha256", blindKey)
    .update(normalizedNumber, "utf-8")
    .digest("hex");
}
