import "server-only";
import { randomUUID } from "node:crypto";
import { inviteInput, invitationPath, roleLabels, type OrganizationInvitation } from "@/lib/dashboard/invitations";
import { resourceId } from "@/lib/dashboard/organizations";
import { connectMongoose } from "@/server/db/mongoose";
import { getInvitationModel, type InvitationRecord } from "@/server/db/models/organization-invitation";
import { getMembershipModel, getOrganizationModel } from "@/server/db/models/organization";
import { getAuthEnv } from "@/server/env";
import { DashboardError, isDuplicateKey, missingResource, validate } from "./errors";
import { dashboardFeatures } from "./features";
import { mailConfigured, sendTransactionalMail } from "./mail";
import { requireOrganization } from "./organizations";
import { limitPublicRequest } from "./rate-limit";
import { requestOwnVerification } from "./verify-email";

type Recipient = { id: string; email: string; emailVerified: boolean };

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

async function invitationForRecipient(user: Recipient, invitationId: string) {
  requireInvitationRelease();
  if (!dashboardFeatures().dashboard || !resourceId.safeParse(invitationId).success) throw missingResource();
  await connectMongoose();
  const record = await getInvitationModel().findOne({ _id: invitationId, email: user.email.trim().toLowerCase() }).lean();
  if (!record || (record.state === "accepted" && record.acceptedBy !== user.id)) throw missingResource();
  return record;
}

export async function recipientInvitation(user: Recipient, invitationId: string) {
  const record = await invitationForRecipient(user, invitationId);
  const organization = await getOrganizationModel().findById(record.organizationId).select("name personalOwnerId").lean();
  if (!organization || organization.personalOwnerId) throw missingResource();
  let { state } = invitationDto(record);
  if (state === "accepted" && !await getMembershipModel().exists({ organizationId: record.organizationId, userId: user.id })) {
    state = "revoked";
  }
  return { organizationId: record.organizationId, organizationName: organization.name, state, role: record.role };
}

function unavailableInvitation() {
  return new DashboardError(409, "INVITATION_UNAVAILABLE", "This invitation expired or was revoked.");
}

export async function verifyInvitationEmail(user: Recipient, invitationId: string, request: Request) {
  const record = await invitationForRecipient(user, invitationId);
  if (record.state !== "pending" || record.expiresAt <= new Date()) throw unavailableInvitation();
  if (user.emailVerified) return { requested: false };
  await limitPublicRequest(request, "invitation-verification", user.id, 3);
  return requestOwnVerification(request.headers, user.email, invitationPath(invitationId));
}

export async function acceptInvitation(user: Recipient, invitationId: string) {
  const record = await invitationForRecipient(user, invitationId);
  if (!user.emailVerified) {
    throw new DashboardError(403, "EMAIL_NOT_VERIFIED", "Verify your email before accepting the invitation.");
  }
  const { organizationId, email } = record;
  const membership = { organizationId, userId: user.id };
  const mongoose = await connectMongoose();
  await mongoose.connection.transaction(async (session) => {
    const invitations = getInvitationModel();
    const members = getMembershipModel();
    const claim = await invitations.findOneAndUpdate(
      { _id: invitationId, organizationId, email, state: "pending", expiresAt: { $gt: new Date() } },
      { $set: { state: "accepted", acceptedBy: user.id } },
      { session, returnDocument: "after" },
    ).lean();
    if (!claim) {
      const accepted = await invitations.exists({ _id: invitationId, state: "accepted", acceptedBy: user.id }).session(session);
      const member = await members.exists(membership).session(session);
      if (accepted && member) return;
      throw unavailableInvitation();
    }
    await members.updateOne(membership, { $setOnInsert: { ...membership, role: claim.role } }, { upsert: true, session });
  });
  return { organizationId };
}
