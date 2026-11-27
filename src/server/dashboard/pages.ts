import "server-only";
import { randomUUID } from "node:crypto";
import { resourceId } from "@/lib/dashboard/organizations";
import { createPageInput, draftAssetIds, draftInput, draftSchema, initialDraft } from "@/lib/dashboard/draft";
import { pageForm } from "@/lib/dashboard/forms";
import { escapeRegex, type directoryFilters, type PageSummary } from "@/lib/dashboard/pages";
import { getPageModel, type TaplifyPage } from "@/server/db/models/page";
import { DashboardError, isDuplicateKey, missingResource, validate } from "./errors";
import { requireOrganization, type OrganizationPermission } from "./organizations";
import { checkMediaReferences } from "./media";
import { dashboardFeatures } from "./features";

function summarize(page: Pick<TaplifyPage, "_id" | "name" | "type" | "slug" | "publishedAt" | "archivedAt" | "updatedAt">): PageSummary {
  return {
    id: page._id, name: page.name, type: page.type, slug: page.slug ?? null,
    status: page.archivedAt ? "archived" : page.publishedAt ? "published" : "draft",
    updatedAt: page.updatedAt.toISOString(),
  };
}

export async function listPages(userId: string, organizationId: string, filters: ReturnType<typeof directoryFilters>) {
  await requireOrganization(userId, organizationId);
  const size = 25;
  const query = {
    organizationId,
    archivedAt: filters.status === "archived" ? { $ne: null } : null,
    ...(filters.status === "published" ? { publishedAt: { $ne: null } } : {}),
    ...(filters.status === "draft" ? { publishedAt: null } : {}),
    ...(filters.q ? { name: { $regex: escapeRegex(filters.q), $options: "i" } } : {}),
  };
  const pages = getPageModel();
  const [items, total] = await Promise.all([
    pages.find(query).select("-draft -publishedDraft").sort({ updatedAt: -1, _id: 1 }).skip((filters.page - 1) * size).limit(size).lean(),
    pages.countDocuments(query),
  ]);
  return { items: items.map(summarize), total, size };
}

export async function requirePage(userId: string, organizationId: string, pageId: string, permission?: OrganizationPermission) {
  const organization = await requireOrganization(userId, organizationId, permission);
  if (!resourceId.safeParse(pageId).success) throw missingResource();
  const page = await getPageModel().findOne({ _id: pageId, organizationId }).lean();
  if (!page) throw missingResource();
  return { page, organization };
}

export async function pageSummary(userId: string, organizationId: string, pageId: string) {
  const { page } = await requirePage(userId, organizationId, pageId);
  return summarize(page);
}

export async function sidebarPages(userId: string, organizationId: string) {
  await requireOrganization(userId, organizationId);
  const pages = await getPageModel().find({ organizationId, archivedAt: null })
    .select("-draft -publishedDraft").sort({ updatedAt: -1, _id: 1 }).limit(15).lean();
  return pages.map(summarize);
}

export async function createDraft(userId: string, organizationId: string, raw: unknown) {
  await requireOrganization(userId, organizationId, "draft:write");
  const { name, type, bio, requestId, avatar } = validate(createPageInput, raw);
  await checkMediaReferences(organizationId, avatar ? [avatar] : []);
  const model = getPageModel();
  try {
    const page = await model.create({
      _id: randomUUID(), organizationId, name, type, createRequestId: requestId,
      draft: initialDraft(name, type, bio, avatar), revision: 1,
    });
    return summarize(page);
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    const existing = await model.findOne({ organizationId, createRequestId: requestId }).lean();
    if (!existing) throw error;
    return summarize(existing);
  }
}

export async function readDraft(userId: string, organizationId: string, pageId: string) {
  const { page } = await requirePage(userId, organizationId, pageId, "draft:write");
  if (page.archivedAt) throw missingResource();
  return { page: summarize(page), draft: draftSchema.parse(page.draft), revision: page.revision };
}

export async function saveDraft(userId: string, organizationId: string, pageId: string, raw: unknown) {
  const { page } = await requirePage(userId, organizationId, pageId, "draft:write");
  if (page.archivedAt) throw missingResource();
  const { expectedRevision, draft } = validate(draftInput, raw);
  if (pageForm(draft) && !dashboardFeatures().forms) {
    const existingForm = pageForm(draftSchema.parse(page.draft));
    if (JSON.stringify(existingForm) !== JSON.stringify(pageForm(draft))) throw missingResource();
  }
  await checkMediaReferences(organizationId, draftAssetIds(draft));
  const updated = await getPageModel().findOneAndUpdate(
    { _id: pageId, organizationId, revision: expectedRevision, archivedAt: null },
    { $set: { draft, name: draft.name }, $inc: { revision: 1 } },
    { returnDocument: "after" },
  ).lean();
  if (!updated) throw new DashboardError(409, "REVISION_CONFLICT", "The saved draft changed. Load the latest draft to continue.");
  return { page: summarize(updated), draft, revision: updated.revision };
}
