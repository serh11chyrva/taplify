import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InvitationAcceptance } from "@/app/dashboard/_components/invitation-acceptance";
import { roleLabels } from "@/lib/dashboard/invitations";
import { organizationPath } from "@/lib/dashboard/organizations";
import { recipientInvitation } from "@/server/dashboard/invitations";
import { dashboardRead } from "@/server/dashboard/read";
import { requireDashboardSession } from "@/server/dashboard/session";

export default async function InvitationPage({ params }: { params: Promise<{ invitationId: string }> }) {
  const { invitationId } = await params;
  const { user } = await requireDashboardSession();
  const invitation = await dashboardRead(() => recipientInvitation(user, invitationId));
  if (invitation.state === "accepted") redirect(organizationPath(invitation.organizationId));
  return (
    <main className="dashboard-theme grid min-h-dvh place-items-center bg-background px-4 py-10">
      <section className="grid w-full max-w-md gap-4 rounded-xl border bg-surface p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Organization invitation</h1>
        {invitation.state === "pending" ? <>
          <p className="text-sm text-muted-foreground">
            {user.emailVerified ? `Join ${invitation.organizationName} as ${roleLabels[invitation.role]}.`
              : `Verify ${user.email} to accept this invitation.`}
          </p>
          <InvitationAcceptance invitationId={invitationId} verified={user.emailVerified} />
        </> : <p className="text-sm text-muted-foreground">
          {invitation.state === "expired" ? "This invitation expired. Ask the owner for a new one." : "This invitation was revoked."}
        </p>}
        <Button asChild size="sm" className="justify-self-start" variant="ghost"><Link href="/dashboard">Go to dashboard</Link></Button>
      </section>
    </main>
  );
}
