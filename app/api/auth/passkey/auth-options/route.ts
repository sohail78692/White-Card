import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPasskeyAuthOptions } from "@/lib/auth/passkeys";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    let email: string | undefined;
    try {
      const body = await req.json();
      email = body.email;
    } catch {
      // Body is optional
    }

    const options = await getPasskeyAuthOptions(email);

    // Store challenge in short-lived httpOnly cookie (5 minutes)
    const cookieStore = cookies();
    cookieStore.set({
      name: "wc_pk_challenge",
      value: options.challenge,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 300,
    });

    return NextResponse.json(options);
  } catch (error) {
    logger.error({ error }, "Error generating passkey auth options");
    return NextResponse.json({ error: "Failed to initialize passkey authentication" }, { status: 500 });
  }
}
