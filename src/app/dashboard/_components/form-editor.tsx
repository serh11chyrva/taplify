"use client";

import { createContactField, fieldKinds, fieldLabels, isChoiceField, type ContactField, type ContactForm } from "@/lib/dashboard/forms";
import { RepeatableItems, TextField } from "./block-inspector";

export function FormEditor({ form, onChange }: { form: ContactForm; onChange: (form: ContactForm) => void }) {
  return (
    <>
      <h2 className="font-semibold">Contact form</h2>
      <TextField label="Form title" value={form.title} maxLength={120} onChange={(title) => onChange({ ...form, title })} />
      <TextField label="Description" value={form.description} maxLength={1000} multiline onChange={(description) => onChange({ ...form, description })} />
      <TextField label="Submit button" value={form.submitLabel} maxLength={60} onChange={(submitLabel) => onChange({ ...form, submitLabel })} />
      <TextField label="Success message" value={form.success} maxLength={500} multiline onChange={(success) => onChange({ ...form, success })} />
      <RepeatableItems label="Field" items={form.fields} limit={15} onChange={(fields) => onChange({ ...form, fields })} create={() => createContactField()}>
        {(field, update) => <>
          <TextField label="Field label" value={field.label} maxLength={100} onChange={(label) => update({ ...field, label })} />
          <label className="grid gap-1.5 text-sm">Field type
            <select className="dashboard-input" value={field.kind}
              onChange={(event) => update({ ...field, kind: event.target.value as ContactField["kind"] })}>
              {fieldKinds.map((kind) => <option key={kind} value={kind}>{fieldLabels[kind]}</option>)}
            </select>
          </label>
          <TextField label="Help text" value={field.help} maxLength={240} onChange={(help) => update({ ...field, help })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={field.required} onChange={(event) => update({ ...field, required: event.target.checked })} /> Required
          </label>
          {isChoiceField(field.kind) && (
            <RepeatableItems label="Choice" items={field.options} limit={20} onChange={(options) => update({ ...field, options })}
              create={() => ({ id: crypto.randomUUID(), label: "" })}>
              {(option, replace) => <TextField label="Choice label" value={option.label} maxLength={100} onChange={(label) => replace({ ...option, label })} />}
            </RepeatableItems>
          )}
        </>}
      </RepeatableItems>
    </>
  );
}
