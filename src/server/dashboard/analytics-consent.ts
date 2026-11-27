import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { pageAnalyticsCookie, pageAnalyticsDeclineCookie, pageAnalyticsSeconds, type PageAnalyticsChoice } from "@/lib/dashboard/analytics-consent";
import { resourceId } from "@/lib/dashboard/organizations";
import { dashboardFeatures } from "./features";
import { missingResource } from "./errors";

function secret() {
  const value = process.env.PAGE_ANALYTICS_SECRET;
  if (!dashboardFeatures().analytics || !value) throw missingResource();
  return value;
}

function signature(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createAnalyticsCookie() {
  const expires = Math.floor(Date.now() / 1000) + pageAnalyticsSeconds;
  const value = `${randomUUID()}.${expires}`;
  return `${value}.${signature(value)}`;
}

export function consentedBrowser(value: string | undefined) {
  if (!value || value.length > 110 || !dashboardFeatures().analytics) return undefined;
  const [id, expires, proof, extra] = value.split(".");
  if (!resourceId.safeParse(id).success || !/^\d{10}$/.test(expires ?? "") || Number(expires) <= Date.now() / 1000 || !proof || extra !== undefined) {
    return undefined;
  }
  const expected = Buffer.from(signature(`${id}.${expires}`));
  const actual = Buffer.from(proof);
  return actual.length === expected.length && timingSafeEqual(actual, expected) ? id : undefined;
}

export function analyticsChoice(visitor: string | undefined, declined: string | undefined): PageAnalyticsChoice {
  if (declined === "1") return "declined";
  return consentedBrowser(visitor) ? "granted" : "unanswered";
}

export function requestBrowser(request: Request) {
  const cookies = request.headers.get("cookie")?.split(";").map((item) => item.trim());
  if (cookies?.includes(`${pageAnalyticsDeclineCookie}=1`)) return undefined;
  return consentedBrowser(cookies?.find((item) => item.startsWith(`${pageAnalyticsCookie}=`))?.slice(pageAnalyticsCookie.length + 1));
}

export function organizationVisitor(request: Request, organizationId: string) {
  const browser = requestBrowser(request);
  if (!browser) return undefined;
  return createHmac("sha256", secret()).update(`organization:${organizationId}:${browser}`).digest("base64url");
}
