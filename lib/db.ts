import { MongoClient, Db } from "mongodb";
import { getEnv } from "./env";
import { logger } from "./logger";
import { memoryDb } from "./memory-db";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _usingMemoryDbFallback: boolean | undefined;
}

let clientPromise: Promise<MongoClient> | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (global._usingMemoryDbFallback) {
    throw new Error("MongoDB unreachable: running in memory-db fallback mode");
  }

  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    if (!global._mongoClientPromise) {
      const env = getEnv();
      const client = new MongoClient(env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 2000,
      });
      global._mongoClientPromise = client.connect().catch((err) => {
        logger.warn("⚠️ MongoDB connection failed. Falling back to in-memory store for local testing/development.");
        global._usingMemoryDbFallback = true;
        throw err;
      });
    }
    clientPromise = global._mongoClientPromise;
  } else {
    const env = getEnv();
    const client = new MongoClient(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    clientPromise = client.connect();
  }

  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const env = getEnv();
  try {
    const client = await getMongoClient();
    return client.db(env.MONGODB_DB);
  } catch {
    // Return high-fidelity in-memory mock database for local development/testing
    return memoryDb as unknown as Db;
  }
}
