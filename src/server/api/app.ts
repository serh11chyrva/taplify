import "server-only";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { getAuth } from "@/server/auth";
import { isAuthConfigured } from "@/server/env";
import { getHealth } from "@/server/services/health";
import { DashboardError } from "@/server/dashboard/errors";
import { dashboardApi } from "./dashboard";
import { publicPagesApi } from "./public-pages";

export const app = new Hono().basePath("/api");

app.use("*", requestId(), secureHeaders());
app.get("/health", (c) => c.json(getHealth()));
app.on(["GET", "POST"], "/auth/*", async (c) => {
  if (!isAuthConfigured()) {
    return c.json({ error: { code: "AUTH_NOT_CONFIGURED", message: "Authentication is not configured." } }, 503);
  }
  const auth = await getAuth();
  return auth.handler(c.req.raw);
});
app.route("/", dashboardApi);
app.route("/", publicPagesApi);

app.notFound((c) => c.json({ error: { code: "NOT_FOUND", message: "Endpoint not found." } }, 404));
app.onError((error, c) => {
  if (error instanceof DashboardError) {
    c.header("Cache-Control", "no-store");
    if (error.status === 429) c.header("Retry-After", "60");
    return c.json({ error: { code: error.code, message: error.message, fields: error.fields } }, error.status);
  }
  if (error instanceof HTTPException) return error.getResponse();
  // Never log request bodies, query strings, cookies, secrets, or raw errors.
  console.error(JSON.stringify({ event: "request_failed", requestId: c.get("requestId"), errorType: error.name }));
  return c.json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong." } }, 500);
});
