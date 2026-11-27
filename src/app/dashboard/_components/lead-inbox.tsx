import Link from "next/link";
import { Inbox, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { leadQueryString, leadStatusLabels, leadTitle, type Lead, type LeadFilters } from "@/lib/dashboard/leads";

const date = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export function LeadInbox({ base, filters, items, size, total }: {
  base: string; filters: LeadFilters; items: Lead[]; size: number; total: number;
}) {
  const query = leadQueryString(filters);
  const hasFilters = Boolean(filters.search || filters.status || filters.read || filters.from || filters.to);
  return (
    <section className="space-y-4">
      <header><h1 className="text-3xl font-semibold tracking-tight">Leads</h1><p className="mt-1 text-sm text-muted-foreground">Inquiries from this page.</p></header>
      <form action={base} className="flex flex-wrap items-end gap-2 rounded-xl border bg-surface p-3">
        <label className="grid gap-1 text-xs text-muted-foreground">Search
          <input className="dashboard-input" name="search" placeholder="Search answers…" maxLength={100} defaultValue={filters.search} />
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">Status
          <select className="dashboard-input" name="status" defaultValue={filters.status ?? ""}>
            <option value="">All statuses</option>
            {Object.entries(leadStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">Read state
          <select className="dashboard-input" name="read" defaultValue={filters.read ?? ""}>
            <option value="">All inquiries</option><option value="unread">Unread</option><option value="read">Read</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">From (UTC)<input type="date" className="dashboard-input" name="from" defaultValue={filters.from} /></label>
        <label className="grid gap-1 text-xs text-muted-foreground">To (UTC)<input type="date" className="dashboard-input" name="to" defaultValue={filters.to} /></label>
        <Button type="submit" variant="outline" size="sm"><Search size={15} aria-hidden="true" /> Apply filters</Button>
        {hasFilters && <Button asChild variant="ghost" size="sm"><Link href={base}>Clear filters</Link></Button>}
      </form>
      {items.length ? (
        <div className="overflow-x-auto rounded-xl border bg-surface">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <caption className="sr-only">Page inquiries</caption>
            <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
              <tr><th scope="col" className="p-3">Inquiry</th><th scope="col" className="p-3">Status</th><th scope="col" className="p-3">Read state</th><th scope="col" className="p-3">Submitted (UTC)</th></tr>
            </thead>
            <tbody className="divide-y">
              {items.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/40">
                  <th className="max-w-60 truncate p-3" scope="row"><Link href={`${base}/${lead.id}${query}`} className="hover:underline">{leadTitle(lead)}</Link></th>
                  <td className="p-3">{leadStatusLabels[lead.status]}</td>
                  <td className="p-3">{lead.readAt ? "Read" : "Unread"}</td>
                  <td className="p-3 text-muted-foreground"><time dateTime={lead.submittedAt}>{date.format(new Date(lead.submittedAt))}</time></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between gap-2 border-t p-3 text-sm text-muted-foreground">
            <span>{total} {total === 1 ? "inquiry" : "inquiries"}</span>
            <div className="flex gap-2">
              {filters.page > 1 && <Button asChild variant="outline" size="sm"><Link href={`${base}${leadQueryString(filters, filters.page - 1)}`}>Previous</Link></Button>}
              {filters.page * size < total && <Button asChild variant="outline" size="sm"><Link href={`${base}${leadQueryString(filters, filters.page + 1)}`}>Next</Link></Button>}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid justify-items-center gap-2 rounded-xl border border-dashed bg-surface p-10 text-center">
          <Inbox size={23} aria-hidden="true" className="text-muted-foreground" />
          <h2 className="font-medium">{hasFilters ? "No matching inquiries" : "No inquiries yet"}</h2>
          <p className="text-sm text-muted-foreground">{hasFilters ? "Try changing the filters." : "Submissions from the published contact form will appear here."}</p>
        </div>
      )}
    </section>
  );
}
