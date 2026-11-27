import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageRenderer } from "@/components/pages/page-renderer";
import { pagePath } from "@/lib/dashboard/pages";
import { organizationMediaPath } from "@/lib/dashboard/media";
import { PublicationStatus } from "@/app/dashboard/_components/page-directory";
import { pageSummary, readDraft } from "@/server/dashboard/pages";
import { dashboardRead, workspace } from "@/server/dashboard/read";

export default async function PageFocus({ params }: { params: Promise<{ organizationId: string; pageId: string }> }) {
  const { organizationId, pageId } = await params;
  const { user } = await workspace(organizationId);
  const page = await dashboardRead(() => pageSummary(user.id, organizationId, pageId));
  const draft = page.status === "archived" ? null : (await dashboardRead(() => readDraft(user.id, organizationId, pageId))).draft;
  const address = pagePath(organizationId, pageId);
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{page.name}</h1>
        <PublicationStatus status={page.status} />
      </div>
      <div className="grid items-start gap-5 md:grid-cols-[1fr_minmax(17rem,23rem)]">
        <div className="space-y-4 rounded-xl border bg-surface p-5">
          <dl className="grid gap-1"><dt className="text-sm text-muted-foreground">Page type</dt><dd className="font-medium">{page.type}</dd></dl>
          {draft && <div className="flex flex-wrap gap-2">
            <Button asChild><Link href={`${address}/editor`}>Edit page</Link></Button>
            <Button asChild variant="outline"><Link href={`${address}/preview`}>Preview</Link></Button>
          </div>}
        </div>
        {draft && <div className="grid gap-3 rounded-2xl border bg-surface p-3">
          <h2 className="text-sm font-medium">Saved preview</h2>
          <PageRenderer draft={draft} preview mediaBase={organizationMediaPath(organizationId)} />
        </div>}
      </div>
    </section>
  );
}
