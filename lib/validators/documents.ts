import { z } from "zod";
import { normalizeDocumentNumber } from "@/lib/crypto/hkdf";

export type DocumentType =
  | "DRIVING_LICENSE"
  | "PAN"
  | "VOTER_ID"
  | "RATION_CARD"
  | "PASSPORT"
  | "AYUSHMAN_BHARAT"
  | "E_SHRAM"
  | "UDID"
  | "CUSTOM";

export interface DocumentTypeMeta {
  type: DocumentType;
  title: string;
  category: "Identity" | "Financial" | "Welfare";
  numberLabel: string;
  placeholder: string;
  regex: RegExp;
  hint: string;
}

export const DOCUMENT_TYPES: Record<DocumentType, DocumentTypeMeta> = {
  DRIVING_LICENSE: {
    type: "DRIVING_LICENSE",
    title: "Driving License",
    category: "Identity",
    numberLabel: "DL Number",
    placeholder: "DL0120150001234",
    // 2 alpha state code + 2 numeric RTO + 4 digit year + 7 digits
    regex: /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/,
    hint: "15-16 alphanumeric characters: 2-letter state code, 2-digit RTO, 4-digit issue year, followed by 7 digits.",
  },
  PAN: {
    type: "PAN",
    title: "PAN Card",
    category: "Financial",
    numberLabel: "PAN Number",
    placeholder: "ABCDE1234F",
    regex: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    hint: "10 alphanumeric characters: 5 uppercase letters, 4 digits, and 1 uppercase letter.",
  },
  VOTER_ID: {
    type: "VOTER_ID",
    title: "Voter ID (EPIC)",
    category: "Identity",
    numberLabel: "EPIC Number",
    placeholder: "ABC1234567",
    regex: /^[A-Z]{3}[0-9]{7}$/,
    hint: "10 characters: 3 uppercase letters followed by 7 digits.",
  },
  RATION_CARD: {
    type: "RATION_CARD",
    title: "Ration Card",
    category: "Welfare",
    numberLabel: "Ration Card Number",
    placeholder: "RC1234567890",
    regex: /^[A-Z0-9]{8,18}$/,
    hint: "8 to 18 uppercase alphanumeric characters.",
  },
  PASSPORT: {
    type: "PASSPORT",
    title: "Passport",
    category: "Identity",
    numberLabel: "Passport Number",
    placeholder: "A1234567",
    regex: /^[A-Z][0-9]{7}$/,
    hint: "1 uppercase letter followed by 7 digits.",
  },
  AYUSHMAN_BHARAT: {
    type: "AYUSHMAN_BHARAT",
    title: "Ayushman Bharat PM-JAY",
    category: "Welfare",
    numberLabel: "PM-JAY ID",
    placeholder: "PMJAY1234567",
    regex: /^[A-Z0-9]{9,16}$/,
    hint: "9 to 16 alphanumeric characters.",
  },
  E_SHRAM: {
    type: "E_SHRAM",
    title: "e-Shram Card",
    category: "Welfare",
    numberLabel: "UAN (12 digits)",
    placeholder: "123456789012",
    regex: /^[0-9]{12}$/,
    hint: "12 numeric digits Universal Account Number.",
  },
  UDID: {
    type: "UDID",
    title: "UDID Card",
    category: "Welfare",
    numberLabel: "UDID Number",
    placeholder: "DL1234567890123456",
    regex: /^[A-Z]{2}[0-9]{16}$/,
    hint: "2 uppercase letters followed by 16 numeric digits.",
  },
  CUSTOM: {
    type: "CUSTOM",
    title: "Custom Document",
    category: "Identity",
    numberLabel: "Document ID / Number",
    placeholder: "DOC-987654321",
    regex: /^.{3,32}$/,
    hint: "3 to 32 characters.",
  },
};

/**
 * Validates a document number against its type specification.
 */
export function validateDocumentNumber(type: DocumentType, rawNumber: string): { valid: boolean; normalized: string; error?: string } {
  const meta = DOCUMENT_TYPES[type];
  if (!meta) {
    return { valid: false, normalized: "", error: "Unknown document type" };
  }

  const normalized = normalizeDocumentNumber(rawNumber);
  if (!meta.regex.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: `Invalid format for ${meta.title}. ${meta.hint}`,
    };
  }

  return { valid: true, normalized };
}

/**
 * Masks a document number for secure UI display.
 * Never displays full plaintext identifiers in the UI.
 */
export function maskDocumentNumber(normalizedNumber: string, type: DocumentType): string {
  if (!normalizedNumber) return "••••••••";
  const len = normalizedNumber.length;
  if (len <= 4) {
    return "••••" + normalizedNumber.slice(-2);
  }

  if (type === "PAN") {
    // Show first 2 and last 1: AB••••••F
    return `${normalizedNumber.slice(0, 2)}••••••${normalizedNumber.slice(-1)}`;
  }

  if (type === "E_SHRAM") {
    // Show last 4: •••• •••• 1234
    return `•••• •••• ${normalizedNumber.slice(-4)}`;
  }

  // General default: mask all but the last 4 characters
  const visible = normalizedNumber.slice(-4);
  const maskedCount = Math.max(4, len - 4);
  return `${"•".repeat(maskedCount)} ${visible}`;
}

export const createDocumentSchema = z.object({
  type: z.enum([
    "DRIVING_LICENSE",
    "PAN",
    "VOTER_ID",
    "RATION_CARD",
    "PASSPORT",
    "AYUSHMAN_BHARAT",
    "E_SHRAM",
    "UDID",
    "CUSTOM",
  ]),
  customTitle: z.string().optional(),
  number: z.string().min(1, "Document number is required"),
  issuer: z.string().min(1, "Issuer is required"),
  expiry: z.string().optional(), // YYYY-MM-DD
  details: z.record(z.any()).default({}),
});
