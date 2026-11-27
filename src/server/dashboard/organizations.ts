import "server-only";
import { randomUUID } from "node:crypto";
import { organizationCan, organizationInput, resourceId, type OrganizationPermission, type OrganizationSummary } from "@/lib/dashboard/organizations";
import { connectMongoose } from "@/server/db/mongoose";
import { getMembershipModel, getOrganizationModel } from "@/server/db/models/organization";
import { DashboardError, isDuplicateKey, missingResource, validate } from "./errors";

export async function requireOrganization(userId: string, organizationId: string, permission: OrganizationPermission = "workspace:read") {
  if (!resourceId.safeParse(organizationId).success) throw missingResource();
  await connectMongoose();
  const [organization, member] = await Promise.all([
    getOrganizationModel().findById(organizationId).lean(),
    getMembershipModel().findOne({ organizationId, userId }).lean(),
  ]);
  if (!organization || !member) throw missingResource();
  if (!organizationCan(member.role, permission)) {
    throw new DashboardError(403, "FORBIDDEN", "You do not have permission to perform this action.");
  }
  return {
    id: organization._id,
    name: organization.name,
    personal: Boolean(organization.personalOwnerId),
    role: member.role,
  } satisfies OrganizationSummary;
}

async function insertOrganization(userId: string, name: string, personal: boolean) {
  const organizationId = randomUUID();
  const mongoose = await connectMongoose();
  await mongoose.connection.transaction(async (session) => {
    await getOrganizationModel().create([{
      _id: organizationId, name, ...(personal ? { personalOwnerId: userId } : {}),
    }], { session });
    await getMembershipModel().create([{ organizationId, userId, role: "owner" }], { session });
  });
  return { id: organizationId, name, personal, role: "owner" } satisfies OrganizationSummary;
}

export async function listOrganizations(userId: string): Promise<OrganizationSummary[]> {
  await connectMongoose();
  const memberships = await getMembershipModel().find({ userId }).lean();
  const roles = new Map(memberships.map((member) => [member.organizationId, member.role]));
  const organizations = await getOrganizationModel().find({ _id: { $in: [...roles.keys()] } }).sort({ name: 1 }).lean();
  return organizations.flatMap((organization) => {
    const role = roles.get(organization._id);
    return role ? [{ id: organization._id, name: organization.name, personal: Boolean(organization.personalOwnerId), role }] : [];
  });
}

export async function resolveOrganization(userId: string, selected?: string): Promise<string> {
  const organizations = await listOrganizations(userId);
  const preferred = organizations.find((organization) => organization.id === selected);
  const personal = organizations.find((organization) => organization.personal);
  if (personal) return preferred?.id ?? personal.id;
  try {
    const organization = await insertOrganization(userId, "Personal", true);
    return preferred?.id ?? organization.id;
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    const existing = (await listOrganizations(userId)).find((organization) => organization.personal);
    if (!existing) throw error;
    return preferred?.id ?? existing.id;
  }
}

export async function createOrganization(userId: string, raw: unknown) {
  const { name } = validate(organizationInput, raw);
  return insertOrganization(userId, name, false);
}

export async function renameOrganization(userId: string, organizationId: string, raw: unknown) {
  await requireOrganization(userId, organizationId, "workspace:manage");
  const { name } = validate(organizationInput, raw);
  await getOrganizationModel().updateOne({ _id: organizationId }, { $set: { name } });
  return { id: organizationId, name };
}
