"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { moveItem, socialNetworks, type Block } from "@/lib/dashboard/draft";

const MarkdownInspector = dynamic(() => import("./markdown-inspector"), {
  ssr: false, loading: () => <p role="status" className="text-sm text-muted-foreground">Loading Markdown editor…</p>,
});

export function TextField({ label, value, onChange, maxLength, multiline, type = "text" }: {
  label: string; value: string; onChange: (value: string) => void; maxLength?: number; multiline?: boolean; type?: "text" | "url";
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      {label}
      {multiline
        ? <textarea className="dashboard-input" rows={3} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
        : <input className="dashboard-input" type={type} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />}
    </label>
  );
}

export function ItemControls({ index, total, label, onMove, onRemove }: {
  index: number; total: number; label: string; onMove: (index: number) => void; onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button variant="ghost" size="sm" type="button" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(index - 1)}>
        <ArrowUp size={14} aria-hidden="true" />
      </Button>
      <Button variant="ghost" size="sm" type="button" aria-label={`Move ${label} down`} disabled={index === total - 1} onClick={() => onMove(index + 1)}>
        <ArrowDown size={14} aria-hidden="true" />
      </Button>
      <Button variant="ghost" size="sm" type="button" aria-label={`Remove ${label}`} onClick={onRemove}>
        <Trash2 size={14} aria-hidden="true" />
      </Button>
    </div>
  );
}

export function RepeatableItems<T extends { id: string }>({ label, items, onChange, create, children, limit = 25 }: {
  label: string; items: T[]; onChange: (items: T[]) => void; create: () => T; children: (item: T, update: (value: T) => void) => ReactNode;
  limit?: number;
}) {
  return (
    <div className="grid min-w-0 gap-3">
      {items.map((item, index) => (
        <div key={item.id} className="grid min-w-0 gap-2 rounded-md border p-3">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="text-sm font-medium">{label} {index + 1}</span>
            <ItemControls index={index} total={items.length} label={`${label.toLowerCase()} ${index + 1}`}
              onMove={(next) => onChange(moveItem(items, index, next))} onRemove={() => onChange(items.filter((entry) => entry.id !== item.id))} />
          </div>
          {children(item, (value) => onChange(items.map((entry) => entry.id === item.id ? value : entry)))}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="justify-self-start" disabled={items.length >= limit}
        onClick={() => onChange([...items, create()])}>Add {label.toLowerCase()}</Button>
    </div>
  );
}

export function BlockInspector({ block, onChange }: { block: Block; onChange: (block: Block) => void }) {
  switch (block.type) {
    case "markdown":
      return <MarkdownInspector value={block.text} onChange={(text) => onChange({ ...block, text })} />;
    case "embed":
      return <>
        <TextField label="Title" value={block.title} maxLength={120} onChange={(title) => onChange({ ...block, title })} />
        <TextField label="YouTube or Spotify URL" value={block.url} maxLength={2048} onChange={(url) => onChange({ ...block, url })} />
      </>;
    case "profile":
      return <>
        <TextField label="Display name" value={block.name} maxLength={120} onChange={(name) => onChange({ ...block, name })} />
        <TextField label="Bio" value={block.bio} maxLength={250} multiline onChange={(bio) => onChange({ ...block, bio })} />
      </>;
    case "hero":
      return <>
        <TextField label="Heading" value={block.heading} maxLength={120} onChange={(heading) => onChange({ ...block, heading })} />
        <TextField label="Description" value={block.description} maxLength={2000} multiline onChange={(description) => onChange({ ...block, description })} />
        <TextField label="Button label" value={block.actionLabel} maxLength={100} onChange={(actionLabel) => onChange({ ...block, actionLabel })} />
        <TextField label="Button destination" value={block.actionUrl} maxLength={2048} onChange={(actionUrl) => onChange({ ...block, actionUrl })} />
      </>;
    case "links":
      return <>
        <TextField label="Title" value={block.title} maxLength={120} onChange={(title) => onChange({ ...block, title })} />
        <label className="grid gap-1.5 text-sm">Layout
          <select className="dashboard-input" value={block.layout} onChange={(event) => onChange({ ...block, layout: event.target.value === "grid" ? "grid" : "list" })}>
            <option value="list">List</option><option value="grid">Grid</option>
          </select>
        </label>
        <RepeatableItems label="Link" items={block.items} onChange={(items) => onChange({ ...block, items })} create={() => ({ id: crypto.randomUUID(), label: "", url: "" })}>
          {(item, update) => <>
            <TextField label="Label" value={item.label} maxLength={100} onChange={(label) => update({ ...item, label })} />
            <TextField label="URL" value={item.url} maxLength={2048} onChange={(url) => update({ ...item, url })} />
          </>}
        </RepeatableItems>
      </>;
    case "social":
      return <>
        <TextField label="Title" value={block.title} maxLength={120} onChange={(title) => onChange({ ...block, title })} />
        <RepeatableItems label="Social link" items={block.items} limit={15} onChange={(items) => onChange({ ...block, items })}
          create={() => ({ id: crypto.randomUUID(), network: "Instagram", url: "" })}>
          {(item, update) => <>
            <label className="grid gap-1.5 text-sm">Network
              <select className="dashboard-input" value={item.network}
                onChange={(event) => update({ ...item, network: event.target.value as typeof item.network })}>
                {socialNetworks.map((network) => <option key={network}>{network}</option>)}
              </select>
            </label>
            <TextField label="Profile URL" value={item.url} maxLength={2048} onChange={(url) => update({ ...item, url })} />
          </>}
        </RepeatableItems>
      </>;
  }
}
