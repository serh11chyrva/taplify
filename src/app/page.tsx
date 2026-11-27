import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSiteMessages } from "@/lib/i18n/messages";
import { getSitePreferences } from "@/server/site-preferences";
import { HeroDither } from "./_landing/hero-dither";
import { LandingFooter } from "./_landing/landing-footer";
import { LandingHeader } from "./_landing/landing-header";
import { MarketingSections } from "./_landing/marketing-sections";
import styles from "./landing.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getSitePreferences();
  const { landing } = getSiteMessages(locale);
  return {
    title: { absolute: landing.metadataTitle },
    description: landing.metadataDescription,
  };
}

export default async function HomePage() {
  const { locale } = await getSitePreferences();
  const { landing, footer, cookies } = getSiteMessages(locale);
  const { mainNavigation, products, pricing, signIn, signUp } = landing;
  const { templates, faqAndGuides } = footer;

  return (
    <div className={styles.page}>
      <LandingHeader
        copy={{ mainNavigation, products, pricing, templates, faqAndGuides, signIn, signUp }}
        closeLabel={cookies.close}
      />
      <main>
        <section className={styles.hero} aria-labelledby="landing-title">
          <div className={styles.heroBackdrop} aria-hidden="true">
            <HeroDither />
          </div>
          <div className={[styles.container, styles.heroContent].join(" ")}>
            <h1 id="landing-title" className={styles.title}>{landing.heroFirstLine}<br />{landing.heroSecondLine}</h1>
            <p className={styles.description}>{landing.heroDescription}</p>
            <Button asChild variant="outline" size="lg" className={styles.cta}>
              <Link href="/sign-up">{landing.heroCta}</Link>
            </Button>
          </div>
        </section>
        <MarketingSections copy={landing} />
      </main>
      <LandingFooter />
    </div>
  );
}
