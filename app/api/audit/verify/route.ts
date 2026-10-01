import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { verifyAuditChain } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await verifyAuditChain(user.userId);
    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, "Error verifying audit chain");
    return NextResponse.json(
      { intact: false, error: "Failed to complete audit chain verification" },
      { status: 500 }
    );
  }
}
