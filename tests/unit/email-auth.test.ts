import { randomBytes } from "node:crypto";
import { afterEach, expect, test, vi } from "vitest";
import { app } from "@/server/api/app";

vi.mock("@/server/db/mongodb", () => ({
  getMongoClient: async () => ({ db: () => ({}) }),
}));

vi.mock("@better-auth/mongo-adapter", async () => {
  const { memoryAdapter } = await import("better-auth/adapters/memory");
  return { mongodbAdapter: () => memoryAdapter({ user: [], account: [], session: [], verification: [] }) };
});

const origin = "http://localhost:3000";
const authUrl = `${origin}/api/auth`;

function postAuth(path: string, body: Record<string, string>, cookie?: string) {
  const headers = new Headers({ Origin: origin, "Content-Type": "application/json" });
  if (cookie) headers.set("Cookie", cookie);
  return app.request(`${authUrl}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
}

function sessionCookie(response: Response) {
  const cookie = response.headers.getSetCookie().find((value) => value.startsWith("better-auth.session_token="));
  if (!cookie) throw new Error("Expected a session cookie.");
  expect(cookie).toMatch(/;\s*HttpOnly\b/i);
  return cookie.split(";", 1)[0];
}

afterEach(() => vi.unstubAllEnvs());

test("registers, signs in, and signs out with email and password without Google credentials", async () => {
  vi.stubEnv("MONGODB_URI", "mongodb://localhost:27017/taplify");
  vi.stubEnv("MONGODB_DB_NAME", "taplify");
  vi.stubEnv("BETTER_AUTH_SECRET", randomBytes(32).toString("base64"));
  vi.stubEnv("BETTER_AUTH_URL", origin);
  vi.stubEnv("GOOGLE_CLIENT_ID", "");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "");

  const credentials = { email: "alex@example.com", password: "test-password-only" };
  const registration = { ...credentials, name: "alex" };
  const shortPassword = await postAuth("/sign-up/email", { ...registration, password: "short" });
  expect(shortPassword.status).toBe(400);

  const signUp = await postAuth("/sign-up/email", registration);
  expect(signUp.status).toBe(200);
  const { user } = await signUp.json();
  expect(user).toMatchObject({ email: credentials.email, name: "alex", emailVerified: false });
  const getSession = (cookie: string) => app.request(`${authUrl}/get-session`, { headers: { Cookie: cookie } });
  expect(await (await getSession(sessionCookie(signUp))).json()).toMatchObject({ user: { id: user.id } });

  const duplicate = await postAuth("/sign-up/email", { ...registration, email: credentials.email.toUpperCase() });
  expect(duplicate.status).toBe(422);
  const wrongPassword = await postAuth("/sign-in/email", { ...credentials, password: "incorrect-password" });
  expect(wrongPassword.status).toBe(401);

  const signIn = await postAuth("/sign-in/email", credentials);
  expect(signIn.status).toBe(200);
  expect(await signIn.json()).toMatchObject({ user: { id: user.id } });
  const signedInCookie = sessionCookie(signIn);
  const signOut = await postAuth("/sign-out", {}, signedInCookie);
  expect(signOut.status).toBe(200);
  expect(await (await getSession(signedInCookie)).json()).toBeNull();
});
