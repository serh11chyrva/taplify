import "server-only";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { pageAnalyticsCookie, pageAnalyticsDeclineCookie, pageAnalyticsSeconds } from "@/lib/dashboard/analytics-consent";
import { publishedImage } from "@/server/dashboard/publication";
import { acceptSubmission, liveForm } from "@/server/dashboard/submissions";
import { DashboardError, missingResource, validate } from "@/server/dashboard/errors";
import { consentedBrowser, createAnalyticsCookie } from "@/server/dashboard/analytics-consent";
import { dashboardFeatures } from "@/server/dashboard/features";
import { recordPageEvent } from "@/server/dashboard/analytics";
import { checkWriteOrigin, jsonBody } from "./dashboard";

export const publicPagesApi = new Hono().basePath("/public/pages");

publicPagesApi.post("/consent", bodyLimit({ maxSize: 512 }), async (c) => {
  checkWriteOrigin(c.req.raw);
  if (!dashboardFeatures().analytics) throw missingResource();
  const { granted } = validate(z.object({ granted: z.boolean() }), await jsonBody(c.req.raw));
  const options = {
    path: "/", httpOnly: true, sameSite: "Lax" as const, secure: new URL(c.req.url).protocol === "https:",
  };
  if (granted) {
    const existing = getCookie(c, pageAnalyticsCookie);
    if (!consentedBrowser(existing)) {
      setCookie(c, pageAnalyticsCookie, createAnalyticsCookie(), { ...options, maxAge: pageAnalyticsSeconds });
    }
    deleteCookie(c, pageAnalyticsDeclineCookie, options);
  } else {
    deleteCookie(c, pageAnalyticsCookie, options);
    setCookie(c, pageAnalyticsDeclineCookie, "1", { ...options, maxAge: pageAnalyticsSeconds });
  }
  c.header("Cache-Control", "no-store");
  return c.json({ granted });
});

publicPagesApi.get("/:slug/media/:assetId", (c) => publishedImage(c.req.param("slug"), c.req.param("assetId")));
publicPagesApi.post("/:slug/events", bodyLimit({ maxSize: 4096 }), async (c) => {
  checkWriteOrigin(c.req.raw);
  c.header("Cache-Control", "no-store");
  return c.json(await recordPageEvent(c.req.param("slug"), c.req.raw, await jsonBody(c.req.raw)));
});
publicPagesApi.get("/:slug/form", async (c) => {
  const { page, form } = await liveForm(c.req.param("slug"));
  c.header("Cache-Control", "no-store");
  return c.json({ form, version: page.formVersion });
});
publicPagesApi.post("/:slug/submissions", bodyLimit({ maxSize: 64 * 1024, onError: () => {
  throw new DashboardError(422, "REQUEST_TOO_LARGE", "This submission is too large.");
} }), async (c) => {
  checkWriteOrigin(c.req.raw);
  c.header("Cache-Control", "no-store");
  return c.json(await acceptSubmission(c.req.param("slug"), c.req.raw, await jsonBody(c.req.raw)));
});
