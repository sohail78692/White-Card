import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { decryptField } from "@/lib/crypto/aead";
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

    // 1. User Profile
    const userDoc = await db.collection("users").findOne({ _id: userObjId });

    // 2. Documents
    const documents = await db.collection("documents").find({ userId: userObjId }).toArray();
    const decryptedDocs = documents.map((doc) => {
      let number = "[DECRYPTION_ERROR]";
      let details = {};
      try {
        number = decryptField(user.dek, doc.numberEnc, `${user.userId}:number`);
        details = JSON.parse(decryptField(user.dek, doc.detailsEnc, `${user.userId}:details`));
      } catch {
        // Handle error
      }
      return {
        id: doc._id.toString(),
        type: doc.type,
        customTitle: doc.customTitle,
        number,
        maskedNumber: doc.maskedNumber,
        issuer: doc.issuer,
        expiry: doc.expiry,
        status: doc.status,
        details,
        createdAt: doc.createdAt,
      };
    });

    // 3. Active & Past Shares
    const shares = await db.collection("shares").find({ userId: userObjId }).toArray();
    const cleanShares = shares.map((s) => ({
      jti: s.jti,
      preset: s.preset,
      fields: s.fields,
      purpose: s.purpose,
      audience: s.audience,
      singleUse: s.singleUse,
      usedAt: s.usedAt,
      revokedAt: s.revokedAt,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
    }));

    // Record audit log
    await recordAuditLog({
      userId: user.userId,
      actor: "user",
      action: "export_data",
      fields: ["profile", "documents", "shares"],
      result: "success",
    });

    const exportPayload = {
      exportVersion: "1.0",
      exportedAt: new Date().toISOString(),
      user: {
        walletId: user.walletId,
        email: user.email,
        name: userDoc?.name || "",
        createdAt: userDoc?.createdAt,
      },
      documents: decryptedDocs,
      shares: cleanShares,
      notice: "Personal document export generated under DPDP Act 2023 principles.",
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="whitecard-export-${user.walletId}.json"`,
      },
    });
  } catch (error) {
    logger.error({ error }, "Error exporting user data");
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
