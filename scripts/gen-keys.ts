import crypto from "crypto";

async function main() {
  console.log("Generating cryptographic keys for White Card Wallet...\n");

  // 1. MASTER_KEY (32 bytes / 256-bit AES envelope key)
  const masterKey = crypto.randomBytes(32).toString("hex");

  // 2. Ed25519 Keypair for signing share JWTs
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519");

  // Export private key in PKCS8 DER base64
  const privateKeyDer = privateKey.export({ type: "pkcs8", format: "der" });
  const privateKeyBase64 = Buffer.from(privateKeyDer).toString("base64");

  // Export public key in SPKI DER base64
  const publicKeyDer = publicKey.export({ type: "spki", format: "der" });
  const publicKeyBase64 = Buffer.from(publicKeyDer).toString("base64");

  // 3. CRON_SECRET
  const cronSecret = crypto.randomBytes(32).toString("hex");

  console.log("================ COPY THESE TO YOUR .env.local ================");
  console.log(`MASTER_KEY=${masterKey}`);
  console.log(`SIGNING_PRIVATE_KEY=${privateKeyBase64}`);
  console.log(`SIGNING_KEY_ID=key-1`);
  console.log(`CRON_SECRET=${cronSecret}`);
  console.log("===============================================================\n");
  console.log("Public Key (SPKI Base64 - for reference):");
  console.log(publicKeyBase64);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
