import "server-only";
import { z } from "zod";

const databaseSchema = z.object({
  MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\//),
  MONGODB_DB_NAME: z.string().min(1).default("taplify"),
});

const authSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
});

const googleAuthSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
});

export function getDatabaseEnv() {
  return databaseSchema.parse(process.env);
}

export function databaseConfigured() {
  return databaseSchema.safeParse(process.env).success;
}

export function publicSiteOrigin() {
  const url = new URL(process.env.PUBLIC_SITE_ORIGIN || process.env.BETTER_AUTH_URL || "http://localhost:3000");
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("PUBLIC_SITE_ORIGIN must be an HTTP or HTTPS origin.");
  }
  return url.origin;
}

export function getAuthEnv() {
  return authSchema.parse(process.env);
}

export function getGoogleAuthEnv() {
  const result = googleAuthSchema.safeParse(process.env);
  return result.success ? result.data : undefined;
}

export function isAuthConfigured() {
  return databaseSchema.safeParse(process.env).success && authSchema.safeParse(process.env).success;
}

export function getBlobToken() {
  return z.string().min(1).parse(process.env.BLOB_READ_WRITE_TOKEN);
}
