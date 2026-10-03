import { z } from "zod";
import { normalizeDocumentNumber } from "@/lib/crypto/hkdf";

export type DocumentType =
  | "DRIVING_LICENSE"
  | "PAN"
  | "VOTER_ID"
  | "RATION_CARD"
  | "RANDOM";

export interface DocumentTypeMeta {
  type: DocumentType;
  title: string;
  shortCode: string;
  category: "Identity" | "Financial" | "Welfare" | "Random";
  numberLabel: string;
  placeholder: string;
  regex: RegExp;
  hint: string;
  gradient: string;
  accentColor: string;
}

export const DOCUMENT_TYPES: Record<DocumentType, DocumentTypeMeta> = {
  DRIVING_LICENSE: {
    type: "DRIVING_LICENSE",
    title: "Driving License",
    shortCode: "DL",
    category: "Identity",
    numberLabel: "DL Number",
    placeholder: "DL0120150001234",
    // 2 alpha state code + 2 numeric RTO + 4 digit year + 7 digits
    regex: /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/,
    hint: "15-16 alphanumeric characters: 2-letter state code, 2-digit RTO, 4-digit issue year, followed by 7 digits.",
    gradient: "from-[#2563eb] to-[#1d4ed8]",
    accentColor: "#38bdf8",
  },
  PAN: {
    type: "PAN",
    title: "PAN Card",
    shortCode: "PAN",
    category: "Financial",
    numberLabel: "PAN Number",
    placeholder: "ABCDE1234F",
    regex: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    hint: "10 alphanumeric characters: 5 uppercase letters, 4 digits, and 1 uppercase letter.",
    gradient: "from-[#7c3aed] to-[#6366f1]",
    accentColor: "#a78bfa",
  },
  VOTER_ID: {
    type: "VOTER_ID",
    title: "Voter ID",
    shortCode: "EPIC",
    category: "Identity",
    numberLabel: "EPIC Number",
    placeholder: "ABC1234567",
    regex: /^[A-Z]{3}[0-9]{7}$/,
    hint: "10 characters: 3 uppercase letters followed by 7 digits.",
    gradient: "from-[#10b981] to-[#059669]",
    accentColor: "#34d399",
  },
  RATION_CARD: {
    type: "RATION_CARD",
    title: "Ration Card",
    shortCode: "RC",
    category: "Welfare",
    numberLabel: "Ration Card Number",
    placeholder: "RC1234567890",
    regex: /^[A-Z0-9]{8,18}$/,
    hint: "8 to 18 uppercase alphanumeric characters.",
    gradient: "from-[#f59e0b] to-[#d97706]",
    accentColor: "#fbbf24",
  },
  RANDOM: {
    type: "RANDOM",
    title: "Random",
    shortCode: "RND",
    category: "Random",
    numberLabel: "Document ID / Number",
    placeholder: "e.g. DOC-9842 or ANY-ID-1234",
    regex: /^.{1,100}$/,
    hint: "Any custom ID, registration number, or identifier.",
    gradient: "from-[#ec4899] to-[#be185d]",
    accentColor: "#f472b6",
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

  // General default: mask all but the last 4 characters
  const visible = normalizedNumber.slice(-4);
  const maskedCount = Math.max(4, len - 4);
  return `${"•".repeat(maskedCount)} ${visible}`;
}

export const ALLOWED_DETAILS_BY_TYPE: Record<DocumentType, string[]> = {
  PAN: [
    "name",
    "fullName",
    "fatherName",
    "dob",
    "taxpayerCategory",
    "aadhaarLinked",
    "status",
    "cardStatus",
    "issueDate",
  ],
  DRIVING_LICENSE: [
    "name",
    "fullName",
    "fatherName",
    "dob",
    "vehicleClasses",
    "organDonor",
    "rto",
    "state",
    "issueState",
    "bloodGroup",
    "issueDate",
    "validityDate",
  ],
  VOTER_ID: [
    "name",
    "fullName",
    "fatherName",
    "dob",
    "gender",
    "acNumber",
    "pollingBooth",
    "parliamentaryConstituency",
    "partSerial",
    "state",
    "district",
    "issueDate",
  ],
  RATION_CARD: [
    "name",
    "fullName",
    "cardholderName",
    "category",
    "scheme",
    "fpsDepotId",
    "familyMembersCount",
    "familyMembers",
    "monthlyRiceQuotaKg",
    "monthlyWheatQuotaKg",
    "state",
    "issueDate",
  ],
  RANDOM: [
    "name",
    "fullName",
    "cardholderName",
    "notes",
    "dob",
    "category",
    "department",
    "organization",
    "validityDate",
    "issueDate",
  ],
};

export function sanitizeDetailsForType(type: DocumentType, details: Record<string, any>): Record<string, any> {
  if (type === "RANDOM") {
    // For random/custom documents, preserve any key-value pairs the user adds
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(details || {})) {
      if (val !== undefined && val !== null && val !== "") {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }

  const allowed = ALLOWED_DETAILS_BY_TYPE[type] || [];
  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(details || {})) {
    if (allowed.includes(key) && val !== undefined && val !== null && val !== "") {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export const createDocumentSchema = z.object({
  type: z.enum([
    "DRIVING_LICENSE",
    "PAN",
    "VOTER_ID",
    "RATION_CARD",
    "RANDOM",
  ]),
  customTitle: z.string().optional(),
  number: z.string().min(1, "Document number is required"),
  issuer: z.string().min(1, "Issuer is required"),
  expiry: z.string().optional(), // YYYY-MM-DD
  details: z.record(z.any()).default({}),
});
