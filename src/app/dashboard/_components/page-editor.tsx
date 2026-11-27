"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageRenderer } from "@/components/pages/page-renderer";
import { blockNames, createBlock, moveItem, type Block, type PageDraft } from "@/lib/dashboard/draft";
import { pageApiPath } from "@/lib/dashboard/pages";
import { DashboardRequestError, dashboardRequest, jsonRequest, requestMessage } from "@/lib/dashboard/request";
import { BlockInspector, ItemControls, TextField } from "./block-inspector";

export function PageEditor({ organizationId, pageId, draft: initial, revision: initialRevision }: {
  organizationId: string; pageId: string; draft: PageDraft; revision: number;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [revision, setRevision] = useState(initialRevision);
  const [selected, setSelected] = useState(initial.blocks[0]?.id);
  const [blockType, setBlockType] = useState<Block["type"]>("links");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; error?: boolean }>();
  const [conflict, setConflict] = useState(false);
  const api = pageApiPath(organizationId, pageId);
  const active = draft.blocks.find((block) => block.id === selected) ?? draft.blocks[0];

  function change(next: PageDraft) {
    setDraft(next);
    setDirty(true);
    setFeedback(undefined);
  }

  function replaceBlock(next: Block) {
    change({ ...draft, blocks: draft.blocks.map((block) => block.id === next.id ? next : block) });
  }

  async function save() {
    if (saving || !dirty) return;
    setSaving(true);
    setFeedback(undefined);
    try {
      const saved = await dashboardRequest<{ draft: PageDraft; revision: number }>(`${api}/draft`,
        jsonRequest("PUT", { expectedRevision: revision, draft }));
      setDraft(saved.draft);
      setRevision(saved.revision);
      setDirty(false);
      setConflict(false);
      setFeedback({ message: "Draft saved." });
      router.refresh();
    } catch (error) {
      setConflict(error instanceof DashboardRequestError && error.code === "REVISION_CONFLICT");
      setFeedback({ message: requestMessage(error), error: true });
    } finally {
      setSaving(false);
    }
  }

  async function reload() {
    if (saving || !window.confirm("Discard your unsaved changes and load the latest draft?")) return;
    setSaving(true);
    try {
      const latest = await dashboardRequest<{ draft: PageDraft; revision: number }>(api);
      setDraft(latest.draft);
      setRevision(latest.revision);
      setDirty(false);
      setConflict(false);
      setFeedback({ message: "Latest draft loaded." });
      router.refresh();
    } catch (error) {
      setFeedback({ message: requestMessage(error), error: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-3xl font-semibold tracking-tight">Editor</h1><p className="mt-1 text-sm text-muted-foreground">{draft.name}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          {conflict && <Button type="button" variant="outline" disabled={saving} onClick={() => void reload()}>Load latest draft</Button>}
          <Button type="button" disabled={!dirty || saving} onClick={() => void save()}>{saving ? "Saving…" : "Save draft"}</Button>
        </div>
      </div>
      {feedback && <p role={feedback.error ? "alert" : "status"} className={feedback.error ? "text-sm text-danger" : "text-sm text-muted-foreground"}>{feedback.message}</p>}
      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(21rem,1fr)_minmax(20rem,1fr)]">
        <fieldset className="grid min-w-0 gap-4 rounded-xl border bg-surface p-4" disabled={saving}>
          <TextField label="Page name" value={draft.name} maxLength={45} onChange={(name) => change({ ...draft, name })} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Blocks</h2>
            <div className="flex flex-wrap gap-1">
              <select className="dashboard-input" aria-label="Block type" value={blockType}
                onChange={(event) => setBlockType(event.target.value as Block["type"])}>
                {Object.entries(blockNames).map(([type, label]) => <option key={type} value={type}>{label}</option>)}
              </select>
              <Button type="button" variant="outline" size="sm" disabled={draft.blocks.length >= 30} onClick={() => {
                const block = createBlock(blockType);
                change({ ...draft, blocks: [...draft.blocks, block] });
                setSelected(block.id);
              }}><Plus size={15} aria-hidden="true" /> Add block</Button>
            </div>
          </div>
          <ul className="grid gap-1.5">
            {draft.blocks.map((block, index) => (
              <li key={block.id} className="flex min-w-0 flex-wrap items-center justify-between gap-1 rounded-lg border bg-background p-1"
                onDragOver={(event) => { if (event.dataTransfer.types.includes("application/x-taplify-block")) event.preventDefault(); }}
                onDrop={(event) => {
                  const from = draft.blocks.findIndex((item) => item.id === event.dataTransfer.getData("application/x-taplify-block"));
                  if (from < 0 || saving) return;
                  event.preventDefault();
                  change({ ...draft, blocks: moveItem(draft.blocks, from, index) });
                }}>
                <button type="button" className="flex items-center gap-2 rounded px-2 py-1.5 text-sm aria-pressed:bg-muted"
                  aria-pressed={active?.id === block.id} onClick={() => setSelected(block.id)}>
                  <span draggable={!saving} className="cursor-grab" title="Drag to reorder"
                    onDragStart={(event) => event.dataTransfer.setData("application/x-taplify-block", block.id)}>
                    <GripVertical size={15} aria-hidden="true" />
                  </span>
                  {blockNames[block.type]}
                </button>
                <ItemControls index={index} total={draft.blocks.length} label={`${blockNames[block.type]} block ${index + 1}`}
                  onMove={(next) => change({ ...draft, blocks: moveItem(draft.blocks, index, next) })}
                  onRemove={() => change({ ...draft, blocks: draft.blocks.filter((item) => item.id !== block.id) })} />
              </li>
            ))}
          </ul>
          {active && <div className="grid min-w-0 gap-3 border-t pt-4">
            <h3 className="font-semibold">{blockNames[active.type]}</h3>
            <BlockInspector key={active.id} block={active} onChange={replaceBlock} />
          </div>}
        </fieldset>
        <aside className="grid min-w-0 gap-3 rounded-xl border bg-surface p-3 xl:sticky xl:top-4">
          <h2 className="px-1 text-sm font-medium">Live preview</h2>
          <PageRenderer draft={draft} preview />
        </aside>
      </div>
    </section>
  );
}
