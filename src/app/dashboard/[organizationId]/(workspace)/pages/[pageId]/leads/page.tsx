import { LeadInbox } from "@/app/dashboard/_components/lead-inbox";
import { leadFilters } from "@/lib/dashboard/leads";
import { pagePath, type DashboardSearch } from "@/lib/dashboard/pages";
import { listLeads } from "@/server/dashboard/leads";
import { dashboardRead, workspace } from "@/server/dashboard/read";

export default async function LeadsPage({ params, searchParams }: {
  params: Promise<{ organizationId: string; pageId: string }>; searchParams: Promise<DashboardSearch>;
}) {
  const { organizationId, pageId } = await params;
  const { user } = await workspace(organizationId, "leads:manage");
  const filters = leadFilters(await searchParams);
  const result = await dashboardRead(() => listLeads(user.id, organizationId, pageId, filters));
  return <LeadInbox base={`${pagePath(organizationId, pageId)}/leads`} filters={filters} {...result} />;
}
