import "server-only";
import { z } from "zod";
import { leadStatus, type Lead, type LeadFilters } from "@/lib/dashboard/leads";
import { resourceId } from "@/lib/dashboard/organizations";
import { escapeRegex } from "@/lib/dashboard/pages";
import { getLeadModel, type LeadRecord } from "@/server/db/models/lead";
import { dashboardFeatures } from "./features";
import { missingResource, validate } from "./errors";
import { requirePage } from "./pages";

const leadPatch = z.object({ status: leadStatus.optional(), read: z.boolean().optional() })
  .refine((patch) => patch.status !== undefined || patch.read !== undefined, "Choose a change to save.");

export function leadDto(lead: LeadRecord): Lead {
  return {
    id: lead._id, status: lead.status, readAt: lead.readAt?.toISOString() ?? null, submittedAt: lead.submittedAt.toISOString(),
    formVersion: lead.formVersion, answers: lead.answers, source: lead.source ?? null,
  };
}

export function leadQuery(organizationId: string, pageId: string, filters: LeadFilters) {
  const search = { $regex: escapeRegex(filters.search), $options: "i" };
  const until = filters.to ? new Date(new Date(`${filters.to}T00:00:00.000Z`).getTime() + 86400 * 1000) : undefined;
  return {
    organizationId, pageId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.read ? { readAt: filters.read === "unread" ? null : { $ne: null } } : {}),
    ...(filters.search ? { $or: [{ "answers.value": search }, { source: search }] } : {}),
    ...(filters.from || until ? { submittedAt: {
      ...(filters.from ? { $gte: new Date(`${filters.from}T00:00:00.000Z`) } : {}),
      ...(until ? { $lt: until } : {}),
    } } : {}),
  };
}

export async function requireInbox(userId: string, organizationId: string, pageId: string, permission: "leads:manage" | "leads:delete" | "leads:export" = "leads:manage") {
  if (!dashboardFeatures().forms) throw missingResource();
  return requirePage(userId, organizationId, pageId, permission);
}

function leadKey(organizationId: string, pageId: string, leadId: string) {
  if (!resourceId.safeParse(leadId).success) throw missingResource();
  return { _id: leadId, organizationId, pageId };
}

export async function listLeads(userId: string, organizationId: string, pageId: string, filters: LeadFilters) {
  await requireInbox(userId, organizationId, pageId);
  const size = 25;
  const query = leadQuery(organizationId, pageId, filters);
  const [items, total] = await Promise.all([
    getLeadModel().find(query).sort({ submittedAt: -1, _id: 1 }).skip((filters.page - 1) * size).limit(size).lean(),
    getLeadModel().countDocuments(query),
  ]);
  return { items: items.map(leadDto), total, size };
}

export async function readLead(userId: string, organizationId: string, pageId: string, leadId: string) {
  await requireInbox(userId, organizationId, pageId);
  const record = await getLeadModel().findOne(leadKey(organizationId, pageId, leadId)).lean();
  if (!record) throw missingResource();
  return leadDto(record);
}

export async function updateLead(userId: string, organizationId: string, pageId: string, leadId: string, input: unknown) {
  await requireInbox(userId, organizationId, pageId);
  const { read, status } = validate(leadPatch, input);
  const changes = {
    ...(status ? { status } : {}),
    ...(read !== undefined ? { readAt: read ? { $ifNull: ["$readAt", new Date()] } : null } : {}),
  };
  const record = await getLeadModel().findOneAndUpdate(
    leadKey(organizationId, pageId, leadId), [{ $set: changes }],
    { returnDocument: "after", updatePipeline: true },
  ).lean();
  if (!record) throw missingResource();
  return leadDto(record);
}

export async function removeLead(userId: string, organizationId: string, pageId: string, leadId: string) {
  await requireInbox(userId, organizationId, pageId, "leads:delete");
  const result = await getLeadModel().deleteOne(leadKey(organizationId, pageId, leadId));
  if (!result.deletedCount) throw missingResource();
  return { deleted: true };
}
