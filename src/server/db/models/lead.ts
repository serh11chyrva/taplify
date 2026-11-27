import "server-only";
import "reflect-metadata";
import { getModelForClass, index, modelOptions, prop, Severity } from "@typegoose/typegoose";
import type { LeadAnswer, LeadStatus } from "@/lib/dashboard/leads";

@index({ organizationId: 1, pageId: 1, submittedAt: -1, _id: 1 })
@modelOptions({
  options: { customName: "Lead", allowMixed: Severity.ALLOW },
  schemaOptions: { collection: "leads", autoIndex: false, bufferCommands: false },
})
export class LeadRecord {
  @prop({ type: () => String, required: true })
  public _id!: string;

  @prop({ type: () => String, required: true })
  public organizationId!: string;

  @prop({ type: () => String, required: true })
  public pageId!: string;

  @prop({ type: () => String, required: true, enum: ["new", "in_progress", "closed"] })
  public status!: LeadStatus;

  @prop({ type: () => Date, required: true })
  public submittedAt!: Date;

  @prop({ type: () => Date, default: null })
  public readAt?: Date | null;

  @prop({ type: () => Number, required: true })
  public formVersion!: number;

  @prop({ type: () => [Object], required: true })
  public answers!: LeadAnswer[];

  @prop({ type: () => String })
  public source?: string;
}

@index({ pageId: 1, submissionId: 1 }, { unique: true })
@modelOptions({
  options: { customName: "SubmissionReceipt" },
  schemaOptions: { collection: "submission_receipts", autoIndex: false, bufferCommands: false },
})
class Receipt {
  @prop({ type: () => String, required: true })
  public pageId!: string;

  @prop({ type: () => String, required: true })
  public submissionId!: string;

  @prop({ type: () => String, required: true })
  public fingerprint!: string;
}

export const getLeadModel = () => getModelForClass(LeadRecord);
export const getReceiptModel = () => getModelForClass(Receipt);
