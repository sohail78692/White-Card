import { MongoClient } from "mongodb";
import * as fs from "fs";
import * as path from "path";

// Load .env.local manually if running via tsx
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvLocal();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/whitecard";
const dbName = process.env.MONGODB_DB || "whitecard";

async function main() {
  console.log(`Setting up MongoDB collections and indexes for database: ${dbName}...`);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    console.log("Connected to MongoDB successfully.");
    const db = client.db(dbName);

    // 1. users
    console.log("Creating indexes for: users");
    const users = db.collection("users");
    await users.createIndex({ email: 1 }, { unique: true });
    await users.createIndex({ walletId: 1 }, { unique: true });

    // 2. credentials (WebAuthn passkeys)
    console.log("Creating indexes for: credentials");
    const credentials = db.collection("credentials");
    await credentials.createIndex({ credentialId: 1 }, { unique: true });
    await credentials.createIndex({ userId: 1 });

    // 3. sessions
    console.log("Creating indexes for: sessions");
    const sessions = db.collection("sessions");
    await sessions.createIndex({ tokenHash: 1 }, { unique: true });
    await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // 4. otps
    console.log("Creating indexes for: otps");
    const otps = db.collection("otps");
    await otps.createIndex({ email: 1 });
    await otps.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // 5. rate_limits
    console.log("Creating indexes for: rate_limits");
    const rateLimits = db.collection("rate_limits");
    await rateLimits.createIndex({ key: 1 }, { unique: true });
    await rateLimits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // 6. documents
    console.log("Creating indexes for: documents");
    const documents = db.collection("documents");
    await documents.createIndex({ userId: 1, numberBlindIdx: 1 }, { unique: true });
    await documents.createIndex({ userId: 1, type: 1 });

    // 7. attachments
    console.log("Creating indexes for: attachments");
    const attachments = db.collection("attachments");
    await attachments.createIndex({ userId: 1 });
    await attachments.createIndex({ documentId: 1 });

    // 8. shares
    console.log("Creating indexes for: shares");
    const shares = db.collection("shares");
    await shares.createIndex({ jti: 1 }, { unique: true });
    await shares.createIndex({ userId: 1 });
    await shares.createIndex({ purgeAt: 1 }, { expireAfterSeconds: 0 });

    // 9. consents
    console.log("Creating indexes for: consents");
    const consents = db.collection("consents");
    await consents.createIndex({ userId: 1 });

    // 10. verifiers
    console.log("Creating indexes for: verifiers");
    const verifiers = db.collection("verifiers");
    await verifiers.createIndex({ apiKeyHash: 1 }, { unique: true });

    // 11. blocklist
    console.log("Creating indexes for: blocklist");
    const blocklist = db.collection("blocklist");
    await blocklist.createIndex({ userId: 1, verifierId: 1 }, { unique: true });

    // 12. audit_logs
    console.log("Creating indexes for: audit_logs");
    const auditLogs = db.collection("audit_logs");
    await auditLogs.createIndex({ userId: 1, seq: 1 }, { unique: true });
    await auditLogs.createIndex({ userId: 1, ts: -1 });

    // 13. ration_ledger
    console.log("Creating indexes for: ration_ledger");
    const rationLedger = db.collection("ration_ledger");
    await rationLedger.createIndex({ documentId: 1, month: 1 });

    // 14. ration_balances
    console.log("Creating indexes for: ration_balances");
    const rationBalances = db.collection("ration_balances");
    await rationBalances.createIndex({ documentId: 1, month: 1 }, { unique: true });

    // 15. polling_checkins
    console.log("Creating indexes for: polling_checkins");
    const pollingCheckins = db.collection("polling_checkins");
    await pollingCheckins.createIndex({ userId: 1, electionId: 1 }, { unique: true });

    console.log("✅ All collections and indexes have been successfully created/verified.");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn("Index setup warning/error:", errorMsg);
    console.log("Note: If MongoDB is not yet running locally or on Atlas, indexes will be created when database is configured.");
  } finally {
    await client.close();
  }
}

main();
