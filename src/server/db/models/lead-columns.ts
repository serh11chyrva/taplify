import "server-only";
import "reflect-metadata";
import { getModelForClass, index, modelOptions, prop } from "@typegoose/typegoose";

@index({ organizationId: 1, pageId: 1, userId: 1 }, { unique: true })
@modelOptions({
  options: { customName: "LeadColumns" },
  schemaOptions: { collection: "lead_columns", autoIndex: false, bufferCommands: false },
})
class LeadColumns {
  @prop({ type: () => String, required: true })
  public organizationId!: string;
  @prop({ type: () => String, required: true })
  public pageId!: string;
  @prop({ type: () => String, required: true })
  public userId!: string;
  @prop({ type: () => [String], required: true })
  public columns!: string[];
}

export const getLeadColumnsModel = () => getModelForClass(LeadColumns);
