import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { verifyCsrfOrigin } from "@/lib/auth/csrf";
import jsQR from "jsqr";
import { createWorker } from "tesseract.js";
import { logger } from "@/lib/logger";

import path from "path";

export const dynamic = "force-dynamic";

interface ExtractedData {
  detectedType: "PAN" | "DRIVING_LICENSE" | "VOTER_ID" | "RATION_CARD" | null;
  number: string | null;
  name: string | null;
  fatherName: string | null;
  dob: string | null;
  issuer: string | null;
  rawSnippet?: string;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const filename = file.name || "";
    const buffer = Buffer.from(await file.arrayBuffer());

    const result: ExtractedData = {
      detectedType: null,
      number: null,
      name: null,
      fatherName: null,
      dob: null,
      issuer: null,
    };

    // 1. FAST CHECK: Extract from filename (e.g. in.gov.pan-PANCR-FORPA5522R.pdf)
    const panFilenameMatch = filename.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/i);
    const dlFilenameMatch = filename.match(/\b([A-Z]{2}[0-9]{13,15})\b/i);
    const voterFilenameMatch = filename.match(/\b([A-Z]{3}[0-9]{7})\b/i);
    const rcFilenameMatch = filename.match(/\b(RC[0-9]{10,12})\b/i);

    if (panFilenameMatch && panFilenameMatch[1].toUpperCase() !== "ABCDE1234F") {
      result.detectedType = "PAN";
      result.number = panFilenameMatch[1].toUpperCase();
      result.issuer = "Income Tax Department";
    } else if (dlFilenameMatch) {
      result.detectedType = "DRIVING_LICENSE";
      result.number = dlFilenameMatch[1].toUpperCase();
      result.issuer = "Ministry of Road Transport & Highways";
    } else if (voterFilenameMatch) {
      result.detectedType = "VOTER_ID";
      result.number = voterFilenameMatch[1].toUpperCase();
      result.issuer = "Election Commission";
    } else if (rcFilenameMatch) {
      result.detectedType = "RATION_CARD";
      result.number = rcFilenameMatch[1].toUpperCase();
      result.issuer = "Department of Food and Civil Supplies";
    }

    let extractedText = "";

    // 2. PARSE PDF CONTENT
    if (file.type === "application/pdf" || filename.toLowerCase().endsWith(".pdf")) {
      try {
        extractedText = buffer.toString("latin1");
      } catch (pdfErr) {
        logger.warn({ pdfErr }, "PDF text read failed");
        extractedText = buffer.toString("utf-8");
      }
    } else if (file.type.startsWith("image/") || /\.(jpe?g|png|webp|bmp|gif)$/i.test(filename) || buffer.length > 0) {
      // 3. OCR ON IMAGE
      try {
        const workerPath = path.resolve(process.cwd(), "node_modules/tesseract.js/src/worker-script/node/index.js");
        const worker = await createWorker("eng", 1, { workerPath });
        const ret = await worker.recognize(buffer);
        extractedText = ret.data.text || "";
        await worker.terminate();
      } catch (ocrErr) {
        logger.warn({ ocrErr }, "Tesseract OCR recognition failed");
      }
    }

    if (extractedText) {
      result.rawSnippet = extractedText.slice(0, 500);

      const isPlaceholder = (s: string) => s.toUpperCase() === "ABCDE1234F";

      // --- PAN NUMBER EXTRACTION ---
      // 1. Direct standard match: 5 uppercase letters, 4 digits, 1 letter
      const directMatches = Array.from(extractedText.matchAll(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/g)).map((m) => m[1].toUpperCase());
      const validDirect = directMatches.find((m) => !isPlaceholder(m));
      if (validDirect) {
        result.detectedType = "PAN";
        result.number = validDirect;
        result.issuer = "Income Tax Department";
      }

      // 2. Tolerance for OCR artifact / S-5 doubling (e.g. FORPAS5522R -> FORPA5522R)
      if (!result.number) {
        const fuzzyMatches = Array.from(extractedText.matchAll(/\b([A-Z]{5})[A-Z0-9]?([0-9]{4}[A-Z])\b/g)).map((m) => (m[1] + m[2]).toUpperCase());
        const validFuzzy = fuzzyMatches.find((m) => !isPlaceholder(m));
        if (validFuzzy) {
          result.detectedType = "PAN";
          result.number = validFuzzy;
          result.issuer = "Income Tax Department";
        }
      }

      // 3. Scan line-by-line around keywords (Permanent Account, Account Number, etc.)
      if (!result.number) {
        const lines = extractedText.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (/account|permanent|संख्या|कार्ड|income\s*tax/i.test(lines[i])) {
            for (let j = i; j <= Math.min(i + 4, lines.length - 1); j++) {
              const cleaned = lines[j].replace(/[^A-Za-z0-9]/g, "").toUpperCase();
              if (cleaned.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleaned)) {
                result.detectedType = "PAN";
                result.number = cleaned;
                result.issuer = "Income Tax Department";
                break;
              }
              if (cleaned.length === 11 && /^[A-Z]{5}/.test(cleaned)) {
                const candidate = cleaned.slice(0, 5) + cleaned.slice(6);
                if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(candidate)) {
                  result.detectedType = "PAN";
                  result.number = candidate;
                  result.issuer = "Income Tax Department";
                  break;
                }
              }
            }
          }
          if (result.number) break;
        }
      }

      // Search for Driving License: 2 letters, followed by 13-15 numbers/spaces
      const dlMatch = extractedText.match(/\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{11,13})\b/);
      if (dlMatch && !result.number) {
        result.detectedType = "DRIVING_LICENSE";
        result.number = dlMatch[1].replace(/[-\s]/g, "").toUpperCase();
        result.issuer = "Ministry of Road Transport & Highways";
      }

      // Search for Voter ID (EPIC): 3 letters, 7 digits
      const voterMatch = extractedText.match(/\b([A-Z]{3}[0-9]{7})\b/);
      if (voterMatch && !result.number) {
        result.detectedType = "VOTER_ID";
        result.number = voterMatch[1].toUpperCase();
        result.issuer = "Election Commission";
      }

      // Helper to clean person names of OCR noise and instructions
      const cleanPersonName = (str: string): string => {
        const noise = [
          "income", "tax", "department", "govt", "india", "permanent",
          "account", "number", "card", "signature", "date", "birth",
          "father", "fathers", "name", "pan_front", "pan_back", "rotate", "crop", "edit",
          "link", "document", "select", "credential", "photos", "return", "inform",
          "je", "ca", "srt", "are", "nform", "left", "right", "valid", "until", "expiry"
        ];
        const words = str.replace(/[^A-Za-z\s]/g, " ").split(/\s+/).filter(Boolean);
        const valid: string[] = [];
        for (const w of words) {
          if (noise.includes(w.toLowerCase())) break;
          if (w.length >= 2) valid.push(w.toUpperCase());
        }
        return valid.slice(0, 3).join(" ");
      };

      // Extract Date of Birth: DD/MM/YYYY or DD-MM-YYYY
      const dobMatch = extractedText.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/);
      if (dobMatch) {
        result.dob = dobMatch[1].replace(/[\-\.]/g, "/");
      }

      // Extract Father's Name if labeled
      const fatherMatch = extractedText.match(/(?:Father(?:'s)?\s*Name|पिता(?: का नाम)?)\s*[:\-]?\s*([A-Za-z\s]+)/i);
      if (fatherMatch) {
        const cleaned = cleanPersonName(fatherMatch[1].split("\n")[0]);
        if (cleaned.length >= 3) {
          result.fatherName = cleaned;
        }
      }

      // Extract Name if labeled
      const nameMatch = extractedText.match(/(?:Name|नाम)\s*[:\-]?\s*([A-Za-z\s]+)/i);
      if (nameMatch) {
        const cleaned = cleanPersonName(nameMatch[1].split("\n")[0]);
        if (cleaned.length >= 3) {
          result.name = cleaned;
        }
      }

      // Positional Fallback for PAN card lines
      if (!result.name || !result.fatherName) {
        const lines = extractedText.split("\n").map((l) => l.trim()).filter((l) => l.length >= 3);
        const candidates: string[] = [];
        for (const line of lines) {
          const cleaned = cleanPersonName(line);
          if (cleaned.length >= 3 && cleaned.includes(" ") && !candidates.includes(cleaned)) {
            candidates.push(cleaned);
          }
        }

        if (!result.name && candidates.length > 0) {
          result.name = candidates[0];
        }
        if (!result.fatherName && candidates.length > 1) {
          result.fatherName = candidates[1];
        }
      }
    }

    return NextResponse.json({
      success: true,
      extracted: result,
    });
  } catch (error: any) {
    logger.error({ error }, "Error extracting document data");
    return NextResponse.json({ error: error.message || "Extraction failed" }, { status: 500 });
  }
}
