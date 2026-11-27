import "server-only";
import "reflect-metadata";
import { getModelForClass, index, modelOptions, prop } from "@typegoose/typegoose";

const eventTypes = ["view", "click", "submission"] as const;

@index({ pageId: 1, type: 1, eventId: 1 }, { unique: true })
@index({ organizationId: 1, occurredAt: 1 })
@index({ organizationId: 1, pageId: 1, occurredAt: 1 })
@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@modelOptions({
  options: { customName: "PageEvent" },
  schemaOptions: { collection: "page_events", autoIndex: false, bufferCommands: false },
})
export class PageEventRecord {
  @prop({ type: () => String, required: true })
  public organizationId!: string;

  @prop({ type: () => String, required: true })
  public pageId!: string;

  @prop({ type: () => String, required: true, enum: eventTypes })
  public type!: typeof eventTypes[number];

  @prop({ type: () => String, required: true })
  public eventId!: string;

  @prop({ type: () => String })
  public pageViewId?: string;

  @prop({ type: () => Date, required: true })
  public occurredAt!: Date;

  @prop({ type: () => Date, required: true })
  public expiresAt!: Date;
}

export const getPageEventModel = () => getModelForClass(PageEventRecord);
export const eventRetentionMs = 90 * 86400 * 1000;
