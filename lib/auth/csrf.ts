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
  const host = req.headers.get("host");
  const forwardedHost = req.headers.get("x-forwarded-host");

  // Determine allowed origins
  const allowedOrigins = new Set<string>();

  // 1. Configured APP_URL
  try {
    allowedOrigins.add(new URL(env.APP_URL).origin);
  } catch {
    allowedOrigins.add("http://localhost:3000");
  }

  // 2. Netlify environment URLs
  if (process.env.URL) {
    try { allowedOrigins.add(new URL(process.env.URL).origin); } catch {}
  }
  if (process.env.DEPLOY_URL) {
    try { allowedOrigins.add(new URL(process.env.DEPLOY_URL).origin); } catch {}
  }
  if (process.env.DEPLOY_PRIME_URL) {
    try { allowedOrigins.add(new URL(process.env.DEPLOY_PRIME_URL).origin); } catch {}
  }

  // 3. Dynamic current request Host & Forwarded Host
  if (host) {
    allowedOrigins.add(`https://${host}`);
    allowedOrigins.add(`http://${host}`);
  }
  if (forwardedHost) {
    allowedOrigins.add(`https://${forwardedHost}`);
    allowedOrigins.add(`http://${forwardedHost}`);
  }

  const isAllowed = (testOrigin: string): boolean => {
    if (allowedOrigins.has(testOrigin)) return true;
    if (testOrigin.endsWith("localhost:3000") || testOrigin.endsWith("127.0.0.1:3000")) return true;
    try {
      const url = new URL(testOrigin);
      if (url.hostname.endsWith(".netlify.app")) return true;
    } catch {
      return false;
    }
    return false;
  };

  // Check Origin header first if present
  if (origin) {
    if (isAllowed(origin)) {
      return { valid: true };
    }
    const primary = allowedOrigins.values().next().value || env.APP_URL;
    return { valid: false, reason: `Origin header mismatch: ${origin} vs ${primary}` };
  }

  // Fallback to Referer header
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (isAllowed(refererOrigin)) {
        return { valid: true };
      }
      const primary = allowedOrigins.values().next().value || env.APP_URL;
      return { valid: false, reason: `Referer header mismatch: ${refererOrigin} vs ${primary}` };
    } catch {
      return { valid: false, reason: "Malformed referer header" };
    }
  }

  // If both are missing on a state-changing browser request, reject
  const authHeader = req.headers.get("authorization") || req.headers.get("x-api-key");
  if (authHeader) {
    return { valid: true };
  }

  return { valid: false, reason: "Missing Origin and Referer headers on state-changing request" };
}
