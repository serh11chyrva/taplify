"use client";

import { useRef, useState, type FormEvent } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { PageSummary } from "@/lib/dashboard/pages";
import { dashboardRequest, jsonRequest, requestMessage } from "@/lib/dashboard/request";

export function PublishButton({ page, revision, api, disabled }: {
  page: PageSummary; revision: number; api: string; disabled: boolean;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [slug, setSlug] = useState(page.slug ?? page.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<string>();

  function open() {
    setError("");
    dialog.current?.showModal();
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (waiting || disabled) return;
    setWaiting(true);
    setError("");
    try {
      const response = await dashboardRequest<{ url: string }>(`${api}/publish`,
        jsonRequest("POST", { expectedRevision: revision, slug: page.slug ?? slug }));
      setResult(response.url);
      dialog.current?.close();
      router.refresh();
    } catch (problem) {
      setError(requestMessage(problem));
    } finally {
      setWaiting(false);
    }
  }

  return (
    <>
      <Button type="button" onClick={open} disabled={disabled || waiting}>{page.status === "published" ? "Publish changes" : "Publish"}</Button>
      {result && <a href={result} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm underline">
        <Check size={14} aria-hidden="true" /> View public page
      </a>}
      <dialog ref={dialog} aria-label="Publish page" className="dashboard-dialog" onCancel={(event) => { if (waiting) event.preventDefault(); }}>
        <form className="space-y-4" onSubmit={(event) => void publish(event)}>
          <h2 className="text-lg font-semibold">Publish page</h2>
          <p className="text-sm text-muted-foreground">The saved draft becomes the version visitors see.</p>
          {page.slug ? <p className="break-all rounded border p-2 font-mono text-sm">/p/{page.slug}</p> : (
            <label className="grid gap-2 text-sm">Public slug
              <input className="dashboard-input" value={slug} onChange={(event) => setSlug(event.target.value)} required
                maxLength={64} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" disabled={waiting} />
              <span className="text-muted-foreground">Your slug is permanent after the first publication.</span>
            </label>
          )}
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={waiting} onClick={() => dialog.current?.close()}>Cancel</Button>
            <Button type="submit" disabled={waiting}>{waiting ? "Publishing…" : "Publish saved draft"}</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function PublicationSettings({ page, url, api }: { page: PageSummary; url: string | null; api: string }) {
  const router = useRouter();
  const linkInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; error?: boolean }>();

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setFeedback({ message: "Public URL copied." });
    } catch {
      linkInput.current?.focus();
      linkInput.current?.select();
      setFeedback({ message: "The URL is selected. Use your clipboard shortcut to copy it." });
    }
  }

  async function unpublish() {
    if (pending || !window.confirm("Take this page offline?")) return;
    setPending(true);
    setFeedback(undefined);
    try {
      await dashboardRequest(`${api}/unpublish`, { method: "POST" });
      setFeedback({ message: "The page is now offline." });
      router.refresh();
    } catch (error) {
      setFeedback({ message: requestMessage(error), error: true });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid max-w-2xl gap-4 rounded-xl border bg-surface p-5">
      <h2 className="font-semibold">Public URL</h2>
      {url ? <>
        <input ref={linkInput} className="dashboard-input w-full" aria-label="Public URL" value={url} readOnly />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void copyLink()}><Copy size={15} aria-hidden="true" /> Copy link</Button>
          {page.status === "published" && <Button asChild variant="outline"><a href={url} target="_blank" rel="noreferrer">
            Open public page <ExternalLink size={15} aria-hidden="true" />
          </a></Button>}
        </div>
      </> : <p className="text-sm text-muted-foreground">Your link will be available after the first publication.</p>}
      {page.status === "published" && <Button type="button" variant="outline" className="justify-self-start text-danger"
        disabled={pending} onClick={() => void unpublish()}>{pending ? "Unpublishing…" : "Unpublish"}</Button>}
      {feedback && <p role={feedback.error ? "alert" : "status"} className={feedback.error ? "text-sm text-danger" : "text-sm text-muted-foreground"}>{feedback.message}</p>}
    </div>
  );
}
