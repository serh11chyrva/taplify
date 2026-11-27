import { afterEach, expect, test, vi } from "vitest";
import { reportRange, summarizeAnalytics, type AnalyticsSample } from "@/lib/dashboard/analytics";
import { pageAnalyticsCookie, pageAnalyticsDeclineCookie, pageAnalyticsSeconds } from "@/lib/dashboard/analytics-consent";
import { consentedBrowser, createAnalyticsCookie, organizationVisitor } from "@/server/dashboard/analytics-consent";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

test("counts distinct browsers by organization and converts each measured view once", async () => {
  const time = new Date("2026-11-28T04:00:00Z");
  const event = (pageId: string, type: AnalyticsSample["type"], pageViewId?: string): AnalyticsSample => ({
    pageId, type, pageViewId, visitorKey: pageViewId ? "same-browser" : undefined, occurredAt: time,
  });
  const result = await summarizeAnalytics({ from: "2026-11-27", to: "2026-11-28" }, [
    event("first", "view", "one"), event("second", "view", "two"), event("first", "click", "one"),
    event("first", "submission", "one"), event("first", "submission", "one"), event("second", "submission"),
    { ...event("first", "view", "outside"), occurredAt: new Date("2026-11-29T00:00:00Z") },
  ]);
  expect(result.totals).toEqual({ views: 2, uniqueVisitors: 1, clicks: 1, submissions: 3, conversion: 0.5 });
  expect(result.days[0]).toMatchObject({ date: "2026-11-27", views: 0, uniqueVisitors: 0 });
  expect(result.byPage.second).toMatchObject({ views: 1, uniqueVisitors: 1, submissions: 1 });
});

test("uses inclusive UTC calendar dates and bounds a custom range", () => {
  const now = new Date("2026-11-28T00:00:00Z");
  expect(reportRange({ range: "7" }, now)).toEqual({ from: "2026-11-22", to: "2026-11-28" });
  expect(reportRange({ from: "2026-11-01", to: "2026-11-30" }, now)).toEqual({ from: "2026-10-30", to: "2026-11-28" });
});

test("rejects a tampered or expired visitor token and respects withdrawal", () => {
  vi.stubEnv("PAGE_ANALYTICS_ENABLED", "true");
  vi.stubEnv("PAGE_ANALYTICS_SECRET", "test-page-analytics-secret-at-least-32-characters");
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-28T10:00:00Z"));
  const token = createAnalyticsCookie();
  expect(consentedBrowser(token)).toBeTruthy();
  expect(consentedBrowser(token + "x")).toBeUndefined();
  const cookie = `${pageAnalyticsCookie}=${token}`;
  const request = new Request("https://taplify.test/p/example", { headers: { cookie } });
  expect(organizationVisitor(request, "first")).not.toBe(organizationVisitor(request, "second"));
  expect(organizationVisitor(new Request(request, { headers: { cookie: `${cookie}; ${pageAnalyticsDeclineCookie}=1` } }), "first")).toBeUndefined();
  vi.advanceTimersByTime(pageAnalyticsSeconds * 1000);
  expect(consentedBrowser(token)).toBeUndefined();
});
