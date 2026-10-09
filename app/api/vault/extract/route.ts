import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createWorker } from "tesseract.js";
import { logger } from "@/lib/logger";
import path from "path";

export const dynamic = "force-dynamic";

interface ExtractedData {
  detectedType: "PAN" | "DRIVING_LICENSE" | "VOTER_ID" | "RATION_CARD" | "OTHER" | null;
  number: string | null;
  name: string | null;
  fatherName: string | null;
  dob: string | null;
  address?: string | null;
  issuer: string | null;
  vehicleClasses?: string[] | null;
  validUntil?: string | null;
  rto?: string | null;
  category?: string | null;
  familyMembers?: string[] | null;
  rawSnippet?: string;
  engine?: "gemini-flash" | "tesseract-regex";
}

// Helper to determine accurate MIME type
function getMimeType(file: File | null, filename: string): string {
  if (file && file.type && file.type !== "application/octet-stream") {
    return file.type;
  }
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}

// -------------------------------------------------------------
// ENGINE 1: GOOGLE GEMINI 3.8 FLASH VISION (FRONT + BACK + PDF)
// -------------------------------------------------------------
async function extractWithGemini(
  apiKey: string,
  frontBuffer: Buffer,
  frontMime: string,
  frontFilename: string,
  backBuffer?: Buffer | null,
  backMime?: string | null,
  backFilename?: string | null
): Promise<ExtractedData | null> {
  const models = [
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
  ];

  const promptText = `You are a high-accuracy government document and ID card parser specializing in Indian identification credentials (Driving License, PAN Card, Voter ID / EPIC, Ration Card, Aadhaar, Passport).
You are provided with document file(s) which may include:
1. Front side of the card, and/or
2. Back side of the card (containing address, expiry, vehicle categories, etc.), or
3. A multi-page / scanned PDF.

Carefully examine all provided images/pages. Combine and cross-correlate information from BOTH sides.
Extract the structured data and return a JSON object with this EXACT structure:
{
  "detectedType": "PAN" | "DRIVING_LICENSE" | "VOTER_ID" | "RATION_CARD" | "OTHER",
  "number": "exact formatted ID number without OCR spaces",
  "name": "full name of the individual or null",
  "fatherName": "father's / husband's / guardian's name or null",
  "dob": "date of birth in DD/MM/YYYY format or null",
  "address": "full residential address from back or front of document or null",
  "issuer": "issuing government department or null",
  "vehicleClasses": ["LMV", "MCWG"] or null (if Driving License),
  "validUntil": "expiry date in DD/MM/YYYY or null",
  "rto": "RTO code like DL-01, MH-02 or null",
  "category": "taxpayer/ration category if applicable or null",
  "familyMembers": ["list of member names"] or null
}

Strict Rules:
- For PAN: Number is strictly 5 uppercase letters, 4 digits, 1 uppercase letter (e.g., ABCDE1234F).
- For Driving License: Number has 2-letter state code + numbers (e.g., DL-0420240019283). Inspect both sides.
- For Voter ID (EPIC): 3 letters + 7 digits (e.g., ABC1234567).
- If address or validity is on the back side, merge it into the JSON.
- Standardize all dates to DD/MM/YYYY. Do not include markdown codeblocks, output pure JSON only.`;

  const parts: any[] = [{ text: promptText }];

  // Add front image / PDF
  parts.push({
    inlineData: {
      mimeType: frontMime,
      data: frontBuffer.toString("base64"),
    },
  });

  // Add back image if present
  if (backBuffer && backBuffer.length > 0 && backMime) {
    parts.push({
      inlineData: {
        mimeType: backMime,
        data: backBuffer.toString("base64"),
      },
    });
  }

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  };

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        logger.warn({ model, status: response.status, errText }, "Gemini API attempt error");
        continue; // Seamlessly try next model if 503 (high demand), 429 (rate limit), or 404
      }

      const data = await response.json();
      const candidateText =
        data.candidates?.[0]?.content?.parts?.find((p: any) => typeof p.text === "string")?.text ||
        data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText) continue;

      const parsed = JSON.parse(candidateText);

      return {
        detectedType: parsed.detectedType || null,
        number: parsed.number || null,
        name: parsed.name ? String(parsed.name).toUpperCase().trim() : null,
        fatherName: parsed.fatherName ? String(parsed.fatherName).toUpperCase().trim() : null,
        dob: parsed.dob || null,
        address: parsed.address || null,
        issuer: parsed.issuer || null,
        vehicleClasses: Array.isArray(parsed.vehicleClasses) ? parsed.vehicleClasses : null,
        validUntil: parsed.validUntil || null,
        rto: parsed.rto || null,
        category: parsed.category || null,
        familyMembers: Array.isArray(parsed.familyMembers) ? parsed.familyMembers : null,
        engine: "gemini-flash",
      };
    } catch (err: any) {
      logger.warn({ err, model }, "Gemini parsing error");
    }
  }

  return null;
}

