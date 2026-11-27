import Link from "next/link";
import { ManageCookiesButton } from "@/components/cookies/cookie-consent-provider";
import { COOKIE_POLICY_PATH } from "@/lib/cookie-consent";
import { getSiteMessages } from "@/lib/i18n/messages";
import { getSitePreferences } from "@/server/site-preferences";
import styles from "../landing.module.css";
import { FooterColumns } from "./footer-columns";
import { FooterSocials } from "./footer-socials";
import { LanguageMenu } from "./language-menu";
import { productLinks } from "./products";
import { ScrollReveal } from "./scroll-reveal";
import { TaplifyIcon } from "./taplify-icon";
import { ThemeGroup } from "./theme-group";

type FooterLinkItem = { label: string; marker?: string; href?: string; prefetch?: boolean };
type FooterItem = FooterLinkItem | { label: string; manageCookies: true };

function placeholders(labels: string[]) {
  return labels.map((label) => ({ label, marker: "**" }));
}

function FooterLink({ label, marker, href, prefetch }: FooterLinkItem) {
  const content = (
    <>
      <span>{label}{marker && <sup>{marker}</sup>}</span>
      <svg className={styles.footerLinkIcon} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <polygon points="3,3 13,3 13,13 11.75,13 11.75,5.125 3.5,13.375 2.625,12.5 10.875,4.25 3,4.25" />
      </svg>
    </>
  );

  if (href?.startsWith("/")) {
    return <Link className={styles.footerLink} href={href} prefetch={prefetch}>{content}</Link>;
  }

  return (
    <a
      className={styles.footerLink}
      href={href}
      role={href ? undefined : "link"}
      aria-disabled={href ? undefined : true}
    >
      {content}
    </a>
  );
}

function FooterSection({ title, links }: { title: string; links: FooterItem[] }) {
  return (
    <div>
      <h2>{title}</h2>
      <ul role="list">
        {links.map((item) => (
          <li key={item.label}>
            {"manageCookies" in item ? (
              <ManageCookiesButton className={styles.footerLink} label={item.label} />
            ) : <FooterLink {...item} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function LandingFooter() {
  const { theme, language, locale } = await getSitePreferences();
  const { landing, footer, cookies, preferences } = getSiteMessages(locale);

  return (
    <footer className={styles.footer}>
      <ScrollReveal className={styles.container}>
        <FooterColumns>
          <div className={styles.footerColumn}>
            <FooterSection title="Taplify" links={[
              { label: footer.home, href: "/" },
              { label: landing.pricing, marker: "**" },
              { label: footer.dashboard, href: "/dashboard", prefetch: false },
              ...placeholders([footer.templates, footer.about, footer.support, footer.faqAndGuides, footer.status]),
            ]} />
          </div>
          <div className={styles.footerColumn}>
            <FooterSection title={footer.legal} links={[
              { label: footer.termsOfService, href: "/terms-of-service" },
              { label: footer.privacyPolicy, href: "/privacy-policy" },
              { label: footer.licenses, href: "/licenses", prefetch: false },
              { label: footer.companyInformation, marker: "**" },
            ]} />
            <FooterSection title={footer.cookie} links={[
              { label: cookies.policy, href: COOKIE_POLICY_PATH },
              { label: cookies.manage, manageCookies: true },
            ]} />
          </div>
          <div className={styles.footerColumn}>
            <FooterSection title={footer.developers} links={[
              { label: "GitHub", href: "https://github.com/serh11chyrva/taplify" },
              ...placeholders([footer.documentation, "API", footer.integrations, footer.webhooks]),
            ]} />
          </div>
          <div className={styles.footerColumn}>
            <FooterSection title={landing.products} links={productLinks} />
            <FooterSocials title={footer.social} />
          </div>
        </FooterColumns>
        <div className={styles.footerNotes}>
          <p>* {footer.starredProducts}</p>
          <p>** {footer.placeholderLinks}</p>
        </div>
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © 2026 <TaplifyIcon className={styles.copyrightIcon} viewBox="18 18 126 118" /> Taplify
          </p>
          <div className={styles.footerPreferences}>
            <LanguageMenu value={language} copy={preferences} />
            <ThemeGroup value={theme} copy={preferences} />
          </div>
        </div>
      </ScrollReveal>
    </footer>
  );
}
