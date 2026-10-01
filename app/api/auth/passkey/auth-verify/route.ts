import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPasskeyAuth } from "@/lib/auth/passkeys";
import { createSession } from "@/lib/auth/session";
import { verifyCsrfOrigin } from "@/lib/auth/csrf";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const csrf = verifyCsrfOrigin(req);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.reason || "CSRF check failed" }, { status: 403 });
  }

  const cookieStore = cookies();
  const expectedChallenge = cookieStore.get("wc_pk_challenge")?.value;

  if (!expectedChallenge) {
    return NextResponse.json(
      { error: "Authentication challenge expired. Please try again." },
      { status: 400 }
    );
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    const body = await req.json();
    const result = await verifyPasskeyAuth(body, expectedChallenge);

    // Clear challenge cookie
    cookieStore.delete("wc_pk_challenge");

    if (!result.success || !result.userId) {
      return NextResponse.json({ error: result.error || "Verification failed" }, { status: 400 });
    }

    // Create session
    await createSession(result.userId, userAgent, clientIp);

    return NextResponse.json({ success: true, userId: result.userId });
  } catch (error) {
    logger.error({ error }, "Error in passkey auth verify route");
    return NextResponse.json({ error: "Passkey authentication failed" }, { status: 500 });
  }
}
