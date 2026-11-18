import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI in .env.local");
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
try {
  await client.connect();
  await client.db(process.env.MONGODB_DB_NAME || "taplify").command({ ping: 1 });
  console.log("MongoDB connection OK");
} catch {
  console.error("MongoDB check failed. Check credentials and Atlas network access.");
  process.exitCode = 1;
} finally {
  await client.close();
}
