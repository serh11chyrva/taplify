"use client";

import { useRef, useState, type FormEvent } from "react";
import { MailPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { roleLabels, type OrganizationInvitation, type TeamRole } from "@/lib/dashboard/invitations";
import { organizationApiPath } from "@/lib/dashboard/organizations";
import { dashboardRequest, jsonRequest, requestMessage } from "@/lib/dashboard/request";

const stateLabels = { pending: "Pending", accepted: "Accepted", revoked: "Revoked", expired: "Expired" };
const date = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

export function InvitationSettings({ organizationId, invitations }: {
  organizationId: string; invitations: OrganizationInvitation[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("editor");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; error?: boolean }>();
  const attempt = useRef<{ id: string; address: string; role: TeamRole } | null>(null);
  const endpoint = `${organizationApiPath(organizationId)}/invitations`;

  async function send(address: string, targetRole: TeamRole, newInvitation = false) {
    if (pending) return;
    setPending(true);
    setFeedback(undefined);
    const key = attempt.current && attempt.current.address === address && attempt.current.role === targetRole && !newInvitation
      ? attempt.current : { id: crypto.randomUUID(), address, role: targetRole };
    attempt.current = key;
    try {
      await dashboardRequest(endpoint, jsonRequest("POST", { email: address, role: targetRole, requestId: key.id }));
      setEmail("");
      attempt.current = null;
      setFeedback({ message: "Invitation sent." });
    } catch (problem) {
      setFeedback({ message: requestMessage(problem), error: true });
    } finally {
      setPending(false);
      router.refresh();
    }
  }

  async function revoke(id: string) {
    if (pending) return;
    setPending(true);
    setFeedback(undefined);
    try {
      await dashboardRequest(`${endpoint}/${id}/revoke`, { method: "POST" });
      setFeedback({ message: "Invitation revoked." });
      router.refresh();
    } catch (problem) {
      setFeedback({ message: requestMessage(problem), error: true });
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(email.trim(), role);
  }

  return (
    <section className="space-y-4 rounded-xl border bg-surface p-5">
      <h2 className="font-semibold">Invitations</h2>
      <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
        <label className="grid min-w-0 flex-1 gap-2 text-sm">Email address
          <input value={email} type="email" required maxLength={254} className="dashboard-input" disabled={pending} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm">Role
          <select className="dashboard-input" value={role} disabled={pending} onChange={(event) => setRole(event.target.value as TeamRole)}>
            <option value="editor">Editor</option><option value="operator">Operator</option>
          </select>
        </label>
        <Button type="submit" disabled={pending}><MailPlus size={15} aria-hidden="true" /> Send invitation</Button>
      </form>
      {feedback && <p role={feedback.error ? "alert" : "status"} className={feedback.error ? "text-sm text-danger" : "text-sm text-muted-foreground"}>{feedback.message}</p>}
      {invitations.length ? <ul className="grid divide-y border-t">
        {invitations.map((invitation) => (
          <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
            <div className="min-w-0 break-all">
              <p className="font-medium">{invitation.email}</p>
              <p className="text-muted-foreground">
                {roleLabels[invitation.role]} · {stateLabels[invitation.state]}
                {invitation.state === "pending" && ` · ${invitation.delivery === "failed" ? "Delivery failed" : invitation.delivery === "sent" ? "Sent" : "Sending pending"} · Expires ${date.format(new Date(invitation.expiresAt))}`}
              </p>
            </div>
            {invitation.state === "pending" && <div className="flex gap-1">
              <Button variant="outline" size="sm" type="button" disabled={pending} onClick={() => void send(invitation.email, invitation.role, true)}>Send again</Button>
              <Button variant="ghost" size="sm" type="button" disabled={pending} onClick={() => void revoke(invitation.id)}>Revoke</Button>
            </div>}
          </li>
        ))}
      </ul> : <p className="text-sm text-muted-foreground">No invitations yet.</p>}
    </section>
  );
}
