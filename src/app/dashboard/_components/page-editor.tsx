"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, GripVertical, Monitor, Plus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageRenderer } from "@/components/pages/page-renderer";
import { blockNames, createBlock, moveItem, type Block, type PageDraft } from "@/lib/dashboard/draft";
import { pageApiPath, pagePath, type PageSummary } from "@/lib/dashboard/pages";
import { organizationMediaPath } from "@/lib/dashboard/media";
import { pageForm } from "@/lib/dashboard/forms";
import { DashboardRequestError, dashboardRequest, jsonRequest, requestMessage } from "@/lib/dashboard/request";
import { BlockInspector, ItemControls, TextField } from "./block-inspector";
import { AppearanceEditor } from "./appearance-editor";
import { PublishButton } from "./publication-actions";
import { FormEditor } from "./form-editor";

export function PageEditor({ organizationId, page, draft: initial, revision: initialRevision, formsEnabled, canPublish }: {
  organizationId: string; page: PageSummary; draft: PageDraft; revision: number; formsEnabled: boolean; canPublish: boolean;
}) {
  const router = useRouter();
  const pageId = page.id;
  const [draft, setDraft] = useState(initial);
  const [revision, setRevision] = useState(initialRevision);
  const [selected, setSelected] = useState(initial.blocks[0]?.id);
  const [blockType, setBlockType] = useState<Block["type"]>("links");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; error?: boolean }>();
  const [conflict, setConflict] = useState(false);
  const [tab, setTab] = useState<"blocks" | "appearance" | "form">("blocks");
  const [mobilePreview, setMobilePreview] = useState(false);
  const api = pageApiPath(organizationId, pageId);
  const active = draft.blocks.find((block) => block.id === selected) ?? draft.blocks[0];
  const form = pageForm(draft);

  useEffect(() => {
    if (!dirty) return;
    const warnOnUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const warnOnLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (link && link.target !== "_blank" && link.origin === window.location.origin && link.href !== window.location.href
          && !window.confirm("Leave the editor with unsaved changes?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warnOnUnload);
    document.addEventListener("click", warnOnLink, true);
    return () => {
      window.removeEventListener("beforeunload", warnOnUnload);
      document.removeEventListener("click", warnOnLink, true);
    };
  }, [dirty]);

  function change(next: PageDraft) {
    setDraft(next);
    setDirty(true);
    setFeedback(undefined);
  }

  function replaceBlock(next: Block) {
    change({ ...draft, blocks: draft.blocks.map((block) => block.id === next.id ? next : block) });
  }

  function addBlock(type: Block["type"]) {
    if (draft.blocks.length >= 30 || (type === "contact" && (!formsEnabled || form))) return;
    const block = createBlock(type);
    change({ ...draft, blocks: [...draft.blocks, block] });
    setSelected(block.id);
    if (type === "contact") setTab("form");
  }

  async function save() {
    if (saving || uploading || !dirty) return;
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
    if (saving || uploading || !window.confirm("Discard your unsaved changes and load the latest draft?")) return;
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
          {dirty || saving || uploading ? <Button type="button" variant="outline" disabled><Eye size={16} aria-hidden="true" /> Preview</Button> :
            <Button asChild variant="outline"><Link href={`${pagePath(organizationId, pageId)}/preview`}><Eye size={16} aria-hidden="true" /> Preview</Link></Button>}
          {conflict && <Button type="button" variant="outline" disabled={saving || uploading} onClick={() => void reload()}>Load latest draft</Button>}
          <Button type="button" disabled={!dirty || saving || uploading} onClick={() => void save()}>{saving ? "Saving…" : "Save draft"}</Button>
          {canPublish && <PublishButton page={page} revision={revision} api={api} disabled={dirty || saving || uploading || conflict} />}
        </div>
      </div>
      {feedback && <p role={feedback.error ? "alert" : "status"} className={feedback.error ? "text-sm text-danger" : "text-sm text-muted-foreground"}>{feedback.message}</p>}
      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(21rem,1fr)_minmax(20rem,1fr)]">
        <div className="grid min-w-0 gap-3">
          <div className="flex gap-1 rounded-lg border bg-surface p-1" role="group" aria-label="Editor section">
            <Button type="button" variant="ghost" size="sm" className="aria-pressed:bg-muted" disabled={uploading} aria-pressed={tab === "blocks"} onClick={() => setTab("blocks")}>Blocks</Button>
            <Button type="button" variant="ghost" size="sm" className="aria-pressed:bg-muted" disabled={uploading} aria-pressed={tab === "appearance"} onClick={() => setTab("appearance")}>Appearance</Button>
            {formsEnabled && <Button type="button" variant="ghost" size="sm" className="aria-pressed:bg-muted" disabled={uploading}
              aria-pressed={tab === "form"} onClick={() => setTab("form")}>Form</Button>}
          </div>
          {tab === "appearance" ? (
            <fieldset className="grid min-w-0 gap-4 rounded-xl border bg-surface p-4" disabled={saving}>
              <AppearanceEditor appearance={draft.appearance} onChange={(appearance) => change({ ...draft, appearance })} />
            </fieldset>
          ) : tab === "form" ? (
            <fieldset className="grid min-w-0 gap-4 rounded-xl border bg-surface p-4" disabled={saving || uploading}>
              {form ? <FormEditor form={form} onChange={replaceBlock} /> : (
                <Button type="button" variant="outline" className="justify-self-start" disabled={draft.blocks.length >= 30}
                  onClick={() => addBlock("contact")}>Add contact form</Button>
              )}
            </fieldset>
          ) : (
          <fieldset className="grid min-w-0 gap-4 rounded-xl border bg-surface p-4" disabled={saving || uploading}>
          <TextField label="Page name" value={draft.name} maxLength={45} onChange={(name) => change({ ...draft, name })} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Blocks</h2>
            <div className="flex flex-wrap gap-1">
              <select className="dashboard-input" aria-label="Block type" value={blockType}
                onChange={(event) => setBlockType(event.target.value as Block["type"])}>
                {Object.entries(blockNames).filter(([type]) => type !== "contact" || formsEnabled).map(([type, label]) =>
                  <option key={type} value={type} disabled={type === "contact" && Boolean(form)}>{label}</option>)}
              </select>
              <Button type="button" variant="outline" size="sm"
                disabled={draft.blocks.length >= 30 || (blockType === "contact" && Boolean(form))}
                onClick={() => addBlock(blockType)}><Plus size={15} aria-hidden="true" /> Add block</Button>
            </div>
          </div>
          <ul className="grid gap-1.5">
            {draft.blocks.map((block, index) => (
              <li key={block.id} className="flex min-w-0 flex-wrap items-center justify-between gap-1 rounded-lg border bg-background p-1"
                onDragOver={(event) => { if (event.dataTransfer.types.includes("application/x-taplify-block")) event.preventDefault(); }}
                onDrop={(event) => {
                  const from = draft.blocks.findIndex((item) => item.id === event.dataTransfer.getData("application/x-taplify-block"));
                  if (from < 0 || saving || uploading) return;
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
            {active.type === "contact" ? (formsEnabled && <Button type="button" variant="outline" className="justify-self-start"
              onClick={() => setTab("form")}>Edit form fields</Button>) :
              <BlockInspector key={`${active.id}:${revision}`} block={active} onChange={replaceBlock}
                organizationId={organizationId} onBusy={setUploading} />}
          </div>}
          </fieldset>
          )}
        </div>
        <aside className="grid min-w-0 gap-3 rounded-xl border bg-surface p-3 xl:sticky xl:top-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="px-1 text-sm font-medium">Live preview</h2>
            <div className="flex gap-1" role="group" aria-label="Preview size">
              <Button type="button" variant="ghost" size="sm" className="aria-pressed:bg-muted" aria-label="Desktop preview" aria-pressed={!mobilePreview} onClick={() => setMobilePreview(false)}><Monitor size={16} /></Button>
              <Button type="button" variant="ghost" size="sm" className="aria-pressed:bg-muted" aria-label="Mobile preview" aria-pressed={mobilePreview} onClick={() => setMobilePreview(true)}><Smartphone size={16} /></Button>
            </div>
          </div>
          <div className={mobilePreview ? "mx-auto w-full max-w-[22rem]" : "w-full"}><PageRenderer draft={draft} preview mediaBase={organizationMediaPath(organizationId)} /></div>
        </aside>
      </div>
    </section>
  );
}
