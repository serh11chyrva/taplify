"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { organizationPath } from "@/lib/dashboard/organizations";
import { dashboardRequest, requestMessage } from "@/lib/dashboard/request";

export function InvitationAcceptance({ invitationId, verified }: { invitationId: string; verified: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const endpoint = `/api/organization-invitations/${invitationId}`;
      if (verified) {
        const result = await dashboardRequest<{ organizationId: string }>(`${endpoint}/accept`, { method: "POST" });
        window.location.replace(organizationPath(result.organizationId));
        return;
      }
      await dashboardRequest(`${endpoint}/verify-email`, { method: "POST" });
      setSent(true);
    } catch (failure) {
      setError(requestMessage(failure));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button type="button" disabled={pending || sent} onClick={() => void submit()}>
        {pending ? "Please wait…" : verified ? "Accept invitation" : sent ? "Verification email sent" : "Send verification email"}
      </Button>
      {sent && <p className="text-sm text-muted-foreground" role="status">Open the link in your verification email to return here.</p>}
      {error && <p className="text-sm text-danger" role="alert">{error}</p>}
    </div>
  );
}
