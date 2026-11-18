import "server-only";
import mongoose from "mongoose";
import { getDatabaseEnv } from "@/server/env";

const cache = globalThis as typeof globalThis & {
  taplifyMongoose?: Promise<typeof mongoose>;
};

export async function connectMongoose() {
  if (!cache.taplifyMongoose) {
    const env = getDatabaseEnv();
    cache.taplifyMongoose = mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      autoIndex: false,
      bufferCommands: false,
    }).catch((error: unknown) => {
      cache.taplifyMongoose = undefined;
      throw error;
    });
  }
  return cache.taplifyMongoose;
}
