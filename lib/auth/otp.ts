import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { generateDek, wrapDek } from "@/lib/crypto/keys";
import { hashToken } from "./session";

const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 5;

/**
 * Generates an opaque, non-PII wallet ID in format WC-XXXX-XXXX-XXXX.
 */
export function generateWalletId(): string {
  const bytes = crypto.randomBytes(6).toString("hex").toUpperCase();
  return `WC-${bytes.slice(0, 4)}-${bytes.slice(4, 8)}-${bytes.slice(8, 12)}`;
}

/**
 * Sends a 6-digit OTP code to the specified email address.
 */
export async function sendOtp(email: string): Promise<{ success: boolean; message: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  // Generate 6-digit cryptographically secure numeric OTP
  const otpCode = crypto.randomInt(100000, 1000000).toString();
  const codeHash = hashToken(otpCode);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const db = await getDb();
  const otps = db.collection("otps");

  // Upsert OTP record for this email
  await otps.updateOne(
    { email: normalizedEmail },
    {
      $set: {
        codeHash,
        attempts: 0,
        expiresAt,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  const emailSent = await sendEmail({
    to: normalizedEmail,
    subject: "Your White Card Wallet Verification Code",
    text: `Your White Card Wallet verification code is: ${otpCode}\n\nThis code is valid for 5 minutes. If you did not request this code, please ignore this email.`,
    html: `
      <div style="font-family: sans-serif; background-color: #020617; color: #f8fafc; padding: 24px; border-radius: 8px;">
        <h2 style="color: #818cf8; margin-top: 0;">White Card Wallet</h2>
        <p>Your one-time security verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ffffff; background: #0f172a; padding: 16px; border-radius: 6px; text-align: center; margin: 20px 0; border: 1px solid #1e293b;">
          ${otpCode}
        </div>
        <p style="font-size: 13px; color: #94a3b8;">This code will expire in 5 minutes. Never share this code with anyone.</p>
        <hr style="border: none; border-top: 1px solid #1e293b; margin: 20px 0;" />
        <p style="font-size: 11px; color: #64748b;">Personal document wallet – not a government-issued ID.</p>
      </div>
    `,
  });

  return {
    success: emailSent,
    message: emailSent
      ? "Verification code sent to your email."
      : "Failed to deliver email. Please check your email configuration.",
  };
}

/**
 * Verifies the 6-digit OTP code using constant-time comparison.
 * Finds or creates the user and returns the user's ID.
 */
export async function verifyOtp(
  email: string,
  inputCode: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const db = await getDb();
  const otps = db.collection("otps");

  const record = await otps.findOne({ email: normalizedEmail });
  if (!record) {
    return { success: false, error: "No pending verification code found. Please request a new one." };
  }

  if (new Date() > new Date(record.expiresAt)) {
    await otps.deleteOne({ email: normalizedEmail });
    return { success: false, error: "Verification code has expired. Please request a new one." };
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await otps.deleteOne({ email: normalizedEmail });
    return { success: false, error: "Maximum attempts exceeded. Please request a new code." };
  }

  // Increment attempts counter
  await otps.updateOne({ email: normalizedEmail }, { $inc: { attempts: 1 } });

  // Constant-time hash verification
  const inputHash = hashToken(inputCode.trim());
  const expectedHash = record.codeHash;

  const inputBuffer = Buffer.from(inputHash, "hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (inputBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(inputBuffer, expectedBuffer)) {
    return { success: false, error: "Invalid verification code. Please check and try again." };
  }

  // Code is verified: consume OTP
  await otps.deleteOne({ email: normalizedEmail });

  // Find or create user
  const users = db.collection("users");
  let user = await users.findOne({ email: normalizedEmail });

  if (!user) {
    const env = getEnv();
    const rawDek = generateDek();
    const newUserId = new ObjectId();
    const wrappedDek = wrapDek(env.MASTER_KEY, rawDek, newUserId.toString());
    const walletId = generateWalletId();

    const newUserDoc = {
      _id: newUserId,
      email: normalizedEmail,
      walletId,
      wrappedDek,
      createdAt: new Date(),
    };

    await users.insertOne(newUserDoc);
    user = newUserDoc;
  }

  return { success: true, userId: user._id.toString() };
}
