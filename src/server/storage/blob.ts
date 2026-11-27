import "server-only";
import { del, get, put } from "@vercel/blob";
import { z } from "zod";
import { getBlobToken } from "@/server/env";

export const imageMetadataSchema = z.object({
  type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive().max(2 * 1024 * 1024),
});

const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;

export async function storeImage(organizationId: string, image: File) {
  const organization = z.uuid().parse(organizationId);
  const metadata = imageMetadataSchema.parse(image);
  return put(`organizations/${organization}/${crypto.randomUUID()}.${extensions[metadata.type]}`, image, {
    access: "private",
    contentType: metadata.type,
    token: getBlobToken(),
    addRandomSuffix: true,
  });
}

export function readImage(pathname: string) {
  return get(pathname, { access: "private", token: getBlobToken() });
}

export function discardImage(url: string) {
  return del(url, { token: getBlobToken() });
}
