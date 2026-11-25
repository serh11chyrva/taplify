import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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

export const metadata: Metadata = {
  title: { absolute: "Taplify | Build a microsite worth sharing" },
  description: "Build a microsite for your portfolio, company, or products. Bring links, galleries, and a contact form together on one shareable page.",
};

export default function HomePage() {
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
          <nav className={styles.headerNav} aria-label="Main">
            <ProductsMenu />
            <button type="button" className={styles.headerLink} disabled>
              Pricing
            </button>
          </nav>
          <Button asChild variant="outline" className={styles.signIn}>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>
      <main>
        <section className={styles.hero} aria-labelledby="landing-title">
          <div className={styles.heroBackdrop} aria-hidden="true">
            <HeroDither />
          </div>
          <div className={[styles.container, styles.heroContent].join(" ")}>
            <h1 id="landing-title" className={styles.title}>One link.<br />Your whole story.</h1>
            <p className={styles.description}>
              Create a microsite for your portfolio, company, or products. Bring links, galleries,
              and a contact form together on one page you can share anywhere.
            </p>
            <Button asChild variant="outline" size="lg" className={styles.cta}>
              <Link href="/login">Create your first page</Link>
            </Button>
          </div>
        </section>
        <MarketingSections />
      </main>
      <LandingFooter />
    </div>
  );
}
