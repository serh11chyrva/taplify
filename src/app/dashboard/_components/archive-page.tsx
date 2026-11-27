"use client";

import { useRef, useState, type FormEvent } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { PageSummary } from "@/lib/dashboard/pages";
import { dashboardRequest, jsonRequest, requestMessage } from "@/lib/dashboard/request";

export function ArchivePage({ page, api }: { page: PageSummary; api: string }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [entered, setEntered] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const archived = page.status === "archived";

  async function update() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await dashboardRequest(`${api}/${archived ? "restore" : "archive"}`,
        jsonRequest("POST", archived ? {} : { confirmation: entered }));
      dialog.current?.close();
      router.refresh();
    } catch (problem) {
      setError(requestMessage(problem));
    } finally {
      setPending(false);
    }
  }

  function archive(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (entered === page.name) void update();
  }

  return (
    <div className="grid max-w-2xl gap-3 rounded-xl border bg-surface p-5">
      <h2 className="font-semibold">{archived ? "Archived page" : "Archive page"}</h2>
      <p className="text-sm text-muted-foreground">{archived
        ? "Restore this page to edit and publish it again."
        : "Take the page offline and move it to the archive. Its link and history are kept."}</p>
      {archived ? (
        <Button type="button" className="justify-self-start" variant="outline" disabled={pending} onClick={() => void update()}>
          <ArchiveRestore size={16} aria-hidden="true" /> Restore draft
        </Button>
      ) : (
        <Button type="button" className="justify-self-start" variant="outline" disabled={pending} onClick={() => {
          setEntered("");
          setError("");
          dialog.current?.showModal();
        }}><Archive size={16} aria-hidden="true" /> Archive page</Button>
      )}
      {archived && error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <dialog ref={dialog} className="dashboard-dialog" aria-label="Confirm archive" onCancel={(event) => { if (pending) event.preventDefault(); }}>
        <form className="space-y-4" onSubmit={archive}>
          <h2 className="text-lg font-semibold">Archive {page.name}?</h2>
          <label className="grid gap-2 text-sm">Type the page name to confirm
            <input className="dashboard-input" value={entered} maxLength={45} disabled={pending} onChange={(event) => setEntered(event.target.value)} />
          </label>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={pending} onClick={() => dialog.current?.close()}>Cancel</Button>
            <Button type="submit" disabled={pending || entered !== page.name}>{pending ? "Archiving…" : "Confirm archive"}</Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
