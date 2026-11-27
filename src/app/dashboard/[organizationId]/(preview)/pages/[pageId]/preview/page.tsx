import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageRenderer } from "@/components/pages/page-renderer";
import { pagePath } from "@/lib/dashboard/pages";
import { readDraft } from "@/server/dashboard/pages";
import { dashboardRead, workspace } from "@/server/dashboard/read";

export default async function SavedPreview({ params }: { params: Promise<{ organizationId: string; pageId: string }> }) {
  const { organizationId, pageId } = await params;
  const { user } = await workspace(organizationId, "draft:write");
  const { draft } = await dashboardRead(() => readDraft(user.id, organizationId, pageId));
  return (
    <main className="dashboard-theme min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-surface px-4 py-2.5">
        <p className="truncate text-sm text-muted-foreground">Draft preview · {draft.name}</p>
        <Button asChild variant="outline" size="sm"><Link href={`${pagePath(organizationId, pageId)}/editor`}>Back to editor</Link></Button>
      </header>
      <PageRenderer draft={draft} preview />
    </main>
  );
}
