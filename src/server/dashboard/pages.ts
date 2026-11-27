import "server-only";
import { resourceId } from "@/lib/dashboard/organizations";
import { escapeRegex, type directoryFilters, type PageSummary } from "@/lib/dashboard/pages";
import { getPageModel, type TaplifyPage } from "@/server/db/models/page";
import { missingResource } from "./errors";
import { requireOrganization, type OrganizationPermission } from "./organizations";

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
    pages.find(query).select("-draft").sort({ updatedAt: -1, _id: 1 }).skip((filters.page - 1) * size).limit(size).lean(),
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
    .select("-draft").sort({ updatedAt: -1, _id: 1 }).limit(15).lean();
  return pages.map(summarize);
}
