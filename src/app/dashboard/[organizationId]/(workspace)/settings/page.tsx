import { WorkspaceSettings } from "../../../_components/workspace-settings";
import { workspace } from "@/server/dashboard/read";

export default async function OrganizationSettings({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const { organization } = await workspace(organizationId);
  return (
    <section>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">Organization settings</h1>
      <p className="mb-6 text-muted-foreground">{organization.name}</p>
      <WorkspaceSettings key={organization.id} organization={organization} />
    </section>
  );
}
