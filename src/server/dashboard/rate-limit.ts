import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { getAuthEnv } from "@/server/env";
import { connectMongoose } from "@/server/db/mongoose";
import { getPublicRateLimitModel } from "@/server/db/models/public-rate-limit";
import { DashboardError } from "./errors";

export async function limitPublicRequest(request: Request, operation: string, resource: string, limit: number, windowSeconds = 60) {
  const forwarded = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const sender = process.env.VERCEL === "1" && isIP(forwarded) ? forwarded : "unknown";
  const windowMs = windowSeconds * 1000;
  const bucket = Math.floor(Date.now() / windowMs);
  const id = createHmac("sha256", getAuthEnv().BETTER_AUTH_SECRET)
    .update(JSON.stringify([operation, resource, sender, bucket])).digest("hex");
  await connectMongoose();
  const counter = await getPublicRateLimitModel().findOneAndUpdate(
    { _id: id },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * windowMs) } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: false },
  ).lean();
  if (!counter || counter.count > limit) {
    throw new DashboardError(429, "RATE_LIMITED", "Too many requests. Try again in a minute.");
  }
}
