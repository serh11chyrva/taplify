"use client";

import type { ContactForm, FormAnswer, FormAnswers } from "@/lib/dashboard/forms";

export function ContactFields({ form, answers = {}, errors = {}, onChange }: {
  form: ContactForm; answers?: FormAnswers; errors?: Record<string, string>; onChange?: (id: string, value: FormAnswer) => void;
}) {
  return form.fields.map((field) => {
    const id = `contact-${field.id}`;
    const value = answers[field.id];
    const text = typeof value === "string" ? value : "";
    const selected = Array.isArray(value) ? value : [];
    const issue = errors[field.id];
    const hint = field.help ? `${id}-hint` : undefined;
    const described = [hint, issue && `${id}-error`].filter(Boolean).join(" ") || undefined;
    const label = field.label || "Untitled field";
    const required = field.required ? <span aria-hidden="true"> *</span> : null;
    const common = { id, name: field.id, required: field.required, "aria-invalid": issue ? true : undefined, "aria-describedby": described };
    let control;
    if (field.kind === "select") {
      control = <select {...common} className="page-form-input" value={text} onChange={(event) => onChange?.(field.id, event.target.value)}>
        <option value="">Select an option</option>
        {field.options.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}
      </select>;
    } else if (field.kind === "textarea") {
      control = <textarea {...common} className="page-form-input" rows={4} value={text} maxLength={2000}
        onChange={(event) => onChange?.(field.id, event.target.value)} />;
    } else {
      const type = ({ email: "email", phone: "tel", number: "number" } as const)[field.kind as "email" | "phone" | "number"] ?? "text";
      control = <input {...common} className="page-form-input" type={type} value={text} step={type === "number" ? "any" : undefined}
        maxLength={250} onChange={(event) => onChange?.(field.id, event.target.value)} />;
    }
    return (
      <div key={field.id} className="grid min-w-0 gap-1.5 text-sm">
        {field.kind === "radio" || field.kind === "checkboxes" ? (
          <fieldset aria-describedby={described} aria-invalid={issue ? true : undefined} className="space-y-1.5">
            <legend className="mb-1 font-medium">{label}{required}</legend>
            {field.options.map((option) => (
              <label key={option.id} className="flex items-center gap-2">
                {field.kind === "radio"
                  ? <input type="radio" name={field.id} value={option.id} required={field.required}
                      checked={text === option.id} onChange={() => onChange?.(field.id, option.id)} />
                  : <input type="checkbox" name={field.id} value={option.id} checked={selected.includes(option.id)}
                      onChange={(event) => onChange?.(field.id, event.target.checked ? [...selected, option.id] : selected.filter((item) => item !== option.id))} />}
                {option.label}
              </label>
            ))}
          </fieldset>
        ) : <>
          <label htmlFor={id} className="font-medium">{label}{required}</label>
          {control}
        </>}
        {hint && <p id={hint} className="text-xs opacity-70">{field.help}</p>}
        {issue && <p id={`${id}-error`} className="text-sm" role="alert">{issue}</p>}
      </div>
    );
  });
}
