import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/types";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { generateDek, wrapDek } from "@/lib/crypto/keys";
import { generateWalletId } from "./otp";

/**
 * Generates WebAuthn registration options for a user.
 */
export async function getPasskeyRegistrationOptions(userId: string, email: string) {
  const env = getEnv();
  const db = await getDb();

  // Retrieve user's existing credentials to exclude them
  const existingCredentials = await db
    .collection("credentials")
    .find({ userId: new ObjectId(userId) })
    .toArray();

  const options = await generateRegistrationOptions({
    rpName: env.RP_NAME,
    rpID: env.RP_ID,
    userID: Buffer.from(userId, "utf-8"),
    userName: email,
    attestationType: "none",
    excludeCredentials: existingCredentials.map((cred) => ({
      id: cred.credentialId,
      transports: cred.transports,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  // Temporarily store current challenge in user record or a challenges collection
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    { $set: { currentPasskeyChallenge: options.challenge } }
  );

  return options;
}

/**
 * Verifies WebAuthn registration response and persists the credential.
 */
export async function verifyPasskeyRegistration(
  userId: string,
  response: RegistrationResponseJSON
) {
  const env = getEnv();
  const db = await getDb();

  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
  if (!user || !user.currentPasskeyChallenge) {
    throw new Error("Registration challenge not found or expired");
  }

  const expectedChallenge = user.currentPasskeyChallenge;

  let expectedOrigin = env.APP_URL;
  // If localhost, allow both http://localhost:3000 and 127.0.0.1:3000
  if (expectedOrigin.includes("localhost:3000")) {
    expectedOrigin = "http://localhost:3000";
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin,
    expectedRPID: env.RP_ID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Passkey registration verification failed");
  }

  const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

  await db.collection("credentials").insertOne({
    userId: new ObjectId(userId),
    credentialId: Buffer.from(credentialID).toString("base64url"),
    publicKey: Buffer.from(credentialPublicKey).toString("base64url"),
    counter,
    transports: response.response.transports || [],
    createdAt: new Date(),
    label: "Passkey",
  });

  // Clear challenge
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    { $unset: { currentPasskeyChallenge: "" } }
  );

  return verification;
}

/**
 * Generates WebAuthn authentication options.
 */
export async function getPasskeyAuthOptions(email?: string) {
  const env = getEnv();
  const db = await getDb();

  let allowCredentials = undefined;

  if (email) {
    const user = await db.collection("users").findOne({ email: email.trim().toLowerCase() });
    if (user) {
      const creds = await db.collection("credentials").find({ userId: user._id }).toArray();
      allowCredentials = creds.map((c) => ({
        id: c.credentialId,
        transports: c.transports,
      }));
    }
  }

  const options = await generateAuthenticationOptions({
    rpID: env.RP_ID,
    allowCredentials,
    userVerification: "preferred",
  });

  return options;
}

/**
 * Verifies WebAuthn authentication response.
 */
export async function verifyPasskeyAuth(
  response: AuthenticationResponseJSON,
  expectedChallenge: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const env = getEnv();
  const db = await getDb();

  const credentialId = response.id;
  const credential = await db.collection("credentials").findOne({ credentialId });

  if (!credential) {
    return { success: false, error: "Authenticator not recognized" };
  }

  let expectedOrigin = env.APP_URL;
  if (expectedOrigin.includes("localhost:3000")) {
    expectedOrigin = "http://localhost:3000";
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin,
    expectedRPID: env.RP_ID,
    authenticator: {
      credentialID: credential.credentialId,
      credentialPublicKey: new Uint8Array(Buffer.from(credential.publicKey, "base64url")),
      counter: credential.counter,
    },
  });

  if (!verification.verified) {
    return { success: false, error: "Authentication failed verification" };
  }

  // Update authenticator counter to prevent replay
  await db.collection("credentials").updateOne(
    { _id: credential._id },
    { $set: { counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date() } }
  );

  return { success: true, userId: credential.userId.toString() };
}
