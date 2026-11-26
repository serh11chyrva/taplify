import Link from "next/link";
import { LandingFooter } from "../_landing/landing-footer";
import landingStyles from "../landing.module.css";
import styles from "./legal.module.css";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${landingStyles.page} flex flex-col`}>
      <main className={styles.content}>
        <Link href="/" className={styles.backLink}>Back to Taplify</Link>
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}
