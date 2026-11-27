import "server-only";
import { z } from "zod";
import { draftAssetIds, draftSchema, type PageDraft } from "@/lib/dashboard/draft";
import { formProblem, pageForm } from "@/lib/dashboard/forms";
import { getPageModel } from "@/server/db/models/page";
import { connectMongoose } from "@/server/db/mongoose";
import { databaseConfigured, publicSiteOrigin } from "@/server/env";
import { DashboardError, isDuplicateKey, missingResource, validate } from "./errors";
import { checkMediaReferences, mediaResponse } from "./media";
import { requirePage } from "./pages";

const slugSchema = z.string().trim().toLowerCase().min(1).max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letters, numbers, and single hyphens.");
const publishInput = z.object({ expectedRevision: z.number().int().positive(), slug: slugSchema.optional() });

export function publicUrl(slug: string) {
  return new URL(`/p/${slug}`, publicSiteOrigin()).href;
}

function hasContent(draft: PageDraft) {
  return draft.blocks.some((block) => {
    switch (block.type) {
      case "profile": return Boolean(block.name.trim() || block.bio.trim() || block.avatar);
      case "hero": return Boolean(block.heading.trim() || block.description.trim() || block.image?.assetId);
      case "links": return block.items.some((item) => item.label.trim() && item.url);
      case "social": return block.items.some((item) => item.url);
      case "markdown": return Boolean(block.text.trim());
      case "embed": return Boolean(block.url);
      case "image": return Boolean(block.image.assetId);
      case "gallery": return block.items.some((item) => item.assetId);
      case "portfolio": return block.items.some((item) => item.title.trim() || item.description.trim() || item.image.assetId || item.url);
      case "contact": return block.fields.length > 0;
    }
  });
}

export async function publishPage(userId: string, organizationId: string, pageId: string, raw: unknown) {
  const { page } = await requirePage(userId, organizationId, pageId, "page:publish");
  if (page.archivedAt) throw missingResource();
  const { expectedRevision, slug } = validate(publishInput, raw);
  if (page.revision !== expectedRevision) {
    throw new DashboardError(409, "REVISION_CONFLICT", "The draft changed. Load the latest version before publishing.");
  }
  const nextSlug = page.slug ?? slug;
  if (!nextSlug) throw new DashboardError(422, "SLUG_REQUIRED", "Choose a public slug.");
  if (page.slug && slug && page.slug !== slug) throw new DashboardError(409, "SLUG_RESERVED", "This page already has a permanent slug.");
  const url = publicUrl(nextSlug);
  const draft = draftSchema.parse(page.draft);
  const form = pageForm(draft);
  const problem = form ? formProblem(form) : null;
  if (problem) throw new DashboardError(422, "INVALID_FORM", problem);
  const priorForm = page.publishedDraft ? pageForm(draftSchema.parse(page.publishedDraft)) : undefined;
  const formVersion = (page.formVersion ?? 0) + Number(JSON.stringify(priorForm) !== JSON.stringify(form));
  if (!hasContent(draft)) throw new DashboardError(422, "EMPTY_PAGE", "Add content to the page before publishing.");
  await checkMediaReferences(organizationId, draftAssetIds(draft));
  try {
    const updated = await getPageModel().findOneAndUpdate(
      {
        _id: pageId, organizationId, archivedAt: null, revision: expectedRevision,
        publicationVersion: page.publicationVersion || { $in: [null, 0] },
      },
      { $set: { slug: nextSlug, publishedDraft: draft, publishedAt: new Date(), formVersion }, $inc: { publicationVersion: 1 } },
      { returnDocument: "after" },
    ).lean();
    if (!updated) throw new DashboardError(409, "PUBLICATION_CONFLICT", "The page changed. Reload it before publishing.");
    return { slug: nextSlug, url, version: updated.publicationVersion };
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    throw new DashboardError(409, "SLUG_TAKEN", "That public slug is already in use.");
  }
}

export async function unpublishPage(userId: string, organizationId: string, pageId: string) {
  await requirePage(userId, organizationId, pageId, "page:publish");
  await getPageModel().updateOne(
    { _id: pageId, organizationId, publishedAt: { $ne: null } },
    { $set: { publishedAt: null }, $inc: { publicationVersion: 1 } },
  );
  return { published: false };
}

export async function archivePage(userId: string, organizationId: string, pageId: string, raw: unknown) {
  const { page } = await requirePage(userId, organizationId, pageId, "page:publish");
  const { confirmation } = validate(z.object({ confirmation: z.string().max(45) }), raw);
  if (confirmation !== page.name) {
    throw new DashboardError(422, "NAME_MISMATCH", "Enter the page name exactly as shown.");
  }
  if (page.archivedAt) return { archived: true };
  const result = await getPageModel().updateOne(
    { _id: pageId, organizationId, name: confirmation, archivedAt: null },
    { $set: { archivedAt: new Date(), publishedAt: null }, $inc: { publicationVersion: 1 } },
  );
  if (!result.matchedCount) throw new DashboardError(409, "PUBLICATION_CONFLICT", "The page changed. Reload it before archiving.");
  return { archived: true };
}

export async function restorePage(userId: string, organizationId: string, pageId: string) {
  await requirePage(userId, organizationId, pageId, "page:publish");
  await getPageModel().updateOne(
    { _id: pageId, organizationId, archivedAt: { $ne: null } },
    { $set: { archivedAt: null, publishedAt: null }, $inc: { publicationVersion: 1 } },
  );
  return { archived: false };
}

export async function publishedPage(slug: string) {
  const normalized = slugSchema.safeParse(slug);
  if (!normalized.success || slug !== normalized.data || !databaseConfigured()) return null;
  await connectMongoose();
  const page = await getPageModel().findOne({ slug, publishedAt: { $type: "date" }, archivedAt: null })
    .select("_id organizationId publishedDraft publicationVersion publishedAt formVersion").lean();
  if (!page?.publishedDraft || !page.publishedAt) return null;
  return {
    id: page._id, organizationId: page.organizationId, slug,
    draft: draftSchema.parse(page.publishedDraft), version: page.publicationVersion, publishedAt: page.publishedAt,
    formVersion: page.formVersion ?? 0,
  };
}

export async function publishedImage(slug: string, assetId: string) {
  const page = await publishedPage(slug);
  if (!page || !draftAssetIds(page.draft).includes(assetId)) throw missingResource();
  return mediaResponse(page.organizationId, assetId);
}
