import { NextRequest } from "next/server";
import { getEnv } from "@/lib/env";

/**
 * Validates request Origin / Referer against APP_URL to prevent Cross-Site Request Forgery (CSRF).
 */
export function verifyCsrfOrigin(req: NextRequest): { valid: boolean; reason?: string } {
  // Safe HTTP methods do not mutate state
  const method = req.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { valid: true };
  }

  const env = getEnv();
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // Determine allowed origin
  let allowedOrigin: string;
  try {
    allowedOrigin = new URL(env.APP_URL).origin;
  } catch {
    allowedOrigin = "http://localhost:3000";
  }

  // Check Origin header first if present
  if (origin) {
    if (origin === allowedOrigin || origin.endsWith("localhost:3000")) {
      return { valid: true };
    }
    return { valid: false, reason: `Origin header mismatch: ${origin} vs ${allowedOrigin}` };
  }

  // Fallback to Referer header
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin === allowedOrigin || refererOrigin.endsWith("localhost:3000")) {
        return { valid: true };
      }
      return { valid: false, reason: `Referer header mismatch: ${refererOrigin} vs ${allowedOrigin}` };
    } catch {
      return { valid: false, reason: "Malformed referer header" };
    }
  }

  // If both are missing on a state-changing browser request, reject
  // (API verifier requests authenticated via Authorization Bearer or API Key are checked in verifier auth)
  const authHeader = req.headers.get("authorization") || req.headers.get("x-api-key");
  if (authHeader) {
    return { valid: true };
  }

  return { valid: false, reason: "Missing Origin and Referer headers on state-changing request" };
}
