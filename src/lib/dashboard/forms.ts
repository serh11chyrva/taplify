import { z } from "zod";
import { resourceId } from "./organizations";
import type { PageDraft } from "./draft";

export const fieldKinds = ["text", "textarea", "email", "phone", "number", "select", "radio", "checkboxes"] as const;
export const fieldLabels: Record<typeof fieldKinds[number], string> = {
  text: "Short text", textarea: "Long text", email: "Email", phone: "Phone",
  number: "Number", select: "Dropdown", radio: "Single choice", checkboxes: "Multiple choices",
};

const optionSchema = z.object({ id: resourceId, label: z.string().max(100) });
const fieldSchema = z.object({
  id: resourceId, kind: z.enum(fieldKinds), label: z.string().max(100), help: z.string().max(240),
  required: z.boolean(), options: z.array(optionSchema).max(20),
}).refine((field) => new Set(field.options.map((option) => option.id)).size === field.options.length, "Each option must have its own ID.");

export const contactFormSchema = z.object({
  id: resourceId, type: z.literal("contact"), title: z.string().max(120), description: z.string().max(1000),
  submitLabel: z.string().max(60), success: z.string().max(500),
  fields: z.array(fieldSchema).max(15),
}).refine((form) => new Set(form.fields.map((field) => field.id)).size === form.fields.length, "Each field must have its own ID.");

export type ContactForm = z.infer<typeof contactFormSchema>;
export type ContactField = z.infer<typeof fieldSchema>;
export type FormAnswer = string | string[];
export type FormAnswers = Record<string, FormAnswer>;

export function isChoiceField(kind: ContactField["kind"]) {
  return kind === "select" || kind === "radio" || kind === "checkboxes";
}

export function createContactField(label = "", kind: ContactField["kind"] = "text"): ContactField {
  return { id: crypto.randomUUID(), kind, label, help: "", required: false, options: [] };
}

export function pageForm(draft: PageDraft) {
  return draft.blocks.find((block) => block.type === "contact");
}

export function formProblem(form: ContactForm) {
  if (!form.fields.length || !form.submitLabel.trim() || !form.success.trim()) {
    return "Add at least one field, a submit label, and a success message.";
  }
  for (const field of form.fields) {
    if (!field.label.trim()) return "Label every field in the contact form.";
    if (isChoiceField(field.kind)) {
      if (!field.options.length || field.options.some((option) => !option.label.trim())) return "Label every choice in the contact form.";
      const names = field.options.map((option) => option.label.trim().toLowerCase());
      if (new Set(names).size !== names.length) return "Use different labels for the choices within each field.";
    }
  }
  return null;
}
