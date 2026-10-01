import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { createShareJwt, verifyShareJwt, getPublicJwk } from "../lib/tokens";

describe("Ed25519 Share Tokens", () => {
  const walletId = "WC-A1B2-C3D4-E5F6";

  it("should create and verify an Ed25519-signed JWT token", async () => {
    const jti = crypto.randomUUID();
    const claims = {
      sub: walletId,
      jti,
      preset: "driving_auth",
      purpose: "Traffic Inspection",
      aud: "police",
      claims: {
        drivingLicenseValid: true,
        vehicleClasses: ["MCWG", "LMV"],
      },
    };

    const { token, expiresAt } = await createShareJwt(claims, 300);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const verification = await verifyShareJwt(token);
    expect(verification.valid).toBe(true);
    expect(verification.payload?.sub).toBe(walletId);
    expect(verification.payload?.preset).toBe("driving_auth");
    expect(verification.payload?.purpose).toBe("Traffic Inspection");
    expect((verification.payload?.claims as any)?.drivingLicenseValid).toBe(true);
  });

  it("should reject an expired token", async () => {
    const jti = crypto.randomUUID();
    const claims = {
      sub: walletId,
      jti,
      preset: "full_id",
      purpose: "Quick Check",
      aud: "general",
      claims: { name: "Test" },
    };

    // Create token expiring in -5 seconds
    const { token } = await createShareJwt(claims, -5);
    const verification = await verifyShareJwt(token);
    expect(verification.valid).toBe(false);
  });

  it("should ensure Age 18+ payload contains ONLY over18 boolean and NO PII", async () => {
    // REQUIREMENT: Age 18+ preset discloses only { over18: boolean }.
    // No DOB, name, address, or numbers.
    const jti = crypto.randomUUID();
    const claims = {
      sub: walletId,
      jti,
      preset: "age_18_plus",
      purpose: "Club / Event Age Check",
      aud: "merchant",
      claims: {
        over18: true,
      },
    };

    const { token } = await createShareJwt(claims, 300);
    const verification = await verifyShareJwt(token);

    expect(verification.valid).toBe(true);
    const tokenClaims = verification.payload?.claims as Record<string, unknown>;

    // 1. Must contain over18
    expect(tokenClaims).toHaveProperty("over18");
    expect(typeof tokenClaims.over18).toBe("boolean");

    // 2. Must NOT contain any personal identifiers
    expect(tokenClaims).not.toHaveProperty("name");
    expect(tokenClaims).not.toHaveProperty("dob");
    expect(tokenClaims).not.toHaveProperty("dateOfBirth");
    expect(tokenClaims).not.toHaveProperty("address");
    expect(tokenClaims).not.toHaveProperty("number");
    expect(tokenClaims).not.toHaveProperty("documentNumber");
    expect(tokenClaims).not.toHaveProperty("pan");
    expect(tokenClaims).not.toHaveProperty("dl");
    expect(tokenClaims).not.toHaveProperty("email");

    // 3. Claims object must have exactly 1 key
    expect(Object.keys(tokenClaims)).toEqual(["over18"]);
  });

  it("should export a valid public JWK for the Ed25519 signing key", async () => {
    const jwk = await getPublicJwk();
    expect(jwk.kty).toBe("OKP");
    expect(jwk.crv).toBe("Ed25519");
    expect(jwk.alg).toBe("EdDSA");
    expect(jwk.use).toBe("sig");
    expect(jwk.x).toBeDefined();
  });
});
