import "server-only";
import { Hono } from "hono";
import { publishedImage } from "@/server/dashboard/publication";

export const publicPagesApi = new Hono().basePath("/public/pages");

publicPagesApi.get("/:slug/media/:assetId", (c) => publishedImage(c.req.param("slug"), c.req.param("assetId")));
