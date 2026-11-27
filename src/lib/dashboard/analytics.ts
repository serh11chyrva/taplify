import { utcDate } from "./leads";
import type { DashboardSearch } from "./pages";

const dayMs = 86400 * 1000;
export type ReportRange = { from: string; to: string };
export type TrafficCounts = { views: number; uniqueVisitors: number; clicks: number; submissions: number };
export type AnalyticsReport = {
  range: ReportRange;
  totals: TrafficCounts & { conversion: number | null };
  days: (TrafficCounts & { date: string })[];
  links: { label: string; count: number }[];
  referrers: { label: string; count: number }[];
  campaigns: { label: string; count: number }[];
  byPage: Record<string, TrafficCounts>;
};
export type AnalyticsSample = {
  pageId: string;
  type: "view" | "click" | "submission";
  occurredAt: Date;
  pageViewId?: string;
  visitorKey?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  linkLabel?: string;
};

export function reportBounds(range: ReportRange) {
  return {
    start: new Date(`${range.from}T00:00:00.000Z`),
    end: new Date(new Date(`${range.to}T00:00:00.000Z`).getTime() + dayMs),
  };
}

export function reportRange(search: DashboardSearch, now = new Date()): ReportRange {
  const today = now.toISOString().slice(0, 10);
  const midnight = new Date(`${today}T00:00:00.000Z`).getTime();
  const from = utcDate(search.from);
  const to = utcDate(search.to);
  if (from && to && to <= today && from <= to) {
    const bounds = reportBounds({ from, to });
    if (bounds.start.getTime() >= midnight - 89 * dayMs && bounds.end.getTime() - bounds.start.getTime() <= 30 * dayMs) return { from, to };
  }
  const days = search.range === "7" ? 7 : 30;
  return { from: new Date(midnight - (days - 1) * dayMs).toISOString().slice(0, 10), to: today };
}

export function emptyTraffic(): TrafficCounts {
  return { views: 0, uniqueVisitors: 0, clicks: 0, submissions: 0 };
}

function tally() {
  return { counts: emptyTraffic(), visitors: new Set<string>() };
}

function increment(bucket: ReturnType<typeof tally>, event: AnalyticsSample) {
  switch (event.type) {
    case "view":
      bucket.counts.views += 1;
      if (event.visitorKey) bucket.visitors.add(event.visitorKey);
      break;
    case "click": bucket.counts.clicks += 1; break;
    case "submission": bucket.counts.submissions += 1; break;
  }
}

function addRank(ranks: Map<string, number>, label: string) {
  ranks.set(label, (ranks.get(label) ?? 0) + 1);
}

function ranksFor(ranks: Map<string, number>) {
  return [...ranks].sort(([leftName, left], [rightName, right]) => right - left || leftName.localeCompare(rightName))
    .slice(0, 10).map(([label, count]) => ({ label, count }));
}

function traffic(bucket: ReturnType<typeof tally>) {
  return { ...bucket.counts, uniqueVisitors: bucket.visitors.size };
}

export async function summarizeAnalytics(range: ReportRange, events: AsyncIterable<AnalyticsSample> | Iterable<AnalyticsSample>): Promise<AnalyticsReport> {
  const bounds = reportBounds(range);
  const all = tally();
  const dates = new Map<string, ReturnType<typeof tally>>();
  const pages = new Map<string, ReturnType<typeof tally>>();
  const views = new Set<string>();
  const converted = new Set<string>();
  const links = new Map<string, number>();
  const referrers = new Map<string, number>();
  const campaigns = new Map<string, number>();
  for (let milliseconds = bounds.start.getTime(); milliseconds < bounds.end.getTime(); milliseconds += dayMs) {
    dates.set(new Date(milliseconds).toISOString().slice(0, 10), tally());
  }
  for await (const event of events) {
    const date = event.occurredAt.toISOString().slice(0, 10);
    const daily = dates.get(date);
    if (!daily) continue;
    const page = pages.get(event.pageId) ?? tally();
    pages.set(event.pageId, page);
    increment(page, event);
    increment(all, event);
    increment(daily, event);
    const key = event.pageViewId && event.visitorKey ? `${event.pageId}:${event.pageViewId}:${event.visitorKey}` : undefined;
    if (event.type === "view") {
      if (key) views.add(key);
      addRank(referrers, event.referrer || "Direct");
      const campaign = [event.utmSource, event.utmMedium, event.utmCampaign].filter(Boolean).join(" / ");
      if (campaign) addRank(campaigns, campaign);
    } else if (event.type === "click") {
      if (event.linkLabel) addRank(links, event.linkLabel);
    } else if (key) {
      converted.add(key);
    }
  }
  let conversions = 0;
  for (const key of converted) if (views.has(key)) conversions += 1;
  return {
    range,
    totals: { ...traffic(all), conversion: all.counts.views ? conversions / all.counts.views : null },
    days: [...dates].map(([date, bucket]) => ({ date, ...traffic(bucket) })),
    byPage: Object.fromEntries([...pages].map(([id, bucket]) => [id, traffic(bucket)])),
    links: ranksFor(links), referrers: ranksFor(referrers), campaigns: ranksFor(campaigns),
  };
}
