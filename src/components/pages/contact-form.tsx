"use client";

import { useRef, useState, type FormEvent } from "react";
import { type ContactForm as Definition, type FormAnswer, type FormAnswers } from "@/lib/dashboard/forms";
import { DashboardRequestError, dashboardRequest, jsonRequest, requestMessage } from "@/lib/dashboard/request";
import { ContactFields } from "./contact-fields";

export type PublishedForm = { slug: string; version: number };

function compatibleAnswers(previous: Definition, next: Definition, answers: FormAnswers) {
  const compatible: FormAnswers = {};
  for (const field of next.fields) {
    if (!previous.fields.some((candidate) => candidate.id === field.id && candidate.kind === field.kind)) continue;
    const value = answers[field.id];
    if (value === undefined) continue;
    if (Array.isArray(value)) compatible[field.id] = value.filter((id) => field.options.some((option) => option.id === id));
    else if (!field.options.length || field.options.some((option) => option.id === value)) compatible[field.id] = value;
  }
  return compatible;
}

export function ContactForm({ initial, published }: { initial: Definition; published: PublishedForm }) {
  const [form, setForm] = useState(initial);
  const [version, setVersion] = useState(published.version);
  const [answers, setAnswers] = useState<FormAnswers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const [complete, setComplete] = useState(false);
  const retry = useRef<{ id: string; fingerprint: string } | null>(null);
  const api = `/api/public/pages/${published.slug}`;

  function update(id: string, value: FormAnswer) {
    setAnswers((current) => ({ ...current, [id]: value }));
    setErrors((current) => ({ ...current, [id]: "" }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || complete) return;
    setSending(true);
    setErrors({});
    setFeedback("");
    const fingerprint = JSON.stringify([version, answers]);
    const attempt = retry.current?.fingerprint === fingerprint ? retry.current : { id: crypto.randomUUID(), fingerprint };
    retry.current = attempt;

    try {
      await dashboardRequest(`${api}/submissions`, jsonRequest("POST", { submissionId: attempt.id, formVersion: version, answers }));
      setComplete(true);
      setAnswers({});
    } catch (error) {
      if (error instanceof DashboardRequestError && error.code === "FORM_VERSION_CHANGED") {
        try {
          const latest = await dashboardRequest<{ form: Definition; version: number }>(`${api}/form`);
          setAnswers(compatibleAnswers(form, latest.form, answers));
          setForm(latest.form);
          setVersion(latest.version);
          retry.current = null;
          setFeedback("The form was updated. Review your answers and send them again.");
        } catch (refreshError) {
          setFeedback(requestMessage(refreshError));
        }
      } else {
        if (error instanceof DashboardRequestError && error.fields) setErrors(error.fields);
        setFeedback(requestMessage(error));
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="contact" className="space-y-4 rounded-[var(--page-radius)] border border-current/20 p-4">
      <h2 className="text-xl font-semibold">{form.title || "Contact"}</h2>
      {form.description && <p className="whitespace-pre-wrap text-sm opacity-80">{form.description}</p>}
      {complete ? <p role="status">{form.success}</p> : (
        <form onSubmit={(event) => void submit(event)} className="space-y-3">
          <fieldset disabled={sending} className="grid gap-3">
            <ContactFields form={form} answers={answers} errors={errors} onChange={update} />
            <button type="submit" className="page-action page-action-accent justify-self-start rounded-[var(--page-radius)] border px-4 py-2.5 text-sm font-medium disabled:opacity-60">
              {sending ? "Sending…" : form.submitLabel}
            </button>
          </fieldset>
          {feedback && <p role="alert" className="text-sm">{feedback}</p>}
        </form>
      )}
    </section>
  );
}
