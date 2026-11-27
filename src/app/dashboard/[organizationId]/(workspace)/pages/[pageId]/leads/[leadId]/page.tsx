import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LeadActions } from "@/app/dashboard/_components/lead-actions";
import { leadFilters, leadQueryString, leadTitle } from "@/lib/dashboard/leads";
import { pageApiPath, pagePath, type DashboardSearch } from "@/lib/dashboard/pages";
import { readLead } from "@/server/dashboard/leads";
import { dashboardRead, workspace } from "@/server/dashboard/read";

export default async function LeadPage({ params, searchParams }: {
  params: Promise<{ organizationId: string; pageId: string; leadId: string }>; searchParams: Promise<DashboardSearch>;
}) {
  const { organizationId, pageId, leadId } = await params;
  const { user, organization } = await workspace(organizationId, "leads:manage");
  const lead = await dashboardRead(() => readLead(user.id, organizationId, pageId, leadId));
  const back = `${pagePath(organizationId, pageId)}/leads${leadQueryString(leadFilters(await searchParams))}`;
  const date = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
  return (
    <article className="grid gap-5">
      <Link href={back} className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:underline"><ArrowLeft size={15} /> Back to leads</Link>
      <h1 className="break-all text-3xl font-semibold tracking-tight">{leadTitle(lead)}</h1>
      <LeadActions key={lead.id} lead={lead} endpoint={`${pageApiPath(organizationId, pageId)}/leads/${leadId}`} back={back} canDelete={organization.role === "owner"} />
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(12rem,1fr)]">
        <section className="space-y-4 rounded-xl border bg-surface p-5">
          <h2 className="font-semibold">Answers</h2>
          {lead.answers.length ? (
            <dl className="grid gap-3">
              {lead.answers.map((answer) => (
                <div key={answer.id} className="break-words border-t pt-3">
                  <dt className="text-sm text-muted-foreground">{answer.label}</dt>
                  <dd className="whitespace-pre-wrap">{Array.isArray(answer.value) ? answer.value.join(", ") : answer.value}</dd>
                </div>
              ))}
            </dl>
          ) : <p className="text-sm text-muted-foreground">The visitor left the optional fields blank.</p>}
        </section>
        <section className="space-y-3 rounded-xl border bg-surface p-5">
          <h2 className="font-semibold">Submission details</h2>
          <dl className="grid gap-3 text-sm">
            <div><dt className="text-muted-foreground">Submitted (UTC)</dt><dd><time dateTime={lead.submittedAt}>{date.format(new Date(lead.submittedAt))}</time></dd></div>
            <div><dt className="text-muted-foreground">Source</dt><dd>{lead.source ?? "Unattributed"}</dd></div>
            <div><dt className="text-muted-foreground">Form version</dt><dd>{lead.formVersion}</dd></div>
          </dl>
        </section>
      </div>
    </article>
  );
}