// -------------------------------------------------------------
// ENGINE 2: LOCAL TESSERACT OCR + REGEX (OFFLINE FALLBACK)
// -------------------------------------------------------------
async function extractWithTesseract(
  buffer: Buffer,
  filename: string,
  fileType: string
): Promise<ExtractedData> {
  const result: ExtractedData = {
    detectedType: null,
    number: null,
    name: null,
    fatherName: null,
    dob: null,
    issuer: null,
    engine: "tesseract-regex",
  };

  // Fast check from filename
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

  if (fileType === "application/pdf" || filename.toLowerCase().endsWith(".pdf")) {
    try {
      extractedText = buffer.toString("latin1");
    } catch {
      extractedText = buffer.toString("utf-8");
    }
  } else if (fileType.startsWith("image/") || /\.(jpe?g|png|webp|bmp|gif)$/i.test(filename) || buffer.length > 0) {
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

    // PAN match
    const directMatches = Array.from(extractedText.matchAll(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/g)).map((m) => m[1].toUpperCase());
    const validDirect = directMatches.find((m) => !isPlaceholder(m));
    if (validDirect) {
      result.detectedType = "PAN";
      result.number = validDirect;
      result.issuer = "Income Tax Department";
    }

    // DL match
    const dlMatch = extractedText.match(/\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{11,13})\b/);
    if (dlMatch && !result.number) {
      result.detectedType = "DRIVING_LICENSE";
      result.number = dlMatch[1].replace(/[-\s]/g, "").toUpperCase();
      result.issuer = "Ministry of Road Transport & Highways";
    }

    // Voter ID match
    const voterMatch = extractedText.match(/\b([A-Z]{3}[0-9]{7})\b/);
    if (voterMatch && !result.number) {
      result.detectedType = "VOTER_ID";
      result.number = voterMatch[1].toUpperCase();
      result.issuer = "Election Commission";
    }

    // DOB match
    const dobMatch = extractedText.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/);
    if (dobMatch) {
      result.dob = dobMatch[1].replace(/[\-\.]/g, "/");
    }

    const cleanPersonName = (str: string): string => {
      const noise = [
        "income", "tax", "department", "govt", "india", "permanent",
        "account", "number", "card", "signature", "date", "birth",
        "father", "fathers", "name", "pan_front", "pan_back", "rotate", "crop", "edit",
      ];
      const words = str.replace(/[^A-Za-z\s]/g, " ").split(/\s+/).filter(Boolean);
      const valid: string[] = [];
      for (const w of words) {
        if (noise.includes(w.toLowerCase())) break;
        if (w.length >= 2) valid.push(w.toUpperCase());
      }
      return valid.slice(0, 3).join(" ");
    };

    const nameMatch = extractedText.match(/(?:Name|नाम)\s*[:\-]?\s*([A-Za-z\s]+)/i);
    if (nameMatch) {
      const cleaned = cleanPersonName(nameMatch[1].split("\n")[0]);
      if (cleaned.length >= 3) result.name = cleaned;
    }

    const fatherMatch = extractedText.match(/(?:Father(?:'s)?\s*Name|पिता(?: का नाम)?)\s*[:\-]?\s*([A-Za-z\s]+)/i);
    if (fatherMatch) {
      const cleaned = cleanPersonName(fatherMatch[1].split("\n")[0]);
      if (cleaned.length >= 3) result.fatherName = cleaned;
    }
  }

  return result;
}

// -------------------------------------------------------------
// POST HANDLER
// -------------------------------------------------------------
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const backFile = formData.get("backFile") as File | null;

    if (!file && !backFile) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const primaryFile = file || backFile!;
    const primaryFilename = primaryFile.name || "front_document.jpg";
    const primaryBuffer = Buffer.from(await primaryFile.arrayBuffer());
    const primaryMime = getMimeType(primaryFile, primaryFilename);

    let secondaryBuffer: Buffer | null = null;
    let secondaryMime: string | null = null;
    let secondaryFilename: string | null = null;

    if (file && backFile) {
      secondaryFilename = backFile.name || "back_document.jpg";
      secondaryBuffer = Buffer.from(await backFile.arrayBuffer());
      secondaryMime = getMimeType(backFile, secondaryFilename);
    }

    const geminiKey = process.env.GEMINI_API_KEY?.trim();

    // 1. Try Google Gemini Flash Vision Engine (Dual-side & PDF intelligence)
    if (geminiKey) {
      try {
        const geminiResult = await extractWithGemini(
          geminiKey,
          primaryBuffer,
          primaryMime,
          primaryFilename,
          secondaryBuffer,
          secondaryMime,
          secondaryFilename
        );

        if (geminiResult && (geminiResult.number || geminiResult.name || geminiResult.dob)) {
          return NextResponse.json({
            success: true,
            extracted: geminiResult,
          });
        }
      } catch (geminiErr) {
        logger.warn({ geminiErr }, "Gemini Flash extraction failed, falling back to local OCR");
      }
    }

    // 2. Fallback to Local Tesseract + Regex Engine
    const fallbackResult = await extractWithTesseract(primaryBuffer, primaryFilename, primaryMime);

    return NextResponse.json({
      success: true,
      extracted: fallbackResult,
    });
  } catch (error: any) {
    logger.error({ error }, "Error extracting document data");
    return NextResponse.json({ error: error.message || "Extraction failed" }, { status: 500 });
  }
}
