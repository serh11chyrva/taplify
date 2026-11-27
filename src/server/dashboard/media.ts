import "server-only";
import { getMediaAssetModel } from "@/server/db/models/media-asset";
import { discardImage, imageMetadataSchema, readImage, storeImage } from "@/server/storage/blob";
import { mediaId } from "@/lib/dashboard/media";
import { DashboardError, missingResource, validate } from "./errors";
import { requireOrganization } from "./organizations";

function matchesImageSignature(bytes: Uint8Array, type: string) {
  const startsWith = (signature: number[]) => signature.every((value, index) => bytes[index] === value);
  if (type === "image/jpeg") return bytes.length >= 4 && startsWith([0xff, 0xd8, 0xff]);
  if (type === "image/png") return bytes.length >= 24 && startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    && String.fromCharCode(...bytes.slice(12, 16)) === "IHDR";
  return bytes.length >= 16 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    && ["VP8 ", "VP8L", "VP8X"].includes(String.fromCharCode(...bytes.slice(12, 16)));
}

export async function uploadImage(userId: string, organizationId: string, request: Request) {
  await requireOrganization(userId, organizationId, "draft:write");
  let parts: FormData;
  try {
    parts = await request.formData();
  } catch {
    throw new DashboardError(422, "INVALID_IMAGE", "Choose a JPEG, PNG, or WebP image.");
  }
  const image = parts.get("image");
  if (!(image instanceof File)) throw new DashboardError(422, "INVALID_IMAGE", "Choose an image to upload.");
  const metadata = validate(imageMetadataSchema, image);
  if (!matchesImageSignature(new Uint8Array(await image.slice(0, 32).arrayBuffer()), metadata.type)) {
    throw new DashboardError(422, "INVALID_IMAGE", "The file content does not match the selected image format.");
  }

  const blob = await storeImage(organizationId, image);
  try {
    const asset = await getMediaAssetModel().create({
      ownerId: userId, organizationId, url: blob.url, pathname: blob.pathname, contentType: metadata.type, size: metadata.size,
    });
    return { id: asset._id.toString() };
  } catch (error) {
    await discardImage(blob.url).catch(() => {
      console.error(JSON.stringify({ event: "image_cleanup_failed" }));
    });
    throw error;
  }
}

export async function checkMediaReferences(organizationId: string, assetIds: string[]) {
  if (!assetIds.length) return;
  const unique = [...new Set(assetIds)];
  const count = await getMediaAssetModel().countDocuments({ _id: { $in: unique }, organizationId });
  if (count !== unique.length) throw new DashboardError(422, "INVALID_IMAGE", "Choose images from this organization.");
}

export async function mediaResponse(organizationId: string, assetId: string) {
  if (!mediaId.safeParse(assetId).success) throw missingResource();
  const asset = await getMediaAssetModel().findOne({ _id: assetId, organizationId }).lean();
  if (!asset) throw missingResource();
  const blob = await readImage(asset.pathname);
  if (blob?.statusCode !== 200) throw missingResource();
  return new Response(blob.stream, { headers: {
    "Content-Type": asset.contentType, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store",
  } });
}

export async function privateImage(userId: string, organizationId: string, assetId: string) {
  await requireOrganization(userId, organizationId, "draft:write");
  return mediaResponse(organizationId, assetId);
}
