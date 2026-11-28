import "server-only";
import "reflect-metadata";
import { getModelForClass, index, modelOptions, prop } from "@typegoose/typegoose";
import type { TeamRole } from "@/lib/dashboard/invitations";

@index({ organizationId: 1, requestId: 1 }, { unique: true })
@index({ organizationId: 1, email: 1 }, { unique: true, partialFilterExpression: { state: "pending" } })
@index({ organizationId: 1, createdAt: -1 })
@index({ expiresAt: 1 }, { expireAfterSeconds: 7 * 86400 })
@modelOptions({
  options: { customName: "OrganizationInvitation" },
  schemaOptions: { collection: "organization_invitations", timestamps: true, autoIndex: false, bufferCommands: false },
})
export class InvitationRecord {
  @prop({ type: () => String, required: true })
  public _id!: string;

  @prop({ type: () => String, required: true })
  public organizationId!: string;

  @prop({ type: () => String, required: true })
  public organizationName!: string;

  @prop({ type: () => String, required: true })
  public requestId!: string;

  @prop({ type: () => String, required: true })
  public email!: string;

  @prop({ type: () => String, required: true, enum: ["editor", "operator"] })
  public role!: TeamRole;

  @prop({ type: () => String, required: true, enum: ["pending", "accepted", "revoked"] })
  public state!: "pending" | "accepted" | "revoked";

  @prop({ type: () => String, required: true, enum: ["pending", "sent", "failed"] })
  public delivery!: "pending" | "sent" | "failed";

  @prop({ type: () => Date, required: true })
  public expiresAt!: Date;

  @prop({ type: () => String })
  public acceptedBy?: string;

  public createdAt!: Date;
}

export const getInvitationModel = () => getModelForClass(InvitationRecord);
