import { PageWizard } from "@/app/dashboard/_components/page-wizard";
import { workspace } from "@/server/dashboard/read";

export default async function NewPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  await workspace(organizationId, "draft:write");
  return <PageWizard organizationId={organizationId} />;
}
