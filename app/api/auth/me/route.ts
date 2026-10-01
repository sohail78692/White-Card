import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null, stats: null }, { status: 401 });
  }

  let stats = {
    linkedDocs: 0,
    verificationsToday: 0,
    auditEntries: 0,
  };

  try {
    const db = await getDb();
    const userObjId = new ObjectId(user.userId);

    // 1. Linked Documents count
    const linkedDocs = await db.collection("documents").countDocuments({ userId: userObjId });

    // 2. Audit Entries count
    const auditEntries = await db.collection("audit_logs").countDocuments({ userId: userObjId });

    // 3. Verifications today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const verificationsToday = await db.collection("audit_logs").countDocuments({
      userId: userObjId,
      action: "verify",
      ts: { $gte: startOfDay },
    });

    stats = {
      linkedDocs,
      verificationsToday,
      auditEntries,
    };
  } catch {
    // If DB stats query fails, return default 0s
  }

  return NextResponse.json({
    user: {
      userId: user.userId,
      email: user.email,
      name: user.name,
      walletId: user.walletId,
    },
    stats,
  });
}
