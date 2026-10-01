import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { hashToken } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/ratelimit";
import { verifyAndConsumeShareToken } from "@/lib/share-verifier";
import { logger } from "@/lib/logger";

const verifyRequestSchema = z.object({
  token: z.string().min(1, "Token or URL is required"),
}).strict();

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

  // Rate limit: 60 verifications per minute per IP
  const rate = await checkRateLimit(`verify-req:${clientIp}`, 60, 60);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Verification rate limit exceeded" }, { status: 429 });
  }

  // Verifier authentication via x-api-key header or x-verifier-type
  const apiKey = req.headers.get("x-api-key");
  let verifierName = "Official Portal Verifier";
  let verifierId: string | undefined = undefined;
  let verifierType = req.headers.get("x-verifier-type") || "general";

  const db = await getDb();

  if (apiKey) {
    const apiKeyHash = hashToken(apiKey.trim());
    const verifier = await db.collection("verifiers").findOne({ apiKeyHash });
    if (!verifier) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    if (verifier.blocked) {
      return NextResponse.json({ error: "Verifier account is suspended" }, { status: 403 });
    }
    verifierName = verifier.name;
    verifierId = verifier._id.toString();
    verifierType = verifier.type;
  }

  try {
    const body = await req.json();
    const parsed = verifyRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    let token = parsed.data.token.trim();
    // Support either full URL (http://.../v/TOKEN) or direct JWT string
    if (token.includes("/v/")) {
      token = token.split("/v/")[1].split("?")[0].trim();
    }

    const result = await verifyAndConsumeShareToken(token, {
      actor: `${verifierName} (${verifierType})`,
      verifierId,
    });

    return NextResponse.json({
      valid: result.valid,
      status: result.status,
      preset: result.preset,
      purpose: result.purpose,
      subject: result.subject,
      expiresAt: result.expiresAt,
      claims: result.claims,
      error: result.error,
    });
  } catch (error) {
    logger.error({ error }, "Error during verification processing");
    return NextResponse.json({ error: "Verification system failure" }, { status: 500 });
  }
}
