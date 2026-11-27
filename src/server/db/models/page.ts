import "server-only";
import "reflect-metadata";
import { getModelForClass, index, modelOptions, prop, Severity } from "@typegoose/typegoose";
import type { PageType } from "@/lib/dashboard/pages";

@index({ organizationId: 1, archivedAt: 1, updatedAt: -1, _id: 1 })
@index({ organizationId: 1, createRequestId: 1 }, { unique: true, partialFilterExpression: { createRequestId: { $type: "string" } } })
@modelOptions({
  options: { customName: "TaplifyPage", allowMixed: Severity.ALLOW },
  schemaOptions: { collection: "pages", timestamps: true, autoIndex: false, bufferCommands: false },
})
export class TaplifyPage {
  @prop({ type: () => String, required: true })
  public _id!: string;

  @prop({ type: () => String, required: true })
  public organizationId!: string;

  @prop({ type: () => String, required: true })
  public name!: string;

  @prop({ type: () => String, required: true, enum: ["Personal", "Company", "Product"] })
  public type!: PageType;

  @prop({ type: () => Object, required: true })
  public draft!: unknown;

  @prop({ type: () => String })
  public createRequestId?: string;

  @prop({ type: () => Number, required: true, default: 1 })
  public revision!: number;

  @prop({ type: () => String })
  public slug?: string;

  @prop({ type: () => Date, default: null })
  public publishedAt?: Date | null;

  @prop({ type: () => Date, default: null })
  public archivedAt?: Date | null;

  public updatedAt!: Date;
}

export const getPageModel = () => getModelForClass(TaplifyPage);
