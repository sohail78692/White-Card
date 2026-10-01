import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { hashToken } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

const registerVerifierSchema = z.object({
  name: z.string().min(2, "Organization/Inspector name is required"),
  type: z.enum(["police", "fps", "polling", "bank", "other"]),
  contactEmail: z.string().email("Valid contact email is required"),
}).strict();

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

  // Rate limit registration: 5 registrations per 10 minutes per IP
  const rate = await checkRateLimit(`verifier-reg:${clientIp}`, 5, 600);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please wait a few minutes." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = registerVerifierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid registration payload" },
        { status: 400 }
      );
    }

    const { name, type, contactEmail } = parsed.data;

    // Generate random API key (wcv_<32-byte-hex>)
    const rawSecret = crypto.randomBytes(32).toString("hex");
    const apiKey = `wcv_${rawSecret}`;
    const apiKeyHash = hashToken(apiKey);

    const db = await getDb();
    const verifiers = db.collection("verifiers");

    const result = await verifiers.insertOne({
      name,
      type,
      contactEmail: contactEmail.toLowerCase(),
      apiKeyHash,
      blocked: false,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      verifierId: result.insertedId.toString(),
      apiKey, // Returned ONCE upon registration
      name,
      type,
      message: "Verifier registered successfully. Save your API key securely; it will not be displayed again.",
    });
  } catch (error) {
    logger.error({ error }, "Error registering verifier");
    return NextResponse.json({ error: "Failed to register verifier" }, { status: 500 });
  }
}
