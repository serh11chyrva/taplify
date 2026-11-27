import { LeadInbox } from "@/app/dashboard/_components/lead-inbox";
import { leadFilters } from "@/lib/dashboard/leads";
import { pageApiPath, pagePath, type DashboardSearch } from "@/lib/dashboard/pages";
import { leadColumns } from "@/server/dashboard/lead-columns";
import { listLeads } from "@/server/dashboard/leads";
import { dashboardRead, workspace } from "@/server/dashboard/read";

export default async function LeadsPage({ params, searchParams }: {
  params: Promise<{ organizationId: string; pageId: string }>; searchParams: Promise<DashboardSearch>;
}) {
  const { organizationId, pageId } = await params;
  const { user, organization } = await workspace(organizationId, "leads:manage");
  const filters = leadFilters(await searchParams);
  const [result, columns] = await dashboardRead(() => Promise.all([
    listLeads(user.id, organizationId, pageId, filters), leadColumns(user.id, organizationId, pageId),
  ]));
  return <LeadInbox base={`${pagePath(organizationId, pageId)}/leads`} api={pageApiPath(organizationId, pageId)}
    canExport={organization.role === "owner"} columns={columns} filters={filters} {...result} />;
}
