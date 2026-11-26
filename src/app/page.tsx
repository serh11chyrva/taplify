import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSiteMessages } from "@/lib/i18n/messages";
import { getSitePreferences } from "@/server/site-preferences";
import { HeroDither } from "./_landing/hero-dither";
import { LandingFooter } from "./_landing/landing-footer";
import { MarketingSections } from "./_landing/marketing-sections";
import { ProductsMenu } from "./_landing/products-menu";
import styles from "./landing.module.css";

const geistMonoItalic = localFont({
  src: "./_fonts/GeistMono-SemiBoldItalic.woff2",
  weight: "600",
  style: "italic",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["monospace"],
});

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
  const { landing } = getSiteMessages(locale);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={[styles.container, styles.headerInner].join(" ")}>
          <Link href="/" className={styles.brand}>
            <svg className={styles.brandIcon} viewBox="0 0 160 160" aria-hidden="true">
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M144 18 105 72 140 84 101 98 93 136 72 104 28 126 50 92 18 76 59 68 68 36 86 63Z"
              />
            </svg>
            <span className={geistMonoItalic.className}>taplify</span>
          </Link>
          <nav className={styles.headerNav} aria-label={landing.mainNavigation}>
            <ProductsMenu label={landing.products} />
            <button type="button" className={styles.headerLink} disabled>
              {landing.pricing}
            </button>
          </nav>
          <Button asChild variant="outline" className={styles.signIn}>
            <Link href="/login">{landing.signIn}</Link>
          </Button>
        </div>
      </header>
      <main>
        <section className={styles.hero} aria-labelledby="landing-title">
          <div className={styles.heroBackdrop} aria-hidden="true">
            <HeroDither />
          </div>
          <div className={[styles.container, styles.heroContent].join(" ")}>
            <h1 id="landing-title" className={styles.title}>{landing.heroFirstLine}<br />{landing.heroSecondLine}</h1>
            <p className={styles.description}>{landing.heroDescription}</p>
            <Button asChild variant="outline" size="lg" className={styles.cta}>
              <Link href="/login">{landing.heroCta}</Link>
            </Button>
          </div>
        </section>
        <MarketingSections copy={landing} />
      </main>
      <LandingFooter />
    </div>
  );
}
