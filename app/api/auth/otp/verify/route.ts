import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth/otp";
import { createSession } from "@/lib/auth/session";
import { verifyCsrfOrigin } from "@/lib/auth/csrf";
import { checkRateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Verification code must be 6 digits"),
}).strict();

export async function POST(req: NextRequest) {
  const csrf = verifyCsrfOrigin(req);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.reason || "CSRF check failed" }, { status: 403 });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, code } = parsed.data;

    // Rate limit: 10 attempts per 10 minutes per IP
    const rateCheck = await checkRateLimit(`otp-verify:${email}:${clientIp}`, 10, 600);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait a few minutes." },
        { status: 429 }
      );
    }

    const verification = await verifyOtp(email, code);
    if (!verification.success || !verification.userId) {
      return NextResponse.json(
        { error: verification.error || "Verification failed" },
        { status: 400 }
      );
    }

    // Create session & set cookie
    await createSession(verification.userId, userAgent, clientIp);

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      userId: verification.userId,
    });
  } catch (error) {
    logger.error({ error }, "Error in verify OTP route");
    return NextResponse.json({ error: "Verification process failed" }, { status: 500 });
  }
}
