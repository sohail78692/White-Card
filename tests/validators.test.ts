import { describe, it, expect } from "vitest";
import {
  validateDocumentNumber,
  maskDocumentNumber,
  DOCUMENT_TYPES,
} from "../lib/validators/documents";
import { verifyMagicBytes } from "../lib/attachments";

describe("Document Number Validators", () => {
  it("should validate Driving License correctly", () => {
    // Valid: 2 letters, 2 digits RTO, 4 digits year, 7 digits
    const valid = validateDocumentNumber("DRIVING_LICENSE", "DL0120150001234");
    expect(valid.valid).toBe(true);
    expect(valid.normalized).toBe("DL0120150001234");

    // Invalid format
    const invalid = validateDocumentNumber("DRIVING_LICENSE", "12345");
    expect(invalid.valid).toBe(false);
  });

  it("should validate PAN correctly", () => {
    // Valid: 5 letters, 4 numbers, 1 letter
    const valid = validateDocumentNumber("PAN", "ABCDE1234F");
    expect(valid.valid).toBe(true);

    // Invalid (wrong casing/character counts)
    const invalid = validateDocumentNumber("PAN", "12345ABCDE");
    expect(invalid.valid).toBe(false);
  });

  it("should validate Voter ID (EPIC) correctly", () => {
    // Valid: 3 letters, 7 digits
    const valid = validateDocumentNumber("VOTER_ID", "ABC1234567");
    expect(valid.valid).toBe(true);

    const invalid = validateDocumentNumber("VOTER_ID", "AB123");
    expect(invalid.valid).toBe(false);
  });

  it("should validate Ration Card correctly", () => {
    // Valid: 8 to 18 uppercase alphanumeric
    const valid = validateDocumentNumber("RATION_CARD", "RC1234567890");
    expect(valid.valid).toBe(true);

    const invalid = validateDocumentNumber("RATION_CARD", "RC12");
    expect(invalid.valid).toBe(false);
  });
});

describe("Document Masking Helper", () => {
  it("should mask PAN appropriately", () => {
    const masked = maskDocumentNumber("ABCDE1234F", "PAN");
    expect(masked).toBe("AB••••••F");
  });

  it("should mask general documents preserving only trailing characters", () => {
    const masked = maskDocumentNumber("DL0120150001234", "DRIVING_LICENSE");
    expect(masked).toContain("1234");
    expect(masked).toContain("••••");
  });
});

describe("Magic Bytes MIME Inspection", () => {
  it("should identify valid PDF magic bytes", () => {
    const pdfBuf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
    const res = verifyMagicBytes(pdfBuf);
    expect(res.valid).toBe(true);
    expect(res.mime).toBe("application/pdf");
  });

  it("should identify valid JPEG magic bytes", () => {
    const jpegBuf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const res = verifyMagicBytes(jpegBuf);
    expect(res.valid).toBe(true);
    expect(res.mime).toBe("image/jpeg");
  });

  it("should identify valid PNG magic bytes", () => {
    const pngBuf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const res = verifyMagicBytes(pngBuf);
    expect(res.valid).toBe(true);
    expect(res.mime).toBe("image/png");
  });

  it("should reject invalid / executable disguised files", () => {
    const exeBuf = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // MZ DOS header
    const res = verifyMagicBytes(exeBuf);
    expect(res.valid).toBe(false);
  });
});
