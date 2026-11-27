import { PageTabs } from "@/app/dashboard/_components/page-tabs";
import { pagePath } from "@/lib/dashboard/pages";
import { pageSummary } from "@/server/dashboard/pages";
import { dashboardRead, workspace } from "@/server/dashboard/read";
import { dashboardFeatures } from "@/server/dashboard/features";

export default async function ProjectLayout({ params, children }: {
  params: Promise<{ organizationId: string; pageId: string }>; children: React.ReactNode;
}) {
  const { organizationId, pageId } = await params;
  const { user } = await workspace(organizationId);
  const page = await dashboardRead(() => pageSummary(user.id, organizationId, pageId));
  const tabs = [{ label: "Focus", segment: "focus" }];
  if (page.status !== "archived") tabs.push({ label: "Editor", segment: "editor" });
  const features = dashboardFeatures();
  if (features.forms) tabs.push({ label: "Leads", segment: "leads" });
  if (features.analytics) tabs.push({ label: "Analytics", segment: "analytics" });
  tabs.push({ label: "Settings", segment: "settings" });
  return <><PageTabs base={pagePath(organizationId, pageId)} tabs={tabs} />{children}</>;
}
