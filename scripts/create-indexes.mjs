import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI in .env.local");
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME || "taplify");
  // Additive only: never sync/drop indexes against a production database.
  await db.collection("media_assets").createIndex({ ownerId: 1, createdAt: -1 });
  console.log("Application indexes created");
} catch {
  console.error("Index creation failed. Check database access and existing indexes.");
  process.exitCode = 1;
} finally {
  await client.close();
}
