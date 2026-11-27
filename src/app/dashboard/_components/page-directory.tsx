import Link from "next/link";
import { Files, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pagePath, type directoryFilters, type PageStatus, type PageSummary } from "@/lib/dashboard/pages";
import { organizationPath } from "@/lib/dashboard/organizations";

const date = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

export function PublicationStatus({ status }: { status: PageStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${status === "published" ? "border-emerald-900 bg-emerald-950/50 text-emerald-200" : "text-muted-foreground"}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {status === "published" ? "Published" : status === "archived" ? "Archived" : "Draft"}
    </span>
  );
}

export function PageDirectory({ organizationId, canCreate, items, filters, total, size }: {
  organizationId: string;
  canCreate: boolean;
  items: PageSummary[];
  filters: ReturnType<typeof directoryFilters>;
  total: number;
  size: number;
}) {
  const home = organizationPath(organizationId);
  const createPage = (
    <Button asChild>
      <Link href={`${home}/pages/new`}><Plus size={16} aria-hidden="true" /> New page</Link>
    </Button>
  );

  function filterLink(status: PageStatus | undefined, page = 1) {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (filters.q) query.set("q", filters.q);
    if (page > 1) query.set("page", String(page));
    return query.size ? `${home}?${query}` : home;
  }

  return (
    <>
      <div className="mb-7 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Pages</h1>
          <p className="mt-2 text-muted-foreground">Manage the organization’s public pages and drafts.</p>
        </div>
        {canCreate && createPage}
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Page status" className="flex flex-wrap gap-1 rounded-lg border bg-surface p-1 text-sm">
          {([["All pages", undefined], ["Published", "published"], ["Drafts", "draft"], ["Archived", "archived"]] as const).map(([label, status]) => (
            <Link key={label} href={filterLink(status)} aria-current={status === filters.status ? "page" : undefined}
              className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted aria-[current=page]:bg-muted aria-[current=page]:text-foreground">
              {label}
            </Link>
          ))}
        </nav>
        <form action={home} className="flex items-center gap-2">
          {filters.status && <input type="hidden" name="status" value={filters.status} />}
          <input name="q" aria-label="Search pages" placeholder="Search pages…" maxLength={100} defaultValue={filters.q} className="dashboard-input" />
          <Button type="submit" variant="outline" size="icon" aria-label="Search"><Search size={16} aria-hidden="true" /></Button>
        </form>
      </div>
      {items.length === 0 ? (
        <section className="grid justify-items-center gap-3 rounded-xl border border-dashed bg-surface px-5 py-16 text-center">
          <Files size={28} className="text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold">{filters.q || filters.status ? "No matching pages" : "No pages yet"}</h2>
          {filters.q || filters.status ? <Link href={home} className="text-sm underline">Clear filters</Link> : null}
          {!filters.q && !filters.status && canCreate && <p className="max-w-sm text-sm text-muted-foreground">Start with a template and make the page yours in the editor.</p>}
        </section>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-surface">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <caption className="sr-only">Organization pages</caption>
            <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
              <tr><th scope="col" className="p-4 font-medium">Page</th><th scope="col" className="p-4 font-medium">Type</th><th scope="col" className="p-4 font-medium">Status</th><th scope="col" className="p-4 font-medium">Last updated</th></tr>
            </thead>
            <tbody className="divide-y">
              {items.map((page) => (
                <tr key={page.id} className="hover:bg-muted/40">
                  <th scope="row" className="p-4">
                    <Link className="flex items-center gap-3 hover:underline" href={`${pagePath(organizationId, page.id)}/focus`}>
                      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg border bg-muted">{page.name.slice(0, 1).toUpperCase()}</span>
                      <span className="max-w-52 truncate">{page.name}{page.slug && <small className="block font-mono font-normal text-muted-foreground">/p/{page.slug}</small>}</span>
                    </Link>
                  </th>
                  <td className="p-4">{page.type}</td>
                  <td className="p-4"><PublicationStatus status={page.status} /></td>
                  <td className="p-4 text-muted-foreground"><time dateTime={page.updatedAt}>{date.format(new Date(page.updatedAt))}</time></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
            <span>{total} {total === 1 ? "page" : "pages"}</span>
            <div className="flex gap-2">
              {filters.page > 1 && <Button asChild size="sm" variant="outline"><Link href={filterLink(filters.status, filters.page - 1)}>Previous</Link></Button>}
              {filters.page * size < total && <Button asChild size="sm" variant="outline"><Link href={filterLink(filters.status, filters.page + 1)}>Next</Link></Button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
