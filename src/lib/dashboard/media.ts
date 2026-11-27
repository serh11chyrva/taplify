import { z } from "zod";
import { organizationApiPath } from "./organizations";

export const mediaId = z.string().regex(/^[a-f0-9]{24}$/);
export const imageDetails = z.object({
  assetId: mediaId.optional(),
  alt: z.string().max(250),
  caption: z.string().max(250),
});

export type ImageDetails = z.infer<typeof imageDetails>;

export function organizationMediaPath(organizationId: string) {
  return `${organizationApiPath(organizationId)}/media`;
}
