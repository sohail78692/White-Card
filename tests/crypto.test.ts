import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { encryptField, decryptField, decryptFieldRaw } from "../lib/crypto/aead";
import { generateDek, wrapDek, unwrapDek } from "../lib/crypto/keys";
import { deriveBlindKey, computeBlindIndex, normalizeDocumentNumber } from "../lib/crypto/hkdf";

describe("AEAD Encryption & Key Wrapping", () => {
  const masterKey = crypto.randomBytes(32).toString("hex");
  const userId = "usr_test_12345";
  const dek = generateDek();

  it("should successfully encrypt and decrypt a field with AAD (round-trip)", () => {
    const plaintext = "DL0120150001234";
    const aad = `${userId}:number`;

    const encrypted = encryptField(dek, plaintext, aad);
    expect(encrypted).toMatch(/^v1\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/);

    const decrypted = decryptField(dek, encrypted, aad);
    expect(decrypted).toBe(plaintext);
  });

  it("should fail decryption when using the wrong key", () => {
    const plaintext = "SECRET_DOCUMENT_DATA";
    const aad = `${userId}:details`;
    const encrypted = encryptField(dek, plaintext, aad);

    const wrongKey = crypto.randomBytes(32);
    expect(() => decryptField(wrongKey, encrypted, aad)).toThrow();
  });

  it("should fail decryption when ciphertext is tampered", () => {
    const plaintext = "CONFIDENTIAL_DETAILS";
    const aad = `${userId}:details`;
    const encrypted = encryptField(dek, plaintext, aad);

    const parts = encrypted.split(".");
    // Modify the ciphertext segment
    const tamperedCt = parts[3].slice(0, -2) + (parts[3].endsWith("A") ? "B" : "A");
    const tamperedPayload = [parts[0], parts[1], parts[2], tamperedCt].join(".");

    expect(() => decryptField(dek, tamperedPayload, aad)).toThrow();
  });

  it("should fail decryption when AAD does not match", () => {
    const plaintext = "AAD_SENSITIVE_TEXT";
    const originalAad = `${userId}:number`;
    const alteredAad = `different_user:number`;

    const encrypted = encryptField(dek, plaintext, originalAad);
    expect(() => decryptField(dek, encrypted, alteredAad)).toThrow();
  });

  it("should correctly wrap and unwrap a user DEK using MASTER_KEY", () => {
    const wrapped = wrapDek(masterKey, dek, userId);
    expect(wrapped).toContain("v1.");

    const unwrapped = unwrapDek(masterKey, wrapped, userId);
    expect(unwrapped.equals(dek)).toBe(true);

    // Unwrapping with mismatched userId AAD must fail
    expect(() => unwrapDek(masterKey, wrapped, "different_user_id")).toThrow();
  });

  it("should encrypt and decrypt binary Buffer attachments", () => {
    const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // PDF header
    const aad = `${userId}:attachment:att_1`;

    const encrypted = encryptField(dek, buffer, aad);
    const decryptedRaw = decryptFieldRaw(dek, encrypted, aad);

    expect(decryptedRaw.equals(buffer)).toBe(true);
  });
});

describe("Blind Index & Normalization", () => {
  const masterKey = crypto.randomBytes(32).toString("hex");
  const blindKey = deriveBlindKey(masterKey);

  it("should normalize document numbers consistently", () => {
    expect(normalizeDocumentNumber(" dl-01-2015-0001234 ")).toBe("DL0120150001234");
    expect(normalizeDocumentNumber("abcde 1234 f")).toBe("ABCDE1234F");
  });

  it("should produce deterministic blind index for identical numbers", () => {
    const num1 = "ABCDE1234F";
    const num2 = " abcde 1234 f ";

    const idx1 = computeBlindIndex(blindKey, normalizeDocumentNumber(num1));
    const idx2 = computeBlindIndex(blindKey, normalizeDocumentNumber(num2));

    expect(idx1).toBe(idx2);
    expect(idx1).toHaveLength(64); // SHA-256 hex
  });

  it("should produce distinct blind indexes for different numbers", () => {
    const idx1 = computeBlindIndex(blindKey, normalizeDocumentNumber("ABCDE1234F"));
    const idx2 = computeBlindIndex(blindKey, normalizeDocumentNumber("ABCDE1234G"));

    expect(idx1).not.toBe(idx2);
  });
});
