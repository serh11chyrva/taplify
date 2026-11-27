import "server-only";
import "reflect-metadata";
import { getModelForClass, index, modelOptions, prop } from "@typegoose/typegoose";

@index({ ownerId: 1, createdAt: -1 })
@index({ organizationId: 1, _id: 1 })
@modelOptions({
  options: { customName: "MediaAsset" },
  schemaOptions: { collection: "media_assets", timestamps: true, autoIndex: false, bufferCommands: false },
})
export class MediaAsset {
  // Better Auth IDs are strings; there is no parallel application User model.
  @prop({ type: () => String, required: true })
  public ownerId!: string;

  @prop({ type: () => String })
  public organizationId?: string;

  @prop({ type: () => String, required: true })
  public url!: string;

  @prop({ type: () => String, required: true })
  public pathname!: string;

  @prop({ type: () => String, required: true, enum: ["image/jpeg", "image/png", "image/webp"] })
  public contentType!: string;

  @prop({ type: () => Number, required: true, min: 1, max: 2 * 1024 * 1024 })
  public size!: number;

  public createdAt!: Date;
  public updatedAt!: Date;
}

export function getMediaAssetModel() {
  return getModelForClass(MediaAsset);
}
