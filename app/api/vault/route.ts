import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { verifyCsrfOrigin } from "@/lib/auth/csrf";
import { encryptField, decryptField } from "@/lib/crypto/aead";
import { deriveBlindKey, computeBlindIndex } from "@/lib/crypto/hkdf";
import {
  createDocumentSchema,
  validateDocumentNumber,
  maskDocumentNumber,
  DocumentType,
} from "@/lib/validators/documents";
import { recordAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const userObjId = new ObjectId(user.userId);

    const docs = await db
      .collection("documents")
      .find({ userId: userObjId })
      .sort({ createdAt: -1 })
      .toArray();

    // Get attachment counts
    const attachments = await db
      .collection("attachments")
      .find({ userId: userObjId })
      .toArray();

    const attachmentCountMap = new Map<string, number>();
    for (const att of attachments) {
      const docIdStr = att.documentId.toString();
      attachmentCountMap.set(docIdStr, (attachmentCountMap.get(docIdStr) || 0) + 1);
    }

    const decryptedList = docs.map((doc) => {
      let details: Record<string, unknown> = {};
      try {
        const rawJson = decryptField(user.dek, doc.detailsEnc, `${user.userId}:details`);
        details = JSON.parse(rawJson);
      } catch {
        details = {};
      }

      // Check expiry status
      let status = doc.status || "self_declared";
      if (doc.expiry && new Date(doc.expiry) < new Date()) {
        status = "expired";
      }

      return {
        id: doc._id.toString(),
        type: doc.type,
        customTitle: doc.customTitle,
        maskedNumber: doc.maskedNumber,
        issuer: doc.issuer,
        expiry: doc.expiry,
        status,
        details,
        attachmentCount: attachmentCountMap.get(doc._id.toString()) || 0,
        createdAt: doc.createdAt,
      };
    });

    return NextResponse.json({ documents: decryptedList });
  } catch (error) {
    logger.error({ error }, "Error fetching vault documents");
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const csrf = verifyCsrfOrigin(req);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.reason || "CSRF check failed" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid document payload" },
        { status: 400 }
      );
    }

    const { type, customTitle, number, issuer, expiry, details } = parsed.data;

    // Validate type-specific number format
    const validation = validateDocumentNumber(type as DocumentType, number);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const normalizedNumber = validation.normalized;
    const maskedNumber = maskDocumentNumber(normalizedNumber, type as DocumentType);

    // Compute blind index for duplicate detection
    const env = getEnv();
    const blindKey = deriveBlindKey(env.MASTER_KEY);
    const numberBlindIdx = computeBlindIndex(blindKey, normalizedNumber);

    const db = await getDb();
    const userObjId = new ObjectId(user.userId);

    // Check if user has already added this document
    const existing = await db.collection("documents").findOne({
      userId: userObjId,
      numberBlindIdx,
    });

    if (existing) {
      return NextResponse.json(
        { error: "This document is already linked to your wallet." },
        { status: 409 }
      );
    }

    // Encrypt sensitive fields with user DEK
    const numberEnc = encryptField(user.dek, normalizedNumber, `${user.userId}:number`);
    const detailsEnc = encryptField(user.dek, JSON.stringify(details || {}), `${user.userId}:details`);

    const docId = new ObjectId();
    const now = new Date();

    const newDoc = {
      _id: docId,
      userId: userObjId,
      type,
      customTitle: customTitle || undefined,
      numberEnc,
      numberBlindIdx,
      maskedNumber,
      issuer,
      detailsEnc,
      expiry: expiry || undefined,
      status: "self_declared",
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("documents").insertOne(newDoc);

    // If Ration Card, initialize ration balance record for current month
    if (type === "RATION_CARD") {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const riceQuota = Number(details?.monthlyRiceQuotaKg) || 20;
      const wheatQuota = Number(details?.monthlyWheatQuotaKg) || 15;

      await db.collection("ration_balances").updateOne(
        { documentId: docId, month: currentMonth },
        {
          $setOnInsert: {
            userId: userObjId,
            documentId: docId,
            month: currentMonth,
            rice: riceQuota,
            wheat: wheatQuota,
            updatedAt: now,
          },
        },
        { upsert: true }
      );
    }

    // Record audit log
    await recordAuditLog({
      userId: user.userId,
      actor: "user",
      action: "link_document",
      fields: ["type", "document_number", "issuer", "details"],
      result: "success",
    });

    return NextResponse.json({
      success: true,
      document: {
        id: docId.toString(),
        type,
        customTitle,
        maskedNumber,
        issuer,
        expiry,
        status: "self_declared",
        details,
        createdAt: now,
      },
    });
  } catch (error) {
    logger.error({ error }, "Error saving document to vault");
    return NextResponse.json({ error: "Failed to store document securely" }, { status: 500 });
  }
}
