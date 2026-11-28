"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { roleLabels, type OrganizationMember, type TeamRole } from "@/lib/dashboard/invitations";
import { organizationApiPath } from "@/lib/dashboard/organizations";
import { dashboardRequest, jsonRequest, requestMessage } from "@/lib/dashboard/request";

export function MemberSettings({ organizationId, members }: { organizationId: string; members: OrganizationMember[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string>();
  const [feedback, setFeedback] = useState<{ message: string; error?: boolean }>();

  async function update(member: OrganizationMember, role?: TeamRole) {
    if (pending || (!role && !window.confirm(`Remove access for ${member.name}?`))) return;
    setPending(member.id);
    setFeedback(undefined);
    try {
      const url = `${organizationApiPath(organizationId)}/members/${encodeURIComponent(member.id)}`;
      await dashboardRequest(url, role ? jsonRequest("PATCH", { role }) : { method: "DELETE" });
      setFeedback({ message: role ? "Role updated." : "Access removed." });
      router.refresh();
    } catch (error) {
      setFeedback({ message: requestMessage(error), error: true });
    } finally {
      setPending(undefined);
    }
  }

  return (
    <section className="grid gap-3 rounded-xl border bg-surface p-5">
      <h2 className="font-semibold">Members</h2>
      <ul className="grid divide-y border-t">
        {members.map((member) => (
          <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
            <div className="min-w-0 break-all">
              <p className="font-medium">{member.name}</p><p className="text-muted-foreground">{member.email}</p>
            </div>
            {member.role === "owner" ? <span>{roleLabels.owner}</span> : (
              <div className="flex items-center gap-2">
                <select className="dashboard-input" value={member.role} aria-label={`Role for ${member.name}`} disabled={Boolean(pending)}
                  onChange={(event) => void update(member, event.target.value as TeamRole)}>
                  <option value="editor">Editor</option><option value="operator">Operator</option>
                </select>
                <Button type="button" variant="ghost" size="sm" className="text-danger" disabled={Boolean(pending)}
                  onClick={() => void update(member)}>Remove</Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {feedback && <p role={feedback.error ? "alert" : "status"} className={feedback.error ? "text-sm text-danger" : "text-sm text-muted-foreground"}>{feedback.message}</p>}
    </section>
  );
}
