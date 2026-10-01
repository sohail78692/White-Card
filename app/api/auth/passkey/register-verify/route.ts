import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { verifyPasskeyRegistration } from "@/lib/auth/passkeys";
import { verifyCsrfOrigin } from "@/lib/auth/csrf";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const csrf = verifyCsrfOrigin(req);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.reason || "CSRF check failed" }, { status: 403 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const verification = await verifyPasskeyRegistration(user.userId, body);

    return NextResponse.json({ verified: verification.verified });
  } catch (error) {
    logger.error({ error }, "Error verifying passkey registration");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration verification failed" },
      { status: 400 }
    );
  }
}
