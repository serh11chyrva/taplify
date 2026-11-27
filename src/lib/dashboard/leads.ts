import { z } from "zod";
import type { ContactField } from "./forms";

export const leadStatus = z.enum(["new", "in_progress", "closed"]);
export const leadStatusLabels = { new: "New", in_progress: "In Progress", closed: "Closed" } as const;
export type LeadStatus = z.infer<typeof leadStatus>;
export type LeadAnswer = { id: string; label: string; kind: ContactField["kind"]; value: string | string[] };
export type Lead = {
  id: string;
  status: LeadStatus;
  readAt: string | null;
  submittedAt: string;
  formVersion: number;
  answers: LeadAnswer[];
  source: string | null;
};
