import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser, destroySession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { verifyCsrfOrigin } from "@/lib/auth/csrf";
import { logger } from "@/lib/logger";

export async function DELETE(req: NextRequest) {
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
    const userObjId = new ObjectId(user.userId);

    // Irreversible deletion of all user data across collections
    await Promise.all([
      db.collection("users").deleteOne({ _id: userObjId }),
      db.collection("sessions").deleteMany({ userId: userObjId }),
      db.collection("documents").deleteMany({ userId: userObjId }),
      db.collection("attachments").deleteMany({ userId: userObjId }),
      db.collection("shares").deleteMany({ userId: userObjId }),
      db.collection("consents").deleteMany({ userId: userObjId }),
      db.collection("blocklist").deleteMany({ userId: userObjId }),
      db.collection("audit_logs").deleteMany({ userId: userObjId }),
      db.collection("ration_balances").deleteMany({ userId: userObjId }),
      db.collection("ration_ledger").deleteMany({ userId: userObjId }),
      db.collection("polling_checkins").deleteMany({ userId: userObjId }),
    ]);

    // Clear session cookie
    await destroySession();

    logger.info({ userId: user.userId }, "User account and all personal data erased per DPDP Act");

    return NextResponse.json({
      success: true,
      message: "Account and all associated encrypted data have been completely erased.",
    });
  } catch (error) {
    logger.error({ error }, "Error deleting account");
    return NextResponse.json({ error: "Failed to erase account data" }, { status: 500 });
  }
}
