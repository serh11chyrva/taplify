import "server-only";
import { z } from "zod";
import { type ReportRange, reportBounds, summarizeAnalytics } from "@/lib/dashboard/analytics";
import { contentLink, type PageDraft } from "@/lib/dashboard/draft";
import { embedSource } from "@/lib/dashboard/embed";
import { resourceId } from "@/lib/dashboard/organizations";
import { getPageEventModel, eventRetentionMs } from "@/server/db/models/page-event";
import { getPageModel } from "@/server/db/models/page";
import { DashboardError, isDuplicateKey, missingResource, validate } from "./errors";
import { dashboardFeatures } from "./features";
import { organizationVisitor, requestBrowser } from "./analytics-consent";
import { requireOrganization } from "./organizations";
import { requirePage } from "./pages";
import { publishedPage } from "./publication";
import { limitPublicRequest } from "./rate-limit";

const source = z.string().trim().max(80).regex(/^[a-zA-Z0-9][a-zA-Z0-9 ._-]*$/).optional();
const attribution = z.object({
  referrer: z.string().max(253).regex(/^[a-z0-9.-]+$/).optional(),
  utmSource: source, utmMedium: source, utmCampaign: source,
});
const eventInput = z.object({
  type: z.enum(["view", "click"]), eventId: resourceId, pageViewId: resourceId,
  publicationVersion: z.number().int().positive(), linkId: resourceId.optional(), source: attribution.optional(),
}).refine((event) => event.type === "view" ? event.eventId === event.pageViewId : Boolean(event.linkId), "Check the event identifier.");

function trackedLinks(draft: PageDraft) {
  const links = new Map<string, string>();
  function add(id: string, url: string, label: string) {
    if (url !== "#contact" && contentLink(url) && label.trim()) links.set(id, label.trim().slice(0, 120));
  }
  for (const block of draft.blocks) {
    switch (block.type) {
      case "hero": add(block.id, block.actionUrl, block.actionLabel); break;
      case "links": for (const item of block.items) add(item.id, item.url, item.label); break;
      case "social": for (const item of block.items) add(item.id, item.url, item.network); break;
      case "portfolio": for (const item of block.items) add(item.id, item.url, item.title || "View project"); break;
      case "embed": {
        const embedded = embedSource(block.url);
        if (embedded) add(block.id, embedded.href, block.title || embedded.provider);
        break;
      }
    }
  }
  return links;
}

export async function recordPageEvent(slug: string, request: Request, raw: unknown) {
  if (!dashboardFeatures().analytics) throw missingResource();
  if (!requestBrowser(request)) return { recorded: false };
  const input = validate(eventInput, raw);
  const page = await publishedPage(slug);
  if (!page) throw missingResource();
  const visitorKey = organizationVisitor(request, page.organizationId);
  if (!visitorKey) return { recorded: false };
  if (input.publicationVersion !== page.version) {
    throw new DashboardError(409, "PUBLICATION_CHANGED", "This page was updated.");
  }
  const linkLabel = input.type === "click" ? trackedLinks(page.draft).get(input.linkId ?? "") : undefined;
  if (input.type === "click" && !linkLabel) throw new DashboardError(422, "UNKNOWN_LINK", "This link is unavailable.");
  await limitPublicRequest(request, "page-events", page.id, 120);
  const occurredAt = new Date();
  const key = { pageId: page.id, type: input.type, eventId: input.eventId };
  try {
    await getPageEventModel().updateOne(key, { $setOnInsert: {
      ...key, organizationId: page.organizationId, pageViewId: input.pageViewId, visitorKey, linkLabel,
      ...(input.type === "view" ? input.source : {}), occurredAt, expiresAt: new Date(occurredAt.getTime() + eventRetentionMs),
    } }, { upsert: true });
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
  }
  return { recorded: true };
}

export async function loadAnalytics(userId: string, organizationId: string, range: ReportRange, pageId?: string) {
  if (!dashboardFeatures().analytics) throw missingResource();
  if (pageId) await requirePage(userId, organizationId, pageId, "analytics:read");
  else await requireOrganization(userId, organizationId, "analytics:read");

  const { start, end } = reportBounds(range);
  const events = getPageEventModel().find({
    organizationId, ...(pageId ? { pageId } : {}), occurredAt: { $gte: start, $lt: end }, expiresAt: { $gt: new Date() },
  }).select("pageId type occurredAt pageViewId visitorKey referrer utmSource utmMedium utmCampaign linkLabel").lean().cursor();
  try {
    const report = await summarizeAnalytics(range, events);
    const pages = pageId ? [] : (await getPageModel().find({ organizationId }).select("_id name")
      .sort({ name: 1, _id: 1 }).lean()).map((page) => ({ id: page._id, name: page.name }));
    return { report, pages };
  } finally {
    await events.close();
  }
}
