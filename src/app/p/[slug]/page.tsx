import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { COOKIE_POLICY_PATH } from "@/lib/cookie-consent";
import { pageAnalyticsCookie, pageAnalyticsDeclineCookie } from "@/lib/dashboard/analytics-consent";
import { PageRenderer } from "@/components/pages/page-renderer";
import { PublicPageAnalytics } from "@/components/pages/public-page-analytics";
import { publishedPage, publicUrl } from "@/server/dashboard/publication";
import { dashboardFeatures } from "@/server/dashboard/features";
import { analyticsChoice } from "@/server/dashboard/analytics-consent";

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
  const features = dashboardFeatures();
  const jar = features.analytics ? await cookies() : undefined;
  const content = (
    <>
      <PageRenderer draft={page.draft} mediaBase={`/api/public/pages/${slug}/media`}
        form={features.forms && page.formVersion ? { slug, version: page.formVersion } : undefined} />
      <footer className="mx-auto max-w-lg px-5 pt-5 pb-5 text-sm opacity-80">
        <Link href={COOKIE_POLICY_PATH} className="underline underline-offset-4">Cookie Policy</Link>
      </footer>
    </>
  );
  return (
    <main lang="en" className="min-h-dvh" style={{ background: page.draft.appearance.background, color: page.draft.appearance.foreground }}>
      {jar ? <PublicPageAnalytics initial={analyticsChoice(jar.get(pageAnalyticsCookie)?.value, jar.get(pageAnalyticsDeclineCookie)?.value)}>
        {content}
      </PublicPageAnalytics> : content}
    </main>
  );
}
