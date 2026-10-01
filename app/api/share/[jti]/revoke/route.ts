import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { verifyCsrfOrigin } from "@/lib/auth/csrf";
import { recordAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: { jti: string } }
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
    const result = await db.collection("shares").updateOne(
      {
        jti: params.jti,
        userId: new ObjectId(user.userId),
        revokedAt: null,
      },
      {
        $set: { revokedAt: new Date() },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Share token not found or already revoked" },
        { status: 404 }
      );
    }

    // Record audit log
    await recordAuditLog({
      userId: user.userId,
      actor: "user",
      action: "revoke_share",
      fields: ["jti"],
      result: "success",
    });

    return NextResponse.json({ success: true, message: "Share token has been revoked immediately." });
  } catch (error) {
    logger.error({ error }, "Error revoking share");
    return NextResponse.json({ error: "Failed to revoke share token" }, { status: 500 });
  }
}
