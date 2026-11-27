import "server-only";
import "reflect-metadata";
import { getModelForClass, index, modelOptions, prop } from "@typegoose/typegoose";
import type { OrganizationRole } from "@/lib/dashboard/organizations";

@index({ personalOwnerId: 1 }, { unique: true, partialFilterExpression: { personalOwnerId: { $type: "string" } } })
@modelOptions({
  options: { customName: "Organization" },
  schemaOptions: { collection: "organizations", timestamps: true, autoIndex: false, bufferCommands: false },
})
class Organization {
  @prop({ type: () => String, required: true })
  public _id!: string;

  @prop({ type: () => String, required: true })
  public name!: string;

  @prop({ type: () => String })
  public personalOwnerId?: string;

  public createdAt!: Date;
}

@index({ organizationId: 1, userId: 1 }, { unique: true })
@index({ userId: 1, organizationId: 1 })
@modelOptions({
  options: { customName: "OrganizationMembership" },
  schemaOptions: { collection: "organization_memberships", timestamps: true, autoIndex: false, bufferCommands: false },
})
class Membership {
  @prop({ type: () => String, required: true })
  public organizationId!: string;

  @prop({ type: () => String, required: true })
  public userId!: string;

  @prop({ type: () => String, required: true, enum: ["owner", "editor", "operator"] })
  public role!: OrganizationRole;
}

export const getOrganizationModel = () => getModelForClass(Organization);
export const getMembershipModel = () => getModelForClass(Membership);
