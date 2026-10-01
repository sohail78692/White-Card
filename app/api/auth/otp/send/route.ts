import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendOtp } from "@/lib/auth/otp";
import { verifyCsrfOrigin } from "@/lib/auth/csrf";
import { checkRateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

const sendOtpSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
}).strict();

export async function POST(req: NextRequest) {
  const csrf = verifyCsrfOrigin(req);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.reason || "CSRF check failed" }, { status: 403 });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

  try {
    const body = await req.json();
    const parsed = sendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Rate limit: 5 OTP sends per 10 minutes per IP/email
    const rateCheck = await checkRateLimit(`otp-send:${email}:${clientIp}`, 5, 600);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many verification requests. Please wait a few minutes before trying again." },
        { status: 429 }
      );
    }

    const result = await sendOtp(email);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    logger.error({ error }, "Error in send OTP route");
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}
