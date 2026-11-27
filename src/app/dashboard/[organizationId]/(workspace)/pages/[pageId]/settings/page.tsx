import { PublicationStatus } from "@/app/dashboard/_components/page-directory";
import { PublicationSettings } from "@/app/dashboard/_components/publication-actions";
import { ArchivePage } from "@/app/dashboard/_components/archive-page";
import { pageApiPath } from "@/lib/dashboard/pages";
import { pageSummary } from "@/server/dashboard/pages";
import { publicUrl } from "@/server/dashboard/publication";
import { dashboardRead, workspace } from "@/server/dashboard/read";

export default async function PageSettings({ params }: { params: Promise<{ organizationId: string; pageId: string }> }) {
  const { organizationId, pageId } = await params;
  const { user } = await workspace(organizationId, "page:publish");
  const page = await dashboardRead(() => pageSummary(user.id, organizationId, pageId));
  const url = page.slug ? publicUrl(page.slug) : null;
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Page settings</h1>
        <PublicationStatus status={page.status} />
      </div>
      <p className="text-muted-foreground">{page.name} · {page.type}</p>
      <PublicationSettings page={page} url={url} api={pageApiPath(organizationId, pageId)} />
      <ArchivePage page={page} api={pageApiPath(organizationId, pageId)} />
    </section>
  );
}
