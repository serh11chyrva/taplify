import { DashboardFrame } from "../../_components/dashboard-frame";
import { listOrganizations } from "@/server/dashboard/organizations";
import { workspace } from "@/server/dashboard/read";
import { sidebarPages } from "@/server/dashboard/pages";

export default async function WorkspaceLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const { user, organization } = await workspace(organizationId);
  const [organizations, projects] = await Promise.all([
    listOrganizations(user.id), sidebarPages(user.id, organizationId),
  ]);
  return <DashboardFrame organization={organization} organizations={organizations} projects={projects}
    account={{ name: user.name, email: user.email }}>{children}</DashboardFrame>;
}
