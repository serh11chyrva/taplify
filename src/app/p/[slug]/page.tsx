import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CookieFooter } from "@/components/cookies/cookie-footer";
import { PageRenderer } from "@/components/pages/page-renderer";
import { publishedPage, publicUrl } from "@/server/dashboard/publication";
import { dashboardFeatures } from "@/server/dashboard/features";

export const dynamic = "force-dynamic";

const loadPage = cache(publishedPage);
type PublicPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PublicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) return { robots: { index: false, follow: false } };
  return { title: page.draft.name, alternates: { canonical: publicUrl(slug) } };
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) notFound();
  return (
    <main lang="en" className="min-h-dvh" style={{ background: page.draft.appearance.background, color: page.draft.appearance.foreground }}>
      <PageRenderer draft={page.draft} mediaBase={`/api/public/pages/${slug}/media`}
        form={dashboardFeatures().forms && page.formVersion ? { slug, version: page.formVersion } : undefined} />
      <CookieFooter className="mx-auto max-w-lg px-5 pt-6 pb-8 opacity-80" />
    </main>
  );
}
