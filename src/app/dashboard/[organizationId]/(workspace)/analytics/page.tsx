import { AnalyticsReport } from "@/app/dashboard/_components/analytics-report";
import { reportRange } from "@/lib/dashboard/analytics";
import { organizationPath } from "@/lib/dashboard/organizations";
import type { DashboardSearch } from "@/lib/dashboard/pages";
import { loadAnalytics } from "@/server/dashboard/analytics";
import { dashboardRead, workspace } from "@/server/dashboard/read";

export default async function WorkspaceAnalytics({ params, searchParams }: {
  params: Promise<{ organizationId: string }>; searchParams: Promise<DashboardSearch>;
}) {
  const { organizationId } = await params;
  const { user } = await workspace(organizationId, "analytics:read");
  const range = reportRange(await searchParams);
  const { report, pages } = await dashboardRead(() => loadAnalytics(user.id, organizationId, range));
  return <AnalyticsReport base={`${organizationPath(organizationId)}/analytics`} title="Organization analytics"
    organizationId={organizationId} report={report} pages={pages} />;
}
