import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const CURRENT_VERSION = "v1";

/**
 * Encrypts a string or Buffer using AES-256-GCM with a fresh 12-byte IV and Additional Authenticated Data (AAD).
 * Format: v1.<iv_base64url>.<tag_base64url>.<ciphertext_base64url>
 */
export function encryptField(
  dek: Buffer,
  plaintext: string | Buffer,
  aad: string
): string {
  if (dek.length !== 32) {
    throw new Error("DEK must be exactly 32 bytes (256-bit)");
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, dek, iv);

  if (aad) {
    cipher.setAAD(Buffer.from(aad, "utf-8"));
  }

  const dataBuffer = Buffer.isBuffer(plaintext)
    ? plaintext
    : Buffer.from(plaintext, "utf-8");

  const ciphertext = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    CURRENT_VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

/**
 * Decrypts a payload encrypted with encryptField.
 * Throws an error if authentication fails, tag mismatch, wrong key, or AAD mismatch.
 */
export function decryptField(
  dek: Buffer,
  payload: string,
  aad: string
): string {
  const raw = decryptFieldRaw(dek, payload, aad);
  return raw.toString("utf-8");
}

/**
 * Decrypts raw Buffer (e.g. for binary document attachments).
 */
export function decryptFieldRaw(
  dek: Buffer,
  payload: string,
  aad: string
): Buffer {
  if (dek.length !== 32) {
    throw new Error("DEK must be exactly 32 bytes (256-bit)");
  }

  const parts = payload.split(".");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted payload format: expected 4 dot-separated segments");
  }

  const [version, ivStr, tagStr, ctStr] = parts;
  if (version !== "v1") {
    throw new Error(`Unsupported encryption version: ${version}`);
  }

  const iv = Buffer.from(ivStr, "base64url");
  const tag = Buffer.from(tagStr, "base64url");
  const ciphertext = Buffer.from(ctStr, "base64url");

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, dek, iv);

  if (aad) {
    decipher.setAAD(Buffer.from(aad, "utf-8"));
  }

  decipher.setAuthTag(tag);

  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch (err) {
    throw new Error("Decryption failed: authenticated tag mismatch or tampered ciphertext");
  }
}
