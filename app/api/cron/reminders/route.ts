import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const env = getEnv();

  // Validate Authorization Bearer CRON_SECRET or query param
  const authHeader = req.headers.get("authorization");
  const providedSecret = authHeader ? authHeader.replace("Bearer ", "").trim() : null;

  if (providedSecret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const now = new Date();

    // 1. Mark expired documents as "expired"
    await db.collection("documents").updateMany(
      {
        expiry: { $lt: now.toISOString().slice(0, 10) },
        status: { $ne: "expired" },
      },
      {
        $set: { status: "expired", updatedAt: now },
      }
    );

    // 2. Identify documents expiring in ~30 days and ~7 days
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const expiringSoon = await db
      .collection("documents")
      .find({
        expiry: { $in: [in30Days, in7Days] },
      })
      .toArray();

    let reminderCount = 0;
    for (const doc of expiringSoon) {
      const user = await db.collection("users").findOne({ _id: doc.userId });
      if (user && user.email) {
        await sendEmail({
          to: user.email,
          subject: "Document Expiry Reminder - White Card Wallet",
          text: `Your ${doc.type.replace(/_/g, " ")} (${doc.maskedNumber}) is scheduled to expire on ${doc.expiry}.\n\nPlease review your credential in your White Card Wallet: ${env.APP_URL}/vault`,
        });
        reminderCount++;
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: reminderCount,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error({ error }, "Error running expiry cron job");
    return NextResponse.json({ error: "Cron execution failed" }, { status: 500 });
  }
}
