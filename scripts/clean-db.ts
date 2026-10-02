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

async function cleanDatabase() {
  console.log(`Connecting to MongoDB database: ${dbName}...`);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    console.log("Connected successfully. Clearing all collections...");

    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();

    if (collections.length === 0) {
      console.log("No collections found in database.");
      return;
    }

    let totalDeleted = 0;
    for (const col of collections) {
      const collection = db.collection(col.name);
      const countBefore = await collection.countDocuments();
      if (countBefore > 0) {
        const result = await collection.deleteMany({});
        console.log(`- Cleared '${col.name}': deleted ${result.deletedCount} documents`);
        totalDeleted += result.deletedCount;
      } else {
        console.log(`- Cleared '${col.name}': 0 documents (already empty)`);
      }
    }

    console.log(`\nAll data deleted successfully! Total documents removed: ${totalDeleted}`);
  } catch (error) {
    console.error("Error clearing database:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

cleanDatabase();
