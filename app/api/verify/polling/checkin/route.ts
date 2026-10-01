import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

const checkinSchema = z.object({
  walletId: z.string().min(1, "Wallet ID is required"),
  electionId: z.string().min(1, "Election ID is required"),
  verifierId: z.string().optional(),
}).strict();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { walletId, electionId, verifierId } = parsed.data;

    const db = await getDb();
    const user = await db.collection("users").findOne({ walletId: walletId.trim() });
    if (!user) {
      return NextResponse.json({ error: "Voter wallet not found" }, { status: 404 });
    }

    const userId = user._id;

    // Check if voter has already checked in
    const existing = await db.collection("polling_checkins").findOne({
      userId,
      electionId: electionId.trim(),
    });

    if (existing) {
      await recordAuditLog({
        userId: userId.toString(),
        actor: verifierId || "Polling Officer",
        action: "polling_checkin",
        fields: ["electionId"],
        result: "denied",
        metadata: { reason: "Already checked in", electionId },
      });

      return NextResponse.json(
        {
          checkedIn: false,
          error: "Voter has already checked in and cast their ballot for this election.",
          firstCheckedInAt: existing.ts,
        },
        { status: 409 }
      );
    }

    // Insert atomic check-in
    try {
      await db.collection("polling_checkins").insertOne({
        userId,
        electionId: electionId.trim(),
        verifierId: verifierId || "Polling Officer",
        ts: new Date(),
      });
    } catch (insertErr: unknown) {
      // Catch unique index violation (code 11000)
      const isDuplicate =
        insertErr &&
        typeof insertErr === "object" &&
        "code" in insertErr &&
        (insertErr as { code: number }).code === 11000;

      if (isDuplicate) {
        return NextResponse.json(
          {
            checkedIn: false,
            error: "Voter has already checked in and cast their ballot for this election.",
          },
          { status: 409 }
        );
      }
      throw insertErr;
    }

    // Record audit entry
    await recordAuditLog({
      userId: userId.toString(),
      actor: verifierId || "Polling Officer",
      action: "polling_checkin",
      fields: ["electionId"],
      result: "success",
      metadata: { electionId },
    });

    return NextResponse.json({
      success: true,
      checkedIn: true,
      message: "Voter eligibility verified and check-in successfully recorded.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, "Error during polling checkin");
    return NextResponse.json({ error: "Failed to process polling check-in" }, { status: 500 });
  }
}
