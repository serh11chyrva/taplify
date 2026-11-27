import "server-only";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { publishedImage } from "@/server/dashboard/publication";
import { acceptSubmission, liveForm } from "@/server/dashboard/submissions";
import { DashboardError } from "@/server/dashboard/errors";
import { checkWriteOrigin, jsonBody } from "./dashboard";

export const publicPagesApi = new Hono().basePath("/public/pages");

publicPagesApi.get("/:slug/media/:assetId", (c) => publishedImage(c.req.param("slug"), c.req.param("assetId")));
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
