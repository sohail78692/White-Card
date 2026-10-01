import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { verifyCsrfOrigin } from "@/lib/auth/csrf";
import { encryptField } from "@/lib/crypto/aead";
import {
  verifyMagicBytes,
  scanUpload,
  MAX_ATTACHMENTS_PER_USER,
  MAX_ATTACHMENT_SIZE_BYTES,
} from "@/lib/attachments";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

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
    const docObjId = new ObjectId(params.id);
    const userObjId = new ObjectId(user.userId);

    const attachments = await db
      .collection("attachments")
      .find({ documentId: docObjId, userId: userObjId })
      .toArray();

    const list = attachments.map((att) => ({
      id: att._id.toString(),
      filename: att.filename,
      mime: att.mime,
      size: att.size,
      createdAt: att.createdAt,
    }));

    return NextResponse.json({ attachments: list });
  } catch (error) {
    logger.error({ error }, "Error fetching attachments");
    return NextResponse.json({ error: "Failed to list attachments" }, { status: 500 });
  }
}

export async function POST(
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

    // Verify document belongs to user
    const doc = await db.collection("documents").findOne({ _id: docObjId, userId: userObjId });
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check user's total attachment quota
    const totalCount = await db.collection("attachments").countDocuments({ userId: userObjId });
    if (totalCount >= MAX_ATTACHMENTS_PER_USER) {
      return NextResponse.json(
        { error: `Attachment quota reached (maximum ${MAX_ATTACHMENTS_PER_USER} files per user)` },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 500 KB limit" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Verify Magic Bytes (PDF/JPEG/PNG)
    const magicCheck = verifyMagicBytes(buffer);
    if (!magicCheck.valid || !magicCheck.mime) {
      return NextResponse.json({ error: magicCheck.error || "Invalid file header" }, { status: 400 });
    }

    // 2. Scan Upload Hook (antivirus inspection stub)
    const scan = await scanUpload(buffer, file.name);
    if (!scan.safe) {
      return NextResponse.json({ error: scan.reason || "File rejected by security scanner" }, { status: 400 });
    }

    // 3. Encrypt data and name with user DEK
    const attId = new ObjectId();
    const dataEnc = encryptField(user.dek, buffer, `${user.userId}:attachment:${attId.toString()}`);
    const nameEnc = encryptField(user.dek, file.name, `${user.userId}:attachment_name:${attId.toString()}`);

    await db.collection("attachments").insertOne({
      _id: attId,
      userId: userObjId,
      documentId: docObjId,
      filename: file.name,
      nameEnc,
      dataEnc,
      mime: magicCheck.mime,
      size: file.size,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      attachment: {
        id: attId.toString(),
        filename: file.name,
        mime: magicCheck.mime,
        size: file.size,
      },
    });
  } catch (error) {
    logger.error({ error }, "Error uploading attachment");
    return NextResponse.json({ error: "Failed to upload attachment" }, { status: 500 });
  }
}
