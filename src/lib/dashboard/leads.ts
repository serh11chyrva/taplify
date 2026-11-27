import { z } from "zod";
import type { ContactField } from "./forms";
import type { DashboardSearch } from "./pages";

export const leadStatus = z.enum(["new", "in_progress", "closed"]);
export const leadStatusLabels = { new: "New", in_progress: "In Progress", closed: "Closed" } as const;
export type LeadStatus = z.infer<typeof leadStatus>;
export type LeadAnswer = { id: string; label: string; kind: ContactField["kind"]; value: string | string[] };
export type Lead = {
  id: string;
  status: LeadStatus;
  readAt: string | null;
  submittedAt: string;
  formVersion: number;
  answers: LeadAnswer[];
  source: string | null;
};

export type LeadFilters = {
  search: string;
  status?: LeadStatus;
  read?: "read" | "unread";
  from?: string;
  to?: string;
  page: number;
};

export function utcDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : undefined;
}

export function leadFilters(query: DashboardSearch): LeadFilters {
  const status = leadStatus.safeParse(query.status);
  const page = Number(typeof query.page === "string" ? query.page : 1);
  return {
    search: typeof query.search === "string" ? query.search.trim().slice(0, 100) : "",
    status: status.success ? status.data : undefined,
    read: query.read === "read" || query.read === "unread" ? query.read : undefined,
    from: utcDate(query.from), to: utcDate(query.to),
    page: Number.isInteger(page) && page >= 1 && page <= 1000 ? page : 1,
  };
}

export function leadQueryString(filters: LeadFilters, page = filters.page) {
  const query = new URLSearchParams();
  for (const key of ["search", "status", "read", "from", "to"] as const) {
    const value = filters[key];
    if (value) query.set(key, value);
  }
  if (page > 1) query.set("page", String(page));
  return query.size ? `?${query}` : "";
}

export function leadTitle(lead: Lead) {
  const identity = lead.answers.find((answer) => answer.kind === "email" || answer.kind === "text");
  return typeof identity?.value === "string" ? identity.value : `Inquiry ${lead.id.slice(0, 8)}`;
}
