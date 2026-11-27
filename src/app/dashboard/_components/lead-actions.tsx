"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { leadStatusLabels, type Lead, type LeadStatus } from "@/lib/dashboard/leads";
import { dashboardRequest, jsonRequest, requestMessage } from "@/lib/dashboard/request";

export function LeadActions({ lead, endpoint, back, canDelete }: { lead: Lead; endpoint: string; back: string; canDelete: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [markedRead, setMarkedRead] = useState(Boolean(lead.readAt));

  useEffect(() => {
    if (lead.readAt) return;
    let active = true;
    void dashboardRequest(endpoint, jsonRequest("PATCH", { read: true })).then(() => {
      if (active) setMarkedRead(true);
    }).catch((problem: unknown) => {
      if (active) setError(requestMessage(problem));
    });
    return () => { active = false; };
  }, [endpoint, lead.readAt]);

  async function update(intent: { status: LeadStatus } | { read: false } | { remove: true }) {
    if (pending) return;
    if ("remove" in intent && !window.confirm("Delete this inquiry?")) return;
    setPending(true);
    setError("");
    try {
      if ("remove" in intent) await dashboardRequest(endpoint, { method: "DELETE" });
      else await dashboardRequest(endpoint, jsonRequest("PATCH", intent));
      if ("read" in intent || "remove" in intent) window.location.replace(back);
      else router.refresh();
    } catch (failure) {
      setError(requestMessage(failure));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">Status
          <select className="dashboard-input" disabled={pending} value={lead.status}
            onChange={(event) => void update({ status: event.target.value as LeadStatus })}>
            {Object.entries(leadStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {markedRead && <Button type="button" variant="outline" disabled={pending} onClick={() => void update({ read: false })}>Mark unread</Button>}
        {canDelete && <Button type="button" variant="outline" className="text-danger" disabled={pending} onClick={() => void update({ remove: true })}>Delete inquiry</Button>}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
