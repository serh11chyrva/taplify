import type { ContactForm } from "@/lib/dashboard/forms";
import { ContactFields } from "./contact-fields";

export function ContactPreview({ form }: { form: ContactForm }) {
  return (
    <section id="contact" className="space-y-4 rounded-[var(--page-radius)] border border-current/20 p-4">
      <h2 className="text-xl font-semibold">{form.title || "Contact"}</h2>
      {form.description && <p className="whitespace-pre-wrap text-sm opacity-80">{form.description}</p>}
      <fieldset disabled className="grid gap-3">
        <ContactFields form={form} />
        <button type="button" className="page-action-border page-action-accent justify-self-start rounded-[var(--page-radius)] border px-4 py-2.5 text-sm">
          {form.submitLabel || "Send message"}
        </button>
      </fieldset>
    </section>
  );
}
