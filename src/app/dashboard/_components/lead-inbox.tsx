import Link from "next/link";
import { Download, Inbox, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { leadColumnValue, leadQueryString, leadStatusLabels, leadTitle, type Lead, type LeadColumn, type LeadFilters } from "@/lib/dashboard/leads";
import { LeadColumnPicker } from "./lead-column-picker";

const date = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export function LeadInbox({ base, api, canExport, columns, filters, items, size, total }: {
  base: string; api: string; canExport: boolean; columns: { available: LeadColumn[]; selected: string[]; automatic: boolean };
  filters: LeadFilters; items: Lead[]; size: number; total: number;
}) {
  const query = leadQueryString(filters);
  const selected = columns.selected.flatMap((key) => columns.available.filter((column) => column.key === key));
  const hasFilters = Boolean(filters.search || filters.status || filters.read || filters.from || filters.to);
  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-3xl font-semibold tracking-tight">Leads</h1><p className="mt-1 text-sm text-muted-foreground">Inquiries from this page.</p></div>
        <div className="flex flex-wrap gap-2">
          <LeadColumnPicker key={`${columns.automatic}:${columns.selected.join(",")}`} api={`${api}/lead-columns`} {...columns} />
          {canExport && <Button asChild variant="outline" size="sm"><a href={`${api}/leads/export${query}`}>
            <Download size={15} aria-hidden="true" /> Export CSV
          </a></Button>}
        </div>
      </header>
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
              <tr><th scope="col" className="p-3">Inquiry</th>{selected.map((column) =>
                <th key={column.key} scope="col" className="whitespace-nowrap p-3">{column.label}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {items.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/40">
                  <th className="max-w-60 truncate p-3" scope="row"><Link href={`${base}/${lead.id}${query}`} className="hover:underline">{leadTitle(lead)}</Link></th>
                  {selected.map((column) => <td key={column.key} className="max-w-64 truncate p-3 text-muted-foreground">
                    {column.key === "submittedAt"
                      ? <time dateTime={lead.submittedAt}>{date.format(new Date(lead.submittedAt))}</time>
                      : leadColumnValue(lead, column.key) || "—"}
                  </td>)}
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
