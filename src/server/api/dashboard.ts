import "server-only";
import { Hono, type Context } from "hono";
import { setCookie } from "hono/cookie";
import { lastOrganizationCookie } from "@/lib/dashboard/organizations";
import { getSession } from "@/server/services/session";
import { createOrganization, listOrganizations, renameOrganization, requireOrganization } from "@/server/dashboard/organizations";
import { DashboardError, missingResource } from "@/server/dashboard/errors";
import { dashboardFeatures } from "@/server/dashboard/features";

type DashboardApi = { Variables: { userId: string } };

export const dashboardApi = new Hono<DashboardApi>().basePath("/organizations");

export function checkWriteOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin)) {
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
