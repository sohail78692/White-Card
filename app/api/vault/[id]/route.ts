import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { verifyCsrfOrigin } from "@/lib/auth/csrf";
import { decryptField } from "@/lib/crypto/aead";
import { recordAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const doc = await db.collection("documents").findOne({
      _id: new ObjectId(params.id),
      userId: new ObjectId(user.userId),
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const decryptedNumber = decryptField(user.dek, doc.numberEnc, `${user.userId}:number`);
    let details = {};
    try {
      const rawDetails = JSON.parse(decryptField(user.dek, doc.detailsEnc, `${user.userId}:details`));
      const { sanitizeDetailsForType } = await import("@/lib/validators/documents");
      details = sanitizeDetailsForType(doc.type, rawDetails);
    } catch {
      details = {};
    }

    return NextResponse.json({
      document: {
        id: doc._id.toString(),
        type: doc.type,
        customTitle: doc.customTitle,
        number: decryptedNumber,
        maskedNumber: doc.maskedNumber,
        issuer: doc.issuer,
        expiry: doc.expiry,
        status: doc.status,
        details,
        createdAt: doc.createdAt,
      },
    });
  } catch (error) {
    logger.error({ error }, "Error getting single vault document");
    return NextResponse.json({ error: "Failed to retrieve document" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrf = verifyCsrfOrigin(req);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.reason || "CSRF check failed" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const docObjId = new ObjectId(params.id);
    const userObjId = new ObjectId(user.userId);

    const doc = await db.collection("documents").findOne({
      _id: docObjId,
      userId: userObjId,
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete document
    await db.collection("documents").deleteOne({ _id: docObjId });

    // Delete associated attachments
    await db.collection("attachments").deleteMany({ documentId: docObjId });

    // Delete ration balances/ledgers if any
    await db.collection("ration_balances").deleteMany({ documentId: docObjId });
    await db.collection("ration_ledger").deleteMany({ documentId: docObjId });

    // Record audit entry
    await recordAuditLog({
      userId: user.userId,
      actor: "user",
      action: "delete_document",
      fields: ["type", "document_id"],
      result: "success",
    });

    return NextResponse.json({ success: true, message: "Document removed from vault" });
  } catch (error) {
    logger.error({ error }, "Error deleting vault document");
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const docObjId = new ObjectId(params.id);
    const userObjId = new ObjectId(user.userId);

    const doc = await db.collection("documents").findOne({
      _id: docObjId,
      userId: userObjId,
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const body = await req.json();
    const updates: Record<string, any> = { updatedAt: new Date() };

    // Update document number if provided
    if (body.number) {
      const { validateDocumentNumber, maskDocumentNumber } = await import("@/lib/validators/documents");
      const { encryptField } = await import("@/lib/crypto/aead");
      const { deriveBlindKey, computeBlindIndex } = await import("@/lib/crypto/hkdf");
      const { getEnv } = await import("@/lib/env");

      const validation = validateDocumentNumber(doc.type, body.number.trim());
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error || "Invalid ID number format" }, { status: 400 });
      }

      const normalizedNumber = validation.normalized;
      updates.maskedNumber = maskDocumentNumber(normalizedNumber, doc.type);
      updates.numberEnc = encryptField(user.dek, normalizedNumber, `${user.userId}:number`);

      const env = getEnv();
      const blindKey = deriveBlindKey(env.MASTER_KEY);
      updates.numberBlindIdx = computeBlindIndex(blindKey, normalizedNumber);
    }

    // Update custom title or issuer if provided
    if (body.customTitle !== undefined) updates.customTitle = body.customTitle;
    if (body.issuer !== undefined) updates.issuer = body.issuer;

    // Update details if provided
    if (body.details && typeof body.details === "object") {
      const { encryptField, decryptField } = await import("@/lib/crypto/aead");
      const { sanitizeDetailsForType } = await import("@/lib/validators/documents");
      let existingDetails = {};
      try {
        existingDetails = JSON.parse(decryptField(user.dek, doc.detailsEnc, `${user.userId}:details`));
      } catch {
        existingDetails = {};
      }
      const mergedDetails = sanitizeDetailsForType(doc.type, { ...existingDetails, ...body.details });
      updates.detailsEnc = encryptField(user.dek, JSON.stringify(mergedDetails), `${user.userId}:details`);
    }

    await db.collection("documents").updateOne(
      { _id: docObjId, userId: userObjId },
      { $set: updates }
    );

    // Fetch updated document
    const updatedDoc = await db.collection("documents").findOne({ _id: docObjId });
    const { decryptField } = await import("@/lib/crypto/aead");
    const { sanitizeDetailsForType } = await import("@/lib/validators/documents");
    const decryptedNumber = decryptField(user.dek, updatedDoc!.numberEnc, `${user.userId}:number`);
    let details = {};
    try {
      const rawDetails = JSON.parse(decryptField(user.dek, updatedDoc!.detailsEnc, `${user.userId}:details`));
      details = sanitizeDetailsForType(updatedDoc!.type, rawDetails);
    } catch {
      details = {};
    }

    return NextResponse.json({
      success: true,
      document: {
        id: updatedDoc!._id.toString(),
        type: updatedDoc!.type,
        customTitle: updatedDoc!.customTitle,
        number: decryptedNumber,
        maskedNumber: updatedDoc!.maskedNumber,
        issuer: updatedDoc!.issuer,
        expiry: updatedDoc!.expiry,
        status: updatedDoc!.status,
        details,
      },
    });
  } catch (error: any) {
    logger.error({ error }, "Error updating vault document");
    return NextResponse.json({ error: error.message || "Failed to update document" }, { status: 500 });
  }
}
