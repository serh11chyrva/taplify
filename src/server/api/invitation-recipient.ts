import "server-only";
import { Hono } from "hono";
import { getSession } from "@/server/services/session";
import { DashboardError } from "@/server/dashboard/errors";
import { acceptInvitation, verifyInvitationEmail } from "@/server/dashboard/invitations";
import { checkWriteOrigin, selectOrganization } from "./dashboard";

export const invitationApi = new Hono().basePath("/organization-invitations");

async function invitationUser(request: Request) {
  checkWriteOrigin(request);
  const session = await getSession(request.headers);
  if (!session) throw new DashboardError(401, "UNAUTHENTICATED", "Sign in to continue.");
  return session.user;
}

invitationApi.post("/:invitationId/accept", async (c) => {
  c.header("Cache-Control", "private, no-store");
  const user = await invitationUser(c.req.raw);
  const result = await acceptInvitation(user, c.req.param("invitationId"));
  selectOrganization(c, result.organizationId);
  return c.json(result);
});

invitationApi.post("/:invitationId/verify-email", async (c) => {
  c.header("Cache-Control", "private, no-store");
  const user = await invitationUser(c.req.raw);
  return c.json(await verifyInvitationEmail(user, c.req.param("invitationId"), c.req.raw));
});
