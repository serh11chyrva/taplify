import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "@/server/api/app";
import { getMediaAssetModel } from "@/server/db/models/media-asset";
import { imageMetadataSchema } from "@/server/storage/blob";

describe("technical foundation", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("constructs and validates a Typegoose model without connecting to MongoDB", async () => {
    const Model = getMediaAssetModel();
    const asset = new Model({
      ownerId: "owner-1", url: "https://example.com/avatar.webp",
      pathname: "owners/owner-1/avatar.webp", contentType: "image/webp", size: 1024,
    });
    await expect(asset.validate()).resolves.toBeUndefined();
    expect(getMediaAssetModel()).toBe(Model);
    await expect(new Model({ contentType: "image/svg+xml", size: 3 * 1024 * 1024 }).validate()).rejects.toThrow();
  });

  it("serves Hono health requests without external credentials", async () => {
    const response = await app.request("/api/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", service: "taplify" });
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("returns a JSON 404 for an unknown endpoint", async () => {
    const response = await app.request("/api/unknown");
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  it("rejects unconfigured authentication without opening a database connection", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    const response = await app.request("/api/auth/get-session");
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "AUTH_NOT_CONFIGURED" } });
  });

  it("enforces the planned image formats and 2 MB size limit", () => {
    expect(imageMetadataSchema.safeParse({ type: "image/png", size: 2 * 1024 * 1024 }).success).toBe(true);
    for (const input of [
      { type: "image/svg+xml", size: 100 },
      { type: "image/png", size: 2 * 1024 * 1024 + 1 },
      { type: "image/jpeg", size: 0 },
    ]) expect(imageMetadataSchema.safeParse(input).success).toBe(false);
  });
});
