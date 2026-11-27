import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { z } from "zod";
import { isChoiceField, pageForm, type ContactField, type ContactForm, type FormAnswer, type FormAnswers } from "@/lib/dashboard/forms";
import type { LeadAnswer } from "@/lib/dashboard/leads";
import { resourceId } from "@/lib/dashboard/organizations";
import { connectMongoose } from "@/server/db/mongoose";
import { getLeadModel, getReceiptModel } from "@/server/db/models/lead";
import { getPageModel } from "@/server/db/models/page";
import { eventRetentionMs, getPageEventModel } from "@/server/db/models/page-event";
import { getAuthEnv } from "@/server/env";
import { DashboardError, isDuplicateKey, missingResource, validate } from "./errors";
import { dashboardFeatures } from "./features";
import { publishedPage } from "./publication";
import { limitPublicRequest } from "./rate-limit";

const submissionSchema = z.object({
  submissionId: resourceId,
  formVersion: z.number().int().positive(),
  answers: z.record(resourceId, z.union([z.string().max(2000), z.array(resourceId).max(20)])),
  pageViewId: resourceId.optional(),
});
const email = z.email();
const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

function answerFor(field: ContactField, value: FormAnswer | undefined): FormAnswer | null {
  if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return null;
  if (isChoiceField(field.kind)) {
    const multiple = field.kind === "checkboxes";
    if (multiple !== Array.isArray(value)) throw new Error("Choose a listed option.");
    const keys = typeof value === "string" ? [value] : [...new Set(value)];
    const labels = keys.map((key) => field.options.find((option) => option.id === key)?.label);
    if (labels.some((label) => label === undefined)) throw new Error("Choose a listed option.");
    const present = labels.filter((label) => label !== undefined);
    return multiple ? present : present[0];
  }
  if (typeof value !== "string") throw new Error("Enter a value.");
  const text = value.trim();
  if (!text) return null;
  if (text.length > (field.kind === "textarea" ? 2000 : 250)) throw new Error("This answer is too long.");
  if (field.kind === "email" && !email.safeParse(text).success) throw new Error("Enter a valid email address.");
  if (field.kind === "number" && (!decimal.test(text) || !Number.isFinite(Number(text)))) throw new Error("Enter a number.");
  if (field.kind === "phone" && (!/^\+?[\d\s().-]{5,32}$/.test(text) || text.replace(/\D/g, "").length < 5)) {
    throw new Error("Enter a valid phone number.");
  }
  return text;
}

export function submissionAnswers(form: ContactForm, input: FormAnswers) {
  const fields: Record<string, string> = {};
  const answers: LeadAnswer[] = [];
  const known = new Set(form.fields.map((field) => field.id));
  if (Object.keys(input).some((id) => !known.has(id))) {
    throw new DashboardError(422, "INVALID_ANSWERS", "The submission contains an unknown field.");
  }
  for (const field of form.fields) {
    try {
      const value = answerFor(field, input[field.id]);
      if (value === null) {
        if (field.required) fields[field.id] = "This field is required.";
      } else {
        answers.push({ id: field.id, label: field.label, kind: field.kind, value });
      }
    } catch (error) {
      fields[field.id] = error instanceof Error ? error.message : "Check this answer.";
    }
  }
  if (Object.keys(fields).length) throw new DashboardError(422, "INVALID_ANSWERS", "Check the highlighted fields.", fields);
  return answers;
}

export async function liveForm(slug: string) {
  if (!dashboardFeatures().forms) throw missingResource();
  const page = await publishedPage(slug);
  const form = page ? pageForm(page.draft) : undefined;
  if (!page || !form) throw missingResource();
  return { page, form };
}

export async function acceptSubmission(slug: string, request: Request, raw: unknown) {
  const input = validate(submissionSchema, raw);
  const { page, form } = await liveForm(slug);
  await limitPublicRequest(request, "submissions", page.id, 15);
  const receiptKey = { pageId: page.id, submissionId: input.submissionId };
  const normalized = Object.entries(input.answers).sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => [key, Array.isArray(value) ? [...value].sort() : value]);
  const fingerprint = createHmac("sha256", getAuthEnv().BETTER_AUTH_SECRET)
    .update(JSON.stringify([input.formVersion, normalized])).digest("hex");
  const result = { received: true, submissionId: input.submissionId };

  async function receiptExists() {
    const receipt = await getReceiptModel().findOne(receiptKey).lean();
    if (!receipt) return false;
    if (receipt.fingerprint !== fingerprint) {
      throw new DashboardError(409, "SUBMISSION_CONFLICT", "This submission has already been received.");
    }
    return true;
  }

  if (await receiptExists()) return result;
  const changedForm = () => new DashboardError(409, "FORM_VERSION_CHANGED", "The form has changed. Review your answers and try again.");
  if (input.formVersion !== page.formVersion) throw changedForm();
  const answers = submissionAnswers(form, input.answers);
  const submittedAt = new Date();
  const mongoose = await connectMongoose();
  try {
    await mongoose.connection.transaction(async (session) => {
      const locked = await getPageModel().updateOne(
        { _id: page.id, publicationVersion: page.version, publishedAt: { $type: "date" }, archivedAt: null },
        { $inc: { acceptedSubmissions: 1 } },
        { session, timestamps: false },
      );
      if (!locked.matchedCount) throw changedForm();

      await getReceiptModel().create([{ ...receiptKey, fingerprint }], { session });
      await getLeadModel().create([{
        _id: randomUUID(), organizationId: page.organizationId, pageId: page.id, answers,
        formVersion: page.formVersion, status: "new", submittedAt,
      }], { session });
      await getPageEventModel().create([{
        organizationId: page.organizationId, pageId: page.id, type: "submission", eventId: input.submissionId,
        occurredAt: submittedAt, expiresAt: new Date(submittedAt.getTime() + eventRetentionMs),
      }], { session });
    });
    return result;
  } catch (error) {
    if (isDuplicateKey(error) && await receiptExists()) return result;
    throw error;
  }
}
