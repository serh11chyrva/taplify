import "server-only";
import { z } from "zod";
import { draftSchema } from "@/lib/dashboard/draft";
import { pageForm } from "@/lib/dashboard/forms";
import { leadColumnValue, systemLeadColumns, type LeadColumn, type LeadFilters } from "@/lib/dashboard/leads";
import { getLeadModel } from "@/server/db/models/lead";
import { getLeadColumnsModel } from "@/server/db/models/lead-columns";
import type { TaplifyPage } from "@/server/db/models/page";
import { DashboardError, validate } from "./errors";
import { leadDto, leadQuery, requireInbox } from "./leads";

async function availableColumns(organizationId: string, pageId: string, page: TaplifyPage): Promise<LeadColumn[]> {
  const historic = await getLeadModel().aggregate<{ _id: string; label: string }>([
    { $match: { organizationId, pageId } },
    { $sort: { submittedAt: -1, _id: 1 } },
    { $unwind: "$answers" },
    { $group: { _id: "$answers.id", label: { $first: "$answers.label" } } },
    { $sort: { label: 1, _id: 1 } },
  ]);
  const snapshot = page.publishedDraft ? draftSchema.parse(page.publishedDraft) : undefined;
  const current = snapshot ? pageForm(snapshot)?.fields ?? [] : [];
  const fields = new Map(current.map((field) => [field.id, field.label]));
  for (const field of historic) {
    if (!fields.has(field._id)) fields.set(field._id, field.label);
  }
  return [...systemLeadColumns, ...[...fields].map(([id, label]) => ({ key: `answer:${id}`, label }))];
}

export async function leadColumns(userId: string, organizationId: string, pageId: string) {
  const { page } = await requireInbox(userId, organizationId, pageId);
  const [available, preference] = await Promise.all([
    availableColumns(organizationId, pageId, page),
    getLeadColumnsModel().findOne({ organizationId, pageId, userId }).lean(),
  ]);
  const keys = new Set(available.map((column) => column.key));
  const automatic = ["status", "read", "submittedAt", ...available.filter((column) => column.key.startsWith("answer:")).slice(0, 3).map((column) => column.key)];
  return { available, selected: preference ? preference.columns.filter((key) => keys.has(key)) : automatic, automatic: !preference };
}

export async function setLeadColumns(userId: string, organizationId: string, pageId: string, raw: unknown) {
  const { page } = await requireInbox(userId, organizationId, pageId);
  const { columns } = validate(z.object({ columns: z.array(z.string().max(48)).max(100).nullable() }), raw);
  const key = { organizationId, pageId, userId };
  if (!columns) {
    await getLeadColumnsModel().deleteOne(key);
    return { saved: true };
  }
  const available = new Set((await availableColumns(organizationId, pageId, page)).map((column) => column.key));
  if (columns.some((column) => !available.has(column))) {
    throw new DashboardError(422, "UNKNOWN_COLUMN", "The available columns changed. Reload the list before saving.");
  }
  await getLeadColumnsModel().updateOne(key, { $set: { columns: [...new Set(columns)] }, $setOnInsert: key }, { upsert: true });
  return { saved: true };
}

export function csvCell(value: string) {
  const escaped = /^[\t\r\n]|^\s*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${escaped.replaceAll('"', '""')}"`;
}

export async function leadExport(userId: string, organizationId: string, pageId: string, filters: LeadFilters) {
  const { page } = await requireInbox(userId, organizationId, pageId, "leads:export");
  const columns = await availableColumns(organizationId, pageId, page);
  const cursor = getLeadModel().find(leadQuery(organizationId, pageId, filters)).sort({ submittedAt: -1, _id: 1 }).lean().cursor();
  const encoder = new TextEncoder();
  const line = (values: string[]) => encoder.encode(`${values.map(csvCell).join(",")}\r\n`);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode("\ufeff"));
      controller.enqueue(line(columns.map((column) => column.label)));
    },
    async pull(controller) {
      try {
        const record = await cursor.next();
        if (!record) {
          await cursor.close();
          controller.close();
          return;
        }
        const lead = leadDto(record);
        controller.enqueue(line(columns.map((column) => leadColumnValue(lead, column.key))));
      } catch {
        await cursor.close().catch(() => {});
        controller.error(new Error("Unable to export this inbox."));
      }
    },
    async cancel() {
      await cursor.close();
    },
  });
  return new Response(stream, { headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="taplify-leads-${pageId}.csv"`,
    "Cache-Control": "private, no-store",
  } });
}
