import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { verifyCsrfOrigin } from "@/lib/auth/csrf";
import { decryptFieldRaw } from "@/lib/crypto/aead";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; attId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const attObjId = new ObjectId(params.attId);
    const docObjId = new ObjectId(params.id);
    const userObjId = new ObjectId(user.userId);

    const att = await db.collection("attachments").findOne({
      _id: attObjId,
      documentId: docObjId,
      userId: userObjId,
    });

    if (!att) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Decrypt attachment raw bytes using user DEK
    const decryptedBuffer = decryptFieldRaw(
      user.dek,
      att.dataEnc,
      `${user.userId}:attachment:${att._id.toString()}`
    );

    return new NextResponse(new Uint8Array(decryptedBuffer), {
      status: 200,
      headers: {
        "Content-Type": att.mime || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(att.filename || "attachment")}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    logger.error({ error }, "Error decrypting attachment");
    return NextResponse.json({ error: "Failed to download attachment" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; attId: string } }
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
    const attObjId = new ObjectId(params.attId);
    const docObjId = new ObjectId(params.id);
    const userObjId = new ObjectId(user.userId);

    const result = await db.collection("attachments").deleteOne({
      _id: attObjId,
      documentId: docObjId,
      userId: userObjId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Attachment deleted" });
  } catch (error) {
    logger.error({ error }, "Error deleting attachment");
    return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 });
  }
}
