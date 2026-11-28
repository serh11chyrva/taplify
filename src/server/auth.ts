import "server-only";
import { createHash } from "node:crypto";
import { betterAuth } from "better-auth/minimal";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { getMongoClient } from "@/server/db/mongodb";
import { getAuthEnv, getDatabaseEnv, getGoogleAuthEnv } from "@/server/env";
import { dashboardFeatures } from "@/server/dashboard/features";
import { mailConfigured, sendTransactionalMail } from "@/server/dashboard/mail";

async function createAuth() {
  const env = getAuthEnv();
  const google = getGoogleAuthEnv();
  const client = await getMongoClient();
  return betterAuth({
    appName: "Taplify",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: mongodbAdapter(client.db(getDatabaseEnv().MONGODB_DB_NAME), { client }),
    advanced: process.env.VERCEL === "1" ? { ipAddress: { ipAddressHeaders: ["x-vercel-forwarded-for"] } } : undefined,
    socialProviders: google ? {
      google: { clientId: google.GOOGLE_CLIENT_ID, clientSecret: google.GOOGLE_CLIENT_SECRET },
    } : {},
    emailAndPassword: { enabled: true, requireEmailVerification: false, autoSignIn: true },
    emailVerification: dashboardFeatures().collaboration && mailConfigured() ? {
      sendOnSignUp: false,
      sendOnSignIn: false,
      expiresIn: 3600,
      async sendVerificationEmail({ user, url, token }) {
        await sendTransactionalMail({
          recipient: user.email,
          subject: "Verify your Taplify email address",
          text: `Verify your email address to continue in Taplify:\n\n${url}\n\nThis link expires in one hour.`,
          requestKey: `verify-${createHash("sha256").update(token).digest("hex")}`,
        });
      },
    } : undefined,
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
