"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { organizationApiPath, organizationPath, type OrganizationSummary } from "@/lib/dashboard/organizations";
import { dashboardRequest, jsonRequest, requestMessage } from "@/lib/dashboard/request";

export function WorkspaceSettings({ organization }: { organization: OrganizationSummary }) {
  const router = useRouter();
  const [pending, setPending] = useState<"rename" | "create">();
  const [feedback, setFeedback] = useState<{ message: string; error?: boolean }>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>, intent: "rename" | "create") {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const name = new FormData(form).get("name");
    setPending(intent);
    setFeedback(undefined);
    try {
      if (intent === "rename") {
        await dashboardRequest(organizationApiPath(organization.id), jsonRequest("PATCH", { name }));
        setFeedback({ message: "Organization name saved." });
        router.refresh();
      } else {
        const created = await dashboardRequest<OrganizationSummary>("/api/organizations", jsonRequest("POST", { name }));
        router.push(organizationPath(created.id));
        router.refresh();
      }
    } catch (error) {
      setFeedback({ message: requestMessage(error), error: true });
    } finally {
      setPending(undefined);
    }
  }

  return (
    <div className="grid max-w-xl gap-5">
      {organization.role === "owner" && (
        <form className="space-y-4 rounded-xl border bg-surface p-5" onSubmit={(event) => void handleSubmit(event, "rename")}>
          <h2 className="font-semibold">General</h2>
          <label className="grid gap-2 text-sm">
            Organization name
            <input className="dashboard-input" name="name" defaultValue={organization.name} maxLength={45} required />
          </label>
          <Button type="submit" disabled={Boolean(pending)}>{pending === "rename" ? "Saving…" : "Save name"}</Button>
        </form>
      )}
      <form className="space-y-4 rounded-xl border bg-surface p-5" onSubmit={(event) => void handleSubmit(event, "create")}>
        <h2 className="font-semibold">New organization</h2>
        <label className="grid gap-2 text-sm">
          Name
          <input className="dashboard-input" name="name" placeholder="Studio North" maxLength={45} required />
        </label>
        <Button variant="outline" type="submit" disabled={Boolean(pending)}>
          {pending === "create" ? "Creating…" : "Create organization"}
        </Button>
      </form>
      {feedback && <p role={feedback.error ? "alert" : "status"} className={feedback.error ? "text-danger" : "text-muted-foreground"}>{feedback.message}</p>}
    </div>
  );
}
