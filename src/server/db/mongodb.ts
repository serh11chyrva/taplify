import "server-only";
import { MongoClient } from "mongodb";
import { getDatabaseEnv } from "@/server/env";

const cache = globalThis as typeof globalThis & {
  taplifyMongoClient?: Promise<MongoClient>;
};

// Better Auth owns its collections and uses the official MongoDB driver.
export async function getMongoClient() {
  if (!cache.taplifyMongoClient) {
    const env = getDatabaseEnv();
    const client = new MongoClient(env.MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      timeoutMS: 10000,
    });
    cache.taplifyMongoClient = client.connect().catch(async (error: unknown) => {
      cache.taplifyMongoClient = undefined;
      await client.close();
      throw error;
    });
  }
  return cache.taplifyMongoClient;
}
