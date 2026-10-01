import { MongoClient } from "mongodb";
import * as fs from "fs";
import * as path from "path";
import { unwrapDek, wrapDek } from "../lib/crypto/keys";

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

async function main() {
  const oldMasterKey = process.env.MASTER_KEY;
  const newMasterKey = process.env.NEW_MASTER_KEY;
  const mongoUri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "whitecard";

  if (!oldMasterKey || !newMasterKey) {
    console.error("Usage: Provide MASTER_KEY and NEW_MASTER_KEY in environment to rotate master keys.");
    console.error("Example: NEW_MASTER_KEY=<64-hex> tsx scripts/rotate-master-key.ts");
    process.exit(1);
  }

  if (!mongoUri) {
    console.error("MONGODB_URI is required.");
    process.exit(1);
  }

  console.log("Starting Master Key Rotation...");
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection("users");

    const users = await usersCollection.find({ wrappedDek: { $exists: true } }).toArray();
    console.log(`Found ${users.length} user records with wrapped DEKs.`);

    let rotated = 0;
    for (const user of users) {
      const userId = user._id.toString();
      try {
        // 1. Unwrap DEK using old master key
        const rawDek = unwrapDek(oldMasterKey, user.wrappedDek, userId);

        // 2. Re-wrap DEK using new master key
        const rewrappedDek = wrapDek(newMasterKey, rawDek, userId);

        // 3. Update in MongoDB
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { wrappedDek: rewrappedDek, masterKeyRotatedAt: new Date() } }
        );
        rotated++;
      } catch (err) {
        console.error(`Failed to rotate DEK for user ${userId}:`, err);
      }
    }

    console.log(`✅ Master key rotation complete. Successfully rotated ${rotated} of ${users.length} DEKs.`);
    console.log("IMPORTANT: Now update MASTER_KEY in your .env.local / hosting environment to the new key.");
  } finally {
    await client.close();
  }
}

main().catch(console.error);
