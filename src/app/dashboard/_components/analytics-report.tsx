import Link from "next/link";
import { ArrowUpRight, ChartNoAxesColumnIncreasing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { emptyTraffic, type AnalyticsReport as Report } from "@/lib/dashboard/analytics";
import { pagePath } from "@/lib/dashboard/pages";
import { AnalyticsChart } from "./analytics-chart";

const number = new Intl.NumberFormat("en");
const percent = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 });

function Ranking({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const highest = rows[0]?.count ?? 1;
  return (
    <section className="min-w-0 space-y-3 rounded-xl border bg-surface p-4">
      <h2 className="font-semibold">{title}</h2>
      {rows.length ? <ol className="grid gap-3">
        {rows.map(({ label, count }) => <li key={label} className="grid gap-1.5 text-sm">
          <div className="flex items-center justify-between gap-2"><span className="min-w-0 break-words">{label}</span><span>{number.format(count)}</span></div>
          <div className="h-1 rounded bg-muted" aria-hidden="true"><div className="h-full rounded bg-[#9eaaff]" style={{ width: `${100 * count / highest}%` }} /></div>
        </li>)}
      </ol> : <p className="text-sm text-muted-foreground">No activity in this period.</p>}
    </section>
  );
}

export function AnalyticsReport({ report, base, title, organizationId, pages }: {
  report: Report; base: string; title: string; organizationId: string; pages?: { id: string; name: string }[];
}) {
  const { totals } = report;
  const metrics = [
    ["Views", number.format(totals.views)], ["Unique visitors", number.format(totals.uniqueVisitors)],
    ["Link clicks", number.format(totals.clicks)], ["Submissions", number.format(totals.submissions)],
    ["Conversion", totals.conversion === null ? "—" : percent.format(totals.conversion)],
  ];
  return (
    <section className="grid gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{report.range.from} – {report.range.to} UTC</p>
        </div>
        <nav className="flex gap-1 rounded-lg border bg-surface p-1" aria-label="Report period">
          {[7, 30].map((days) => (
            <Button key={days} asChild variant="ghost" size="sm" className={report.days.length === days ? "bg-muted" : ""}>
              <Link href={`${base}?range=${days}`} aria-current={report.days.length === days ? "page" : undefined}>Last {days} days</Link>
            </Button>
          ))}
        </nav>
      </header>
      <dl className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
        {metrics.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-xl border bg-surface p-4">
            <dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted-foreground">Unique visitors are distinct browsers that allowed page analytics. Conversion uses measured views.</p>
      {totals.views || totals.clicks || totals.submissions ? <AnalyticsChart days={report.days} /> : (
        <div className="grid justify-items-center gap-2 rounded-xl border border-dashed bg-surface p-10 text-center">
          <ChartNoAxesColumnIncreasing size={25} aria-hidden="true" className="text-muted-foreground" />
          <h2 className="font-medium">No activity yet</h2>
          <p className="max-w-xs text-sm text-muted-foreground">Views, link clicks, and form submissions will appear here as visitors use published pages.</p>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-3">
        <Ranking title="Popular links" rows={report.links} />
        <Ranking title="Referring domains" rows={report.referrers} />
        <Ranking title="UTM campaigns" rows={report.campaigns} />
      </div>
      {pages && (
        <section className="overflow-x-auto rounded-xl border bg-surface">
          <h2 className="border-b p-4 font-semibold">Pages</h2>
          {pages.length ? (
            <table className="w-full min-w-[32rem] text-left text-sm">
              <caption className="sr-only">Traffic by page</caption>
              <thead className="border-b text-xs text-muted-foreground"><tr>
                {["Page", "Views", "Unique visitors", "Link clicks", "Submissions"].map((label) => <th scope="col" key={label} className="p-3">{label}</th>)}
              </tr></thead>
              <tbody className="divide-y">
                {pages.map((page) => {
                  const counts = report.byPage[page.id] ?? emptyTraffic();
                  return <tr key={page.id}>
                    <th scope="row" className="p-3">
                      <Link className="inline-flex items-center gap-1.5 hover:underline" href={`${pagePath(organizationId, page.id)}/analytics?from=${report.range.from}&to=${report.range.to}`}>
                        {page.name}<ArrowUpRight size={13} aria-hidden="true" />
                      </Link>
                    </th>
                    <td className="p-3">{number.format(counts.views)}</td><td className="p-3">{number.format(counts.uniqueVisitors)}</td>
                    <td className="p-3">{number.format(counts.clicks)}</td><td className="p-3">{number.format(counts.submissions)}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          ) : <p className="p-4 text-sm text-muted-foreground">Create a page to see its report here.</p>}
        </section>
      )}
    </section>
  );
}
