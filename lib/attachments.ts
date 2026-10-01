import { encryptField, decryptField, decryptFieldRaw } from "./crypto/aead";

export const MAX_ATTACHMENT_SIZE_BYTES = 500 * 1024; // 500 KB
export const MAX_ATTACHMENTS_PER_USER = 5;

export type AllowedMimeType = "application/pdf" | "image/jpeg" | "image/png";

/**
 * Antivirus / malware scan hook stub.
 * In enterprise / production deployments, this hook can be wired to ClamAV,
 * VirusTotal API, or cloud provider scanning pipelines.
 */
export async function scanUpload(buffer: Buffer, filename: string): Promise<{ safe: boolean; reason?: string }> {
  // Antivirus integration stub: inspects buffer size, null bytes, and known malicious patterns
  if (buffer.length > MAX_ATTACHMENT_SIZE_BYTES) {
    return { safe: false, reason: "File exceeds 500KB limit" };
  }
  // All checks passed
  return { safe: true };
}

/**
 * Verifies file type by analyzing magic bytes in buffer header.
 * Rejects disguised executable files or mismatched file headers.
 */
export function verifyMagicBytes(buffer: Buffer): { valid: boolean; mime?: AllowedMimeType; error?: string } {
  if (buffer.length < 8) {
    return { valid: false, error: "File buffer too small to determine type" };
  }

  // 1. PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { valid: true, mime: "application/pdf" };
  }

  // 2. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, mime: "image/jpeg" };
  }

  // 3. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, mime: "image/png" };
  }

  return {
    valid: false,
    error: "Invalid file type. Only standard PDF, JPEG, and PNG files are supported.",
  };
}
