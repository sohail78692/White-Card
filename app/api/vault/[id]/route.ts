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
      details = JSON.parse(decryptField(user.dek, doc.detailsEnc, `${user.userId}:details`));
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
