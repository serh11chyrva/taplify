import { WorkspaceSettings } from "../../../_components/workspace-settings";
import { InvitationSettings } from "@/app/dashboard/_components/invitation-settings";
import { workspace } from "@/server/dashboard/read";
import { dashboardFeatures } from "@/server/dashboard/features";
import { listInvitations } from "@/server/dashboard/invitations";

export default async function OrganizationSettings({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const { user, organization } = await workspace(organizationId);
  const invitations = dashboardFeatures().collaboration && organization.role === "owner" && !organization.personal
    ? await listInvitations(user.id, organizationId) : null;
  return (
    <section>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">Organization settings</h1>
      <p className="mb-6 text-muted-foreground">{organization.name}</p>
      <div className="grid max-w-xl gap-5">
        <WorkspaceSettings key={`settings-${organization.id}`} organization={organization} />
        {invitations && <InvitationSettings key={`invitations-${organization.id}`} organizationId={organization.id} invitations={invitations} />}
      </div>
    </section>
  );
}
