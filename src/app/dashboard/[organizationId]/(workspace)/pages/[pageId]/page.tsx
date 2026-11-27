import { redirect } from "next/navigation";
import { pagePath } from "@/lib/dashboard/pages";
import { pageSummary } from "@/server/dashboard/pages";
import { dashboardRead, workspace } from "@/server/dashboard/read";

export default async function PageHome({ params }: { params: Promise<{ organizationId: string; pageId: string }> }) {
  const { organizationId, pageId } = await params;
  const { user } = await workspace(organizationId);
  await dashboardRead(() => pageSummary(user.id, organizationId, pageId));
  redirect(`${pagePath(organizationId, pageId)}/focus`);
}
