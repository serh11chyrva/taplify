import "server-only";
import { randomUUID } from "node:crypto";
import { inviteInput, invitationPath, roleLabels, type OrganizationInvitation } from "@/lib/dashboard/invitations";
import { resourceId } from "@/lib/dashboard/organizations";
import { connectMongoose } from "@/server/db/mongoose";
import { getInvitationModel, type InvitationRecord } from "@/server/db/models/organization-invitation";
import { getAuthEnv } from "@/server/env";
import { DashboardError, isDuplicateKey, missingResource, validate } from "./errors";
import { dashboardFeatures } from "./features";
import { mailConfigured, sendTransactionalMail } from "./mail";
import { requireOrganization } from "./organizations";
import { limitPublicRequest } from "./rate-limit";

function invitationDto(record: InvitationRecord, now = new Date()): OrganizationInvitation {
  return {
    id: record._id, email: record.email, role: record.role, delivery: record.delivery,
    state: record.state === "pending" && record.expiresAt <= now ? "expired" : record.state,
    expiresAt: record.expiresAt.toISOString(),
  };
}

export async function requireTeamOwner(userId: string, organizationId: string) {
  const organization = await requireOrganization(userId, organizationId, "workspace:manage");
  if (organization.personal) throw missingResource();
  return organization;
}

function requireInvitationRelease() {
  if (!dashboardFeatures().collaboration) throw missingResource();
}

export async function listInvitations(userId: string, organizationId: string) {
  requireInvitationRelease();
  await requireTeamOwner(userId, organizationId);
  const records = await getInvitationModel().find({ organizationId }).sort({ createdAt: -1, _id: 1 }).limit(100).lean();
  return records.map((record) => invitationDto(record));
}

async function deliver(record: InvitationRecord) {
  const invitations = getInvitationModel();
  const available = { _id: record._id, organizationId: record.organizationId, state: "pending" as const, expiresAt: { $gt: new Date() } };
  if (!await invitations.exists(available)) throw missingResource();
  if (record.delivery === "sent") return invitationDto(record);
  const url = new URL(invitationPath(record._id), getAuthEnv().BETTER_AUTH_URL).href;
  try {
    await sendTransactionalMail({
      recipient: record.email,
      subject: `You’re invited to ${record.organizationName} on Taplify`,
      text: `Join ${record.organizationName} as ${roleLabels[record.role]} on Taplify:\n\n${url}\n\nSign in with this email address to accept. This invitation expires in seven days.`,
      requestKey: `invite-${record._id}`,
    });
  } catch (error) {
    await invitations.updateOne({ ...available, delivery: { $ne: "sent" } }, { $set: { delivery: "failed" } });
    throw error;
  }
  await invitations.updateOne(available, { $set: { delivery: "sent" } });
  return invitationDto({ ...record, delivery: "sent" });
}

export async function createInvitation(userId: string, organizationId: string, request: Request, raw: unknown) {
  requireInvitationRelease();
  const organization = await requireTeamOwner(userId, organizationId);
  if (!mailConfigured()) throw new DashboardError(503, "MAIL_NOT_CONFIGURED", "Email delivery is not configured.");
  const input = validate(inviteInput, raw);
  await limitPublicRequest(request, "organization-invitations", userId, 20, 3600);
  const invitations = getInvitationModel();
  const key = { organizationId, requestId: input.requestId };
  const conflict = () => new DashboardError(409, "INVITATION_CONFLICT", "The invitation changed. Refresh and try again.");
  const mongoose = await connectMongoose();
  let record: InvitationRecord;
  try {
    record = await mongoose.connection.transaction(async (session) => {
      const existing = await invitations.findOne(key).session(session).lean();
      if (existing) return existing;
      await invitations.updateMany({ organizationId, email: input.email, state: "pending" }, { $set: { state: "revoked" } }, { session });
      const [created] = await invitations.create([{
        _id: randomUUID(), ...key, organizationName: organization.name, email: input.email, role: input.role,
        state: "pending", delivery: "pending", expiresAt: new Date(Date.now() + 7 * 86400 * 1000),
      }], { session });
      return created.toObject();
    });
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    const existing = await invitations.findOne(key).lean();
    if (!existing) throw conflict();
    record = existing;
  }
  if (record.email !== input.email || record.role !== input.role) throw conflict();
  return deliver(record);
}

export async function revokeInvitation(userId: string, organizationId: string, invitationId: string) {
  await requireTeamOwner(userId, organizationId);
  if (!resourceId.safeParse(invitationId).success) throw missingResource();
  const invitations = getInvitationModel();
  const key = { _id: invitationId, organizationId };
  const result = await invitations.updateOne({ ...key, state: "pending" }, { $set: { state: "revoked" } });
  if (!result.matchedCount) {
    const record = await invitations.findOne(key).lean();
    if (!record) throw missingResource();
    if (record.state === "accepted") throw new DashboardError(409, "INVITATION_ACCEPTED", "This person already joined. Manage their access in Members.");
  }
  return { revoked: true };
}
