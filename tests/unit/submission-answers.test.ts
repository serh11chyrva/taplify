import { expect, test } from "vitest";
import { createContactField, type ContactForm } from "@/lib/dashboard/forms";
import { submissionAnswers } from "@/server/dashboard/submissions";

function definition() {
  const email = { ...createContactField("Email", "email"), required: true };
  const choice = { ...createContactField("Interests", "checkboxes"), options: [{ id: crypto.randomUUID(), label: "Design" }] };
  const form: ContactForm = {
    id: crypto.randomUUID(), type: "contact", title: "Contact", description: "",
    submitLabel: "Send", success: "Thank you", fields: [email, choice],
  };
  return { form, email, choice };
}

test("preserves labels and choice values from the published form", () => {
  const { form, email, choice } = definition();
  const answers = submissionAnswers(form, { [email.id]: "visitor@example.test", [choice.id]: [choice.options[0].id, choice.options[0].id] });
  expect(answers).toEqual([
    { id: email.id, label: "Email", kind: "email", value: "visitor@example.test" },
    { id: choice.id, label: "Interests", kind: "checkboxes", value: ["Design"] },
  ]);
});

test("rejects required fields, unknown choices, and fields outside the published definition", () => {
  const { form, email, choice } = definition();
  expect(() => submissionAnswers(form, { [choice.id]: [crypto.randomUUID()] })).toThrow("Check the highlighted fields.");
  expect(() => submissionAnswers(form, { [email.id]: "wrong" })).toThrow("Check the highlighted fields.");
  expect(() => submissionAnswers(form, { [crypto.randomUUID()]: "extra" })).toThrow("unknown field");
});
