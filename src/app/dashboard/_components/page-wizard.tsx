"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Building2, Layers, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { organizationApiPath } from "@/lib/dashboard/organizations";
import { pagePath, type PageSummary, type PageType } from "@/lib/dashboard/pages";
import { dashboardRequest, jsonRequest, requestMessage } from "@/lib/dashboard/request";

const templates = [
  { type: "Personal", icon: UserRound, description: "A profile and links for your work." },
  { type: "Company", icon: Building2, description: "Introduce your business or studio." },
  { type: "Product", icon: Layers, description: "Give a product or launch its own page." },
] as const;

export function PageWizard({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<PageType>("Personal");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [requestId, setRequestId] = useState<string>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    const id = requestId ?? crypto.randomUUID();
    if (!requestId) setRequestId(id);
    try {
      const page = await dashboardRequest<PageSummary>(`${organizationApiPath(organizationId)}/pages`,
        jsonRequest("POST", { name, type, bio, requestId: id }));
      router.replace(`${pagePath(organizationId, page.id)}/editor`);
      router.refresh();
    } catch (problem) {
      setError(requestMessage(problem));
      setPending(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl">
      <p className="text-sm text-muted-foreground">Step {step} of 2</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{step === 1 ? "Choose a template" : "Name your page"}</h1>
      <div className="mt-7 space-y-5 rounded-xl border bg-surface p-5">
        {step === 1 ? (
          <>
            <fieldset className="grid gap-2">
              <legend className="sr-only">Page type</legend>
              {templates.map(({ type: candidate, icon: Icon, description }) => (
                <label key={candidate} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-checked:border-primary has-checked:bg-muted">
                  <input type="radio" name="template" checked={candidate === type} onChange={() => setType(candidate)} />
                  <Icon size={19} aria-hidden="true" />
                  <span><strong className="block text-sm">{candidate}</strong><small className="text-muted-foreground">{description}</small></span>
                </label>
              ))}
            </fieldset>
            <Button type="button" onClick={() => setStep(2)}>Continue <ArrowRight size={16} aria-hidden="true" /></Button>
          </>
        ) : (
          <form className="space-y-4" onSubmit={(event) => void create(event)}>
            <label className="grid gap-2 text-sm">Page name<input className="dashboard-input" required maxLength={45} value={name}
              onChange={(event) => setName(event.target.value)} disabled={pending} /></label>
            <label className="grid gap-2 text-sm">Bio <span className="sr-only">(optional)</span><textarea className="dashboard-input" rows={3}
              maxLength={250} value={bio} onChange={(event) => setBio(event.target.value)} disabled={pending} /></label>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={pending} onClick={() => setStep(1)}><ArrowLeft size={16} aria-hidden="true" /> Back</Button>
              <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create draft"}</Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
