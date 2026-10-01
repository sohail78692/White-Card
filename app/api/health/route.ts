import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbStatus = "disconnected";
  try {
    const client = await getMongoClient();
    await client.db().command({ ping: 1 });
    dbStatus = "connected";
  } catch (error) {
    logger.warn({ error }, "Database ping failed in health check");
    dbStatus = "unavailable";
  }

  return NextResponse.json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    version: "1.0.0",
  });
}
