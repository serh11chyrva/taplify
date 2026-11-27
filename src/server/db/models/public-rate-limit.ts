import "server-only";
import "reflect-metadata";
import { getModelForClass, index, modelOptions, prop } from "@typegoose/typegoose";

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@modelOptions({
  options: { customName: "PublicRateLimit" },
  schemaOptions: { collection: "public_rate_limits", autoIndex: false, bufferCommands: false },
})
class PublicRateLimit {
  @prop({ type: () => String, required: true })
  public _id!: string;

  @prop({ type: () => Number, required: true })
  public count!: number;

  @prop({ type: () => Date, required: true })
  public expiresAt!: Date;
}

export const getPublicRateLimitModel = () => getModelForClass(PublicRateLimit);
