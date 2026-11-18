import "server-only";
import { put } from "@vercel/blob";
import { z } from "zod";
import { getBlobToken } from "@/server/env";

export const imageMetadataSchema = z.object({
  type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive().max(2 * 1024 * 1024),
});

const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;

// Server adapter only. An upload endpoint must authenticate the owner and verify
// file signatures before calling this function and persisting a MediaAsset.
export async function storeImage(ownerId: string, image: File) {
  const owner = z.string().regex(/^[a-zA-Z0-9_-]+$/).parse(ownerId);
  const metadata = imageMetadataSchema.parse(image);
  return put(`owners/${owner}/${crypto.randomUUID()}.${extensions[metadata.type]}`, image, {
    access: "public",
    contentType: metadata.type,
    token: getBlobToken(),
    addRandomSuffix: true,
  });
}
