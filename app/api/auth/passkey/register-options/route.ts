import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getPasskeyRegistrationOptions } from "@/lib/auth/passkeys";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const options = await getPasskeyRegistrationOptions(user.userId, user.email);
    return NextResponse.json(options);
  } catch (error) {
    logger.error({ error }, "Error generating passkey registration options");
    return NextResponse.json({ error: "Failed to initialize passkey registration" }, { status: 500 });
  }
}
