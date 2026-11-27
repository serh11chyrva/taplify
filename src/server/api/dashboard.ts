import "server-only";
import { Hono, type Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { setCookie } from "hono/cookie";
import { lastOrganizationCookie } from "@/lib/dashboard/organizations";
import { getSession } from "@/server/services/session";
import { createOrganization, listOrganizations, renameOrganization, requireOrganization } from "@/server/dashboard/organizations";
import { DashboardError, missingResource } from "@/server/dashboard/errors";
import { publicSiteOrigin } from "@/server/env";
import { dashboardFeatures } from "@/server/dashboard/features";
import { directoryFilters } from "@/lib/dashboard/pages";
import { leadFilters } from "@/lib/dashboard/leads";
import { reportRange } from "@/lib/dashboard/analytics";
import { loadAnalytics } from "@/server/dashboard/analytics";
import { createDraft, listPages, readDraft, saveDraft } from "@/server/dashboard/pages";
import { privateImage, uploadImage } from "@/server/dashboard/media";
import { archivePage, publishPage, restorePage, unpublishPage } from "@/server/dashboard/publication";
import { listLeads, readLead, removeLead, updateLead } from "@/server/dashboard/leads";
import { leadColumns, leadExport, setLeadColumns } from "@/server/dashboard/lead-columns";

type DashboardApi = { Variables: { userId: string } };

export const dashboardApi = new Hono<DashboardApi>().basePath("/organizations");

export function checkWriteOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = new Set([new URL(request.url).origin, publicSiteOrigin()]);
  if (process.env.BETTER_AUTH_URL) allowed.add(new URL(process.env.BETTER_AUTH_URL).origin);
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && !allowed.has(origin))) {
    throw new DashboardError(403, "FORBIDDEN", "This request is not allowed.");
  }
}

export async function jsonBody(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new DashboardError(422, "INVALID_INPUT", "Send a JSON request.");
  }
  try {
    return await request.json() as unknown;
  } catch {
    throw new DashboardError(422, "INVALID_INPUT", "Send a valid JSON request.");
  }
}

dashboardApi.use("*", async (c, next) => {
  c.header("Cache-Control", "private, no-store");
  if (!dashboardFeatures().dashboard) throw missingResource();
  if (c.req.method !== "GET" && c.req.method !== "HEAD") checkWriteOrigin(c.req.raw);
  const session = await getSession(c.req.raw.headers);
  if (!session) throw new DashboardError(401, "UNAUTHENTICATED", "Sign in to continue.");
  c.set("userId", session.user.id);
  await next();
});
dashboardApi.use("*", bodyLimit({ maxSize: 2 * 1024 * 1024 + 65536, onError: () => {
  throw new DashboardError(422, "REQUEST_TOO_LARGE", "The request is too large.");
} }));

function selectOrganization(c: Context<DashboardApi>, organizationId: string) {
  setCookie(c, lastOrganizationCookie, organizationId, {
    path: "/dashboard", httpOnly: true, sameSite: "Lax",
    secure: new URL(c.req.url).protocol === "https:", maxAge: 180 * 86400,
  });
}

dashboardApi.get("/", async (c) => c.json(await listOrganizations(c.get("userId"))));
dashboardApi.post("/", async (c) => {
  const organization = await createOrganization(c.get("userId"), await jsonBody(c.req.raw));
  selectOrganization(c, organization.id);
  return c.json(organization, 201);
});
dashboardApi.patch("/:organizationId", async (c) => c.json(await renameOrganization(
  c.get("userId"), c.req.param("organizationId"), await jsonBody(c.req.raw),
)));
dashboardApi.post("/:organizationId/select", async (c) => {
  const organization = await requireOrganization(c.get("userId"), c.req.param("organizationId"));
  selectOrganization(c, organization.id);
  return c.json(organization);
});
dashboardApi.get("/:organizationId/analytics", async (c) => c.json(await loadAnalytics(
  c.get("userId"), c.req.param("organizationId"), reportRange(c.req.query()),
)));
dashboardApi.get("/:organizationId/pages/:pageId/analytics", async (c) => c.json(await loadAnalytics(
  c.get("userId"), c.req.param("organizationId"), reportRange(c.req.query()), c.req.param("pageId"),
)));

