import { PageTabs } from "@/app/dashboard/_components/page-tabs";
import { pagePath } from "@/lib/dashboard/pages";
import { pageSummary } from "@/server/dashboard/pages";
import { dashboardRead, workspace } from "@/server/dashboard/read";

export default async function ProjectLayout({ params, children }: {
  params: Promise<{ organizationId: string; pageId: string }>; children: React.ReactNode;
}) {
  const { organizationId, pageId } = await params;
  const { user } = await workspace(organizationId);
  const page = await dashboardRead(() => pageSummary(user.id, organizationId, pageId));
  const tabs = [{ label: "Focus", segment: "focus" }];
  if (page.status !== "archived") tabs.push({ label: "Editor", segment: "editor" });
  tabs.push({ label: "Settings", segment: "settings" });
  return <><PageTabs base={pagePath(organizationId, pageId)} tabs={tabs} />{children}</>;
}
