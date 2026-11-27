import "server-only";
import { betterAuth } from "better-auth/minimal";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { getMongoClient } from "@/server/db/mongodb";
import { getAuthEnv, getDatabaseEnv, getGoogleAuthEnv } from "@/server/env";

async function createAuth() {
  const env = getAuthEnv();
  const google = getGoogleAuthEnv();
  const client = await getMongoClient();
  return betterAuth({
    appName: "Taplify",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: mongodbAdapter(client.db(getDatabaseEnv().MONGODB_DB_NAME), { client }),
    socialProviders: google ? {
      google: { clientId: google.GOOGLE_CLIENT_ID, clientSecret: google.GOOGLE_CLIENT_SECRET },
    } : {},
    emailAndPassword: { enabled: true, requireEmailVerification: false, autoSignIn: true },
    account: { accountLinking: { requireLocalEmailVerified: true } },
  });
}

const cache = globalThis as typeof globalThis & {
  taplifyAuth?: ReturnType<typeof createAuth>;
};

export function getAuth() {
  cache.taplifyAuth ??= createAuth().catch((error: unknown) => {
    cache.taplifyAuth = undefined;
    throw error;
  });
  return cache.taplifyAuth;
}
