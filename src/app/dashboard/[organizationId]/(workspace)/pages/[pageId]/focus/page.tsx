import { PublicationStatus } from "../../../../../_components/page-directory";
import { pageSummary } from "@/server/dashboard/pages";
import { dashboardRead, workspace } from "@/server/dashboard/read";

export default async function PageFocus({ params }: { params: Promise<{ organizationId: string; pageId: string }> }) {
  const { organizationId, pageId } = await params;
  const { user } = await workspace(organizationId);
  const page = await dashboardRead(() => pageSummary(user.id, organizationId, pageId));
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{page.name}</h1>
        <PublicationStatus status={page.status} />
      </div>
      <p className="text-muted-foreground">{page.type} page</p>
    </section>
  );
}
