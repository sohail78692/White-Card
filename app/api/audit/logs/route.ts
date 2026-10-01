import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const actionFilter = searchParams.get("action");
  const actorFilter = searchParams.get("actor");

  try {
    const db = await getDb();
    const query: Record<string, any> = { userId: new ObjectId(user.userId) };

    if (actionFilter && actionFilter !== "all") {
      query.action = actionFilter;
    }
    if (actorFilter && actorFilter !== "all") {
      query.actor = { $regex: actorFilter, $options: "i" };
    }

    const logs = await db
      .collection("audit_logs")
      .find(query)
      .sort({ seq: -1 })
      .limit(100)
      .toArray();

    const formatted = logs.map((l) => ({
      seq: l.seq,
      ts: l.ts,
      actor: l.actor,
      action: l.action,
      fields: l.fields || [],
      result: l.result,
      shortHash: l.hash ? l.hash.slice(0, 12) + "..." : "—",
      hash: l.hash,
      prevHash: l.prevHash,
    }));

    return NextResponse.json({ logs: formatted });
  } catch (error) {
    logger.error({ error }, "Error fetching audit logs");
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
