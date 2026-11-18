import "server-only";
import { getMediaAssetModel } from "@/server/db/models/media-asset";

export function getHealth() {
  // Exercise legacy decorators in the built Node runtime without a DB connection.
  getMediaAssetModel();
  return { status: "ok", service: "taplify" } as const;
}
