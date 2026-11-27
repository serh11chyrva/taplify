import { z } from "zod";
import { organizationApiPath, organizationPath } from "./organizations";

export const pageType = z.enum(["Personal", "Company", "Product"]);
export type PageType = z.infer<typeof pageType>;
export type PageStatus = "draft" | "published" | "archived";
export type PageSummary = {
  id: string;
  name: string;
  type: PageType;
  status: PageStatus;
  slug: string | null;
  updatedAt: string;
};

export type DashboardSearch = Record<string, string | string[] | undefined>;

export function pagePath(organizationId: string, pageId: string) {
  return `${organizationPath(organizationId)}/pages/${pageId}`;
}

export function pageApiPath(organizationId: string, pageId: string) {
  return `${organizationApiPath(organizationId)}/pages/${pageId}`;
}

export function directoryFilters(search: DashboardSearch) {
  const q = typeof search.q === "string" ? search.q.trim().slice(0, 100) : "";
  const { status } = search;
  const page = Number(typeof search.page === "string" ? search.page : 1);
  return {
    q,
    status: status === "draft" || status === "published" || status === "archived" ? status : undefined,
    page: Number.isInteger(page) && page >= 1 && page <= 1000 ? page : 1,
  };
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
