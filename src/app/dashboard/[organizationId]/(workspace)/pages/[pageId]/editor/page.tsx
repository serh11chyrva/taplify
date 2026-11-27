import { PageEditor } from "@/app/dashboard/_components/page-editor";
import { readDraft } from "@/server/dashboard/pages";
import { dashboardRead, workspace } from "@/server/dashboard/read";
import { dashboardFeatures } from "@/server/dashboard/features";
import { organizationCan } from "@/lib/dashboard/organizations";

export default async function EditorPage({ params }: { params: Promise<{ organizationId: string; pageId: string }> }) {
  const { organizationId, pageId } = await params;
  const { user, organization } = await workspace(organizationId, "draft:write");
  const { draft, revision, page } = await dashboardRead(() => readDraft(user.id, organizationId, pageId));
  return <PageEditor key={pageId} organizationId={organizationId} page={page} draft={draft} revision={revision}
    formsEnabled={dashboardFeatures().forms} canPublish={organizationCan(organization.role, "page:publish")} />;
}
