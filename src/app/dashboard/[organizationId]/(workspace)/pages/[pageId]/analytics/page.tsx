import { AnalyticsReport } from "@/app/dashboard/_components/analytics-report";
import { reportRange } from "@/lib/dashboard/analytics";
import { pagePath, type DashboardSearch } from "@/lib/dashboard/pages";
import { loadAnalytics } from "@/server/dashboard/analytics";
import { dashboardRead, workspace } from "@/server/dashboard/read";

export default async function ProjectAnalytics({ params, searchParams }: {
  params: Promise<{ organizationId: string; pageId: string }>; searchParams: Promise<DashboardSearch>;
}) {
  const { organizationId, pageId } = await params;
  const { user } = await workspace(organizationId, "analytics:read");
  const range = reportRange(await searchParams);
  const { report } = await dashboardRead(() => loadAnalytics(user.id, organizationId, range, pageId));
  return <AnalyticsReport base={`${pagePath(organizationId, pageId)}/analytics`} title="Page analytics" organizationId={organizationId} report={report} />;
}
