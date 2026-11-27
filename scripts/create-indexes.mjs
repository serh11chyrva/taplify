import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI in .env.local");
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME || "taplify");
  // Additive only: never sync/drop indexes against a production database.
  await db.collection("media_assets").createIndex({ ownerId: 1, createdAt: -1 });
  await db.collection("organizations").createIndex(
    { personalOwnerId: 1 },
    { unique: true, partialFilterExpression: { personalOwnerId: { $type: "string" } } },
  );
  await db.collection("organization_memberships").createIndex({ organizationId: 1, userId: 1 }, { unique: true });
  await db.collection("organization_memberships").createIndex({ userId: 1, organizationId: 1 });
  await db.collection("pages").createIndex({ organizationId: 1, archivedAt: 1, updatedAt: -1, _id: 1 });
  await db.collection("pages").createIndex(
    { organizationId: 1, createRequestId: 1 },
    { unique: true, partialFilterExpression: { createRequestId: { $type: "string" } } },
  );
  console.log("Application indexes created");
} catch {
  console.error("Index creation failed. Check database access and existing indexes.");
  process.exitCode = 1;
} finally {
  await client.close();
}