dashboardApi.get("/:organizationId/pages", async (c) => c.json(await listPages(
  c.get("userId"), c.req.param("organizationId"), directoryFilters(c.req.query()),
)));
dashboardApi.post("/:organizationId/pages", async (c) => c.json(await createDraft(
  c.get("userId"), c.req.param("organizationId"), await jsonBody(c.req.raw),
), 201));
dashboardApi.get("/:organizationId/pages/:pageId", async (c) => c.json(await readDraft(
  c.get("userId"), c.req.param("organizationId"), c.req.param("pageId"),
)));
dashboardApi.put("/:organizationId/pages/:pageId/draft", async (c) => c.json(await saveDraft(
  c.get("userId"), c.req.param("organizationId"), c.req.param("pageId"), await jsonBody(c.req.raw),
)));
dashboardApi.post("/:organizationId/media", async (c) => c.json(await uploadImage(
  c.get("userId"), c.req.param("organizationId"), c.req.raw,
), 201));
dashboardApi.get("/:organizationId/media/:assetId", (c) => privateImage(
  c.get("userId"), c.req.param("organizationId"), c.req.param("assetId"),
));
dashboardApi.post("/:organizationId/pages/:pageId/publish", async (c) => c.json(await publishPage(
  c.get("userId"), c.req.param("organizationId"), c.req.param("pageId"), await jsonBody(c.req.raw),
)));
dashboardApi.post("/:organizationId/pages/:pageId/unpublish", async (c) => c.json(await unpublishPage(
  c.get("userId"), c.req.param("organizationId"), c.req.param("pageId"),
)));
dashboardApi.post("/:organizationId/pages/:pageId/archive", async (c) => c.json(await archivePage(
  c.get("userId"), c.req.param("organizationId"), c.req.param("pageId"), await jsonBody(c.req.raw),
)));
dashboardApi.post("/:organizationId/pages/:pageId/restore", async (c) => c.json(await restorePage(
  c.get("userId"), c.req.param("organizationId"), c.req.param("pageId"),
)));
dashboardApi.get("/:organizationId/pages/:pageId/leads", async (c) => c.json(await listLeads(
  c.get("userId"), c.req.param("organizationId"), c.req.param("pageId"), leadFilters(c.req.query()),
)));
dashboardApi.get("/:organizationId/pages/:pageId/leads/export", (c) => leadExport(
  c.get("userId"), c.req.param("organizationId"), c.req.param("pageId"), leadFilters(c.req.query()),
));
dashboardApi.get("/:organizationId/pages/:pageId/lead-columns", async (c) => c.json(await leadColumns(
  c.get("userId"), c.req.param("organizationId"), c.req.param("pageId"),
)));
dashboardApi.put("/:organizationId/pages/:pageId/lead-columns", async (c) => c.json(await setLeadColumns(
  c.get("userId"), c.req.param("organizationId"), c.req.param("pageId"), await jsonBody(c.req.raw),
)));
dashboardApi.get("/:organizationId/pages/:pageId/leads/:leadId", async (c) => c.json(await readLead(
  c.get("userId"), c.req.param("organizationId"), c.req.param("pageId"), c.req.param("leadId"),
)));
dashboardApi.patch("/:organizationId/pages/:pageId/leads/:leadId", async (c) => c.json(await updateLead(
  c.get("userId"), c.req.param("organizationId"), c.req.param("pageId"), c.req.param("leadId"), await jsonBody(c.req.raw),
)));
dashboardApi.delete("/:organizationId/pages/:pageId/leads/:leadId", async (c) => c.json(await removeLead(
  c.get("userId"), c.req.param("organizationId"), c.req.param("pageId"), c.req.param("leadId"),
)));
