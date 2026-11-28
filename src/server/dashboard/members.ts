import "server-only";
import { z } from "zod";
import { getAuth } from "@/server/auth";
import { getInvitationModel } from "@/server/db/models/organization-invitation";
import { getMembershipModel } from "@/server/db/models/organization";
import { connectMongoose } from "@/server/db/mongoose";
import { teamRole, type OrganizationMember } from "@/lib/dashboard/invitations";
import { DashboardError, missingResource, validate } from "./errors";
import { requireTeamOwner } from "./invitations";

const memberId = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);

async function editableMember(organizationId: string, userId: string) {
  if (!memberId.safeParse(userId).success) throw missingResource();
  const member = await getMembershipModel().findOne({ organizationId, userId }).lean();
  if (!member) throw missingResource();
  if (member.role === "owner") throw new DashboardError(403, "OWNER_REQUIRED", "The owner’s access is permanent.");
  return member;
}

export async function listMembers(actorId: string, organizationId: string): Promise<OrganizationMember[]> {
  await requireTeamOwner(actorId, organizationId);
  const members = await getMembershipModel().find({ organizationId }).lean();
  const authContext = await (await getAuth()).$context;
  const details = await Promise.all(members.map(async (member) => {
    const user = await authContext.internalAdapter.findUserById(member.userId);
    return { id: member.userId, role: member.role, name: user?.name ?? "Account unavailable", email: user?.email ?? "" };
  }));
  return details.sort((left, right) => Number(right.role === "owner") - Number(left.role === "owner") || left.name.localeCompare(right.name));
}

export async function setMemberRole(actorId: string, organizationId: string, userId: string, raw: unknown) {
  await requireTeamOwner(actorId, organizationId);
  await editableMember(organizationId, userId);
  const { role } = validate(z.object({ role: teamRole }), raw);
  const result = await getMembershipModel().updateOne({ organizationId, userId, role: { $ne: "owner" } }, { $set: { role } });
  if (!result.matchedCount) throw missingResource();
  return { role };
}

export async function removeMember(actorId: string, organizationId: string, userId: string) {
  await requireTeamOwner(actorId, organizationId);
  await editableMember(organizationId, userId);
  const authContext = await (await getAuth()).$context;
  const user = await authContext.internalAdapter.findUserById(userId);
  const email = user?.email.trim().toLowerCase();
  const mongoose = await connectMongoose();
  await mongoose.connection.transaction(async (session) => {
    const removed = await getMembershipModel().deleteOne({ organizationId, userId, role: { $ne: "owner" } }, { session });
    if (!removed.deletedCount) throw missingResource();
    if (email) await getInvitationModel().updateMany({ organizationId, email, state: "pending" }, { $set: { state: "revoked" } }, { session });
  });
  return { removed: true };
}
