"use client";

import { useState } from "react";
import { Columns3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { moveItem } from "@/lib/dashboard/draft";
import type { LeadColumn } from "@/lib/dashboard/leads";
import { dashboardRequest, jsonRequest, requestMessage } from "@/lib/dashboard/request";
import { ItemControls } from "./block-inspector";

export function LeadColumnPicker({ api, available, selected, automatic }: {
  api: string; available: LeadColumn[]; selected: string[]; automatic: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(selected);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; error?: boolean }>();
  const lookup = new Map(available.map((column) => [column.key, column.label]));

  async function save(columns: string[] | null) {
    if (pending) return;
    setPending(true);
    setFeedback(undefined);
    try {
      await dashboardRequest(api, jsonRequest("PUT", { columns }));
      setFeedback({ message: columns ? "Columns saved." : "Automatic columns restored." });
      router.refresh();
    } catch (error) {
      setFeedback({ message: requestMessage(error), error: true });
    } finally {
      setPending(false);
    }
  }

  return (
    <details className="relative">
      <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-md border bg-surface px-3 text-sm font-medium hover:bg-muted">
        <Columns3 size={15} aria-hidden="true" /> Columns
      </summary>
      <div className="mt-2 grid w-[min(24rem,calc(100vw-3rem))] gap-3 rounded-xl border bg-surface p-4 shadow-xl sm:absolute sm:right-0 sm:z-10">
        <h2 className="font-medium">Visible columns</h2>
        <ul className="grid max-h-44 gap-1 overflow-y-auto">
          {draft.map((key, index) => (
            <li key={key} className="flex items-center justify-between gap-1 rounded border px-2 text-sm">
              <span className="min-w-0 truncate">{lookup.get(key)}</span>
              <ItemControls index={index} total={draft.length} label={lookup.get(key) ?? "column"}
                onMove={(next) => setDraft(moveItem(draft, index, next))} onRemove={() => setDraft(draft.filter((item) => item !== key))} />
            </li>
          ))}
        </ul>
        <label className="grid gap-2 text-sm">Add column
          <select className="dashboard-input" value="" disabled={pending} onChange={(event) => {
            if (event.target.value) setDraft([...draft, event.target.value]);
          }}>
            <option value="">Select a column</option>
            {available.filter((column) => !draft.includes(column.key)).map((column) => (
              <option key={column.key} value={column.key}>{column.label}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={pending} onClick={() => void save(draft)}>Save columns</Button>
          <Button type="button" size="sm" variant="outline" disabled={pending || automatic} onClick={() => void save(null)}>Reset to automatic</Button>
        </div>
        {feedback && <p role={feedback.error ? "alert" : "status"} className={feedback.error ? "text-sm text-danger" : "text-sm text-muted-foreground"}>{feedback.message}</p>}
      </div>
    </details>
  );
}
