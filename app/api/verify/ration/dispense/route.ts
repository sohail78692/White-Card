import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

const dispenseSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  qtyRice: z.number().min(0).default(0),
  qtyWheat: z.number().min(0).default(0),
  verifierId: z.string().optional(),
}).strict();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = dispenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { documentId, qtyRice, qtyWheat, verifierId } = parsed.data;

    if (qtyRice <= 0 && qtyWheat <= 0) {
      return NextResponse.json({ error: "Please specify quantity for rice or wheat" }, { status: 400 });
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const db = await getDb();
    const docObjId = new ObjectId(documentId);

    // Fetch document to identify user
    const doc = await db.collection("documents").findOne({ _id: docObjId });
    if (!doc) {
      return NextResponse.json({ error: "Ration document record not found" }, { status: 404 });
    }

    // Atomic conditional decrement: prevents race conditions and over-allocation
    const updateQuery: Record<string, any> = {
      documentId: docObjId,
      month: currentMonth,
    };
    if (qtyRice > 0) updateQuery.rice = { $gte: qtyRice };
    if (qtyWheat > 0) updateQuery.wheat = { $gte: qtyWheat };

    const incQuery: Record<string, number> = {};
    if (qtyRice > 0) incQuery.rice = -qtyRice;
    if (qtyWheat > 0) incQuery.wheat = -qtyWheat;

    const result = await db.collection("ration_balances").findOneAndUpdate(
      updateQuery,
      { $inc: incQuery, $set: { updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) {
      // Over-allocation attempt blocked!
      return NextResponse.json(
        { error: "Insufficient balance: requested quantity exceeds remaining monthly quota." },
        { status: 400 }
      );
    }

    // Insert entries into ration_ledger
    const now = new Date();
    const ledgerEntries = [];
    if (qtyRice > 0) {
      ledgerEntries.push({
        userId: doc.userId,
        documentId: docObjId,
        month: currentMonth,
        item: "rice",
        qtyKg: qtyRice,
        verifierId: verifierId || "FPS-DEPOT",
        ts: now,
      });
    }
    if (qtyWheat > 0) {
      ledgerEntries.push({
        userId: doc.userId,
        documentId: docObjId,
        month: currentMonth,
        item: "wheat",
        qtyKg: qtyWheat,
        verifierId: verifierId || "FPS-DEPOT",
        ts: now,
      });
    }

    if (ledgerEntries.length > 0) {
      await db.collection("ration_ledger").insertMany(ledgerEntries);
    }

    // Record audit log
    await recordAuditLog({
      userId: doc.userId.toString(),
      actor: verifierId || "FPS Fair Price Shop",
      action: "ration_dispense",
      fields: ["rice_dispensed", "wheat_dispensed", "month"],
      result: "success",
      metadata: { qtyRice, qtyWheat, remainingRice: result.rice, remainingWheat: result.wheat },
    });

    return NextResponse.json({
      success: true,
      message: `Dispensed: ${qtyRice}kg Rice, ${qtyWheat}kg Wheat`,
      remainingRiceKg: result.rice,
      remainingWheatKg: result.wheat,
      month: currentMonth,
    });
  } catch (error) {
    logger.error({ error }, "Error dispensing ration");
    return NextResponse.json({ error: "Failed to process ration distribution" }, { status: 500 });
  }
}
