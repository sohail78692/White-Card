import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DB: z.string().default("whitecard"),
  MASTER_KEY: z
    .string()
    .length(64, "MASTER_KEY must be exactly 64 hex characters (32 bytes)")
    .regex(/^[0-9a-fA-F]+$/, "MASTER_KEY must be a valid hex string"),
  SIGNING_PRIVATE_KEY: z.string().min(1, "SIGNING_PRIVATE_KEY is required"),
  SIGNING_KEY_ID: z.string().default("key-1"),
  APP_URL: z.string().url("APP_URL must be a valid URL").default("http://localhost:3000"),
  RP_ID: z.string().default("localhost"),
  RP_NAME: z.string().default("White Card Wallet"),
  EMAIL_PROVIDER: z.enum(["resend", "brevo"]).default("resend"),
  EMAIL_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("onboarding@resend.dev"),
  CRON_SECRET: z.string().min(16, "CRON_SECRET should be at least 16 characters"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  // Load from process.env
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `  - ${err.path.join(".")}: ${err.message}`)
      .join("\n");
    console.error(`\n❌ Environment variable validation error:\n${errorDetails}\n`);
    throw new Error(`Invalid environment configuration:\n${errorDetails}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}
