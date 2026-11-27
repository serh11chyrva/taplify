import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroDither } from "../_landing/hero-dither";
import { LandingFooter } from "../_landing/landing-footer";
import { TaplifyIcon } from "../_landing/taplify-icon";
import landingStyles from "../landing.module.css";
import styles from "./auth.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={landingStyles.page}>
      <main className={styles.screen} lang="en">
        <div className={landingStyles.heroBackdrop} aria-hidden="true">
          <HeroDither />
        </div>
        <div className={landingStyles.container}>
          <Button asChild variant="ghost" className={styles.backLink}>
            <Link href="/">
              <ArrowLeft size={17} aria-hidden="true" />
              Back to Taplify
            </Link>
          </Button>
        </div>
        <div className={styles.content}>
          <Link href="/" className={`${landingStyles.brand} ${styles.brand}`}>
            <TaplifyIcon className={landingStyles.brandIcon} />
            Taplify
          </Link>
          {children}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
