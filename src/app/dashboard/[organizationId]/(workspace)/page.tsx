import { PageDirectory } from "../../_components/page-directory";
import { directoryFilters, type DashboardSearch } from "@/lib/dashboard/pages";
import { listPages } from "@/server/dashboard/pages";
import { dashboardRead, workspace } from "@/server/dashboard/read";
import { organizationCan } from "@/lib/dashboard/organizations";

export default async function OrganizationDashboard({ params, searchParams }: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<DashboardSearch>;
}) {
  const { organizationId } = await params;
  const { user, organization } = await workspace(organizationId);
  const filters = directoryFilters(await searchParams);
  const result = await dashboardRead(() => listPages(user.id, organizationId, filters));
  return <PageDirectory organizationId={organizationId} canCreate={organizationCan(organization.role, "draft:write")} filters={filters} {...result} />;
}
