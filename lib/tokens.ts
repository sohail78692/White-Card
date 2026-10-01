import * as jose from "jose";
import crypto from "crypto";
import { getEnv } from "./env";

export interface ShareTokenClaims {
  sub: string; // Opaque walletId
  jti: string; // Unique token identifier
  preset: string; // "age_18_plus" | "driving_auth" | "ration_entitlement" | "address_only" | "full_id" | "custom"
  purpose: string; // Stated purpose
  aud: string; // Target verifier type or identifier
  claims: Record<string, unknown>; // Selective disclosed claims ONLY
}

let cachedPrivateKey: jose.KeyLike | Uint8Array | null = null;
let cachedPublicJwk: jose.JWK | null = null;

/**
 * Loads and caches the Ed25519 private signing key from SIGNING_PRIVATE_KEY (base64 PKCS8).
 */
export async function getSigningKey() {
  if (cachedPrivateKey) {
    return cachedPrivateKey;
  }

  const env = getEnv();
  const rawDer = Buffer.from(env.SIGNING_PRIVATE_KEY, "base64");
  // jose.importPKCS8 expects either a PEM string or a PKCS8 DER
  const pem = [
    "-----BEGIN PRIVATE KEY-----",
    rawDer.toString("base64").match(/.{1,64}/g)?.join("\n") || rawDer.toString("base64"),
    "-----END PRIVATE KEY-----",
  ].join("\n");

  cachedPrivateKey = await jose.importPKCS8(pem, "EdDSA");
  return cachedPrivateKey;
}

/**
 * Derives and returns the public JWK corresponding to SIGNING_PRIVATE_KEY.
 */
export async function getPublicJwk(): Promise<jose.JWK> {
  if (cachedPublicJwk) {
    return cachedPublicJwk;
  }

  const env = getEnv();
  const rawDer = Buffer.from(env.SIGNING_PRIVATE_KEY, "base64");
  const privateKeyObj = crypto.createPrivateKey({
    key: rawDer,
    format: "der",
    type: "pkcs8",
  });

  const publicKeyObj = crypto.createPublicKey(privateKeyObj);
  const jwk = await jose.exportJWK(publicKeyObj);

  cachedPublicJwk = {
    ...jwk,
    kty: "OKP",
    crv: "Ed25519",
    kid: env.SIGNING_KEY_ID,
    alg: "EdDSA",
    use: "sig",
  };

  return cachedPublicJwk;
}

/**
 * Creates an Ed25519-signed share JWT with selective claims.
 */
export async function createShareJwt(
  claims: ShareTokenClaims,
  expiresInSeconds: number
): Promise<{ token: string; jti: string; expiresAt: Date }> {
  const env = getEnv();
  const privateKey = await getSigningKey();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInSeconds;
  const expiresAt = new Date(exp * 1000);

  const token = await new jose.SignJWT({
    preset: claims.preset,
    purpose: claims.purpose,
    claims: claims.claims,
  })
    .setProtectedHeader({
      alg: "EdDSA",
      kid: env.SIGNING_KEY_ID,
      typ: "JWT",
    })
    .setIssuer(env.APP_URL)
    .setSubject(claims.sub)
    .setAudience(claims.aud)
    .setJti(claims.jti)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(privateKey);

  return { token, jti: claims.jti, expiresAt };
}

/**
 * Verifies an Ed25519-signed share token signature and standard JWT claims.
 */
export async function verifyShareJwt(
  jwt: string
): Promise<{ valid: boolean; payload?: jose.JWTPayload; error?: string }> {
  try {
    const env = getEnv();
    const publicJwk = await getPublicJwk();
    const publicKey = await jose.importJWK(publicJwk, "EdDSA");

    const { payload } = await jose.jwtVerify(jwt, publicKey, {
      issuer: env.APP_URL,
    });

    return { valid: true, payload };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Token validation failed";
    return { valid: false, error: errorMsg };
  }
}
