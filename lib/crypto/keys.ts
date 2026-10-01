import crypto from "crypto";
import { encryptField, decryptFieldRaw } from "./aead";

/**
 * Generates a fresh cryptographically random 256-bit (32-byte) Data Encryption Key (DEK).
 */
export function generateDek(): Buffer {
  return crypto.randomBytes(32);
}

/**
 * Wraps a user's DEK with the environment MASTER_KEY using AES-256-GCM.
 * Binds the userId as Additional Authenticated Data (AAD).
 */
export function wrapDek(masterKeyHex: string, dek: Buffer, userId: string): string {
  const masterKey = Buffer.from(masterKeyHex, "hex");
  if (masterKey.length !== 32) {
    throw new Error("MASTER_KEY must be exactly 32 bytes (64 hex characters)");
  }
  return encryptField(masterKey, dek, `dek-wrap:${userId}`);
}

/**
 * Unwraps a user's wrappedDek using the environment MASTER_KEY.
 * Verifies the userId AAD binding.
 */
export function unwrapDek(masterKeyHex: string, wrappedDek: string, userId: string): Buffer {
  const masterKey = Buffer.from(masterKeyHex, "hex");
  if (masterKey.length !== 32) {
    throw new Error("MASTER_KEY must be exactly 32 bytes (64 hex characters)");
  }
  return decryptFieldRaw(masterKey, wrappedDek, `dek-wrap:${userId}`);
}
