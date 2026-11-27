import { ArrowUpRight } from "lucide-react";
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
      <ArrowUpRight className={styles.footerLinkIcon} viewBox="4 4 16 16" aria-hidden="true" />
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

export async function LandingFooter() {
  const { theme, language, locale } = await getSitePreferences();
  const { landing, footer, cookies, preferences } = getSiteMessages(locale);
  const footerColumns: { title: string; links: FooterItem[]; mobileFirstRow?: boolean }[][] = [
    [
      {
        title: "Taplify",
        mobileFirstRow: true,
        links: [
          { label: footer.home, href: "/" },
          { label: landing.pricing, marker: "**" },
          { label: footer.dashboard, href: "/dashboard", prefetch: false },
          ...placeholders([footer.templates, footer.about, footer.support, footer.faqAndGuides, footer.status]),
        ],
      },
      { title: landing.products, links: productLinks },
    ],
    [{
      title: footer.developers,
      mobileFirstRow: true,
      links: [
        { label: "GitHub", href: "https://github.com/serh11chyrva/taplify" },
        ...placeholders([footer.documentation, "API", footer.integrations, footer.webhooks]),
      ],
    }],
    [
      {
        title: footer.legal,
        links: [
          { label: footer.termsOfService, href: "/terms-of-service" },
          { label: footer.privacyPolicy, href: "/privacy-policy" },
          { label: footer.licenses, href: "/licenses", prefetch: false },
          { label: footer.companyInformation, marker: "**" },
        ],
      },
      {
        title: footer.cookie,
        links: [
          { label: cookies.policy, href: COOKIE_POLICY_PATH },
          { label: cookies.manage, manageCookies: true },
        ],
      },
    ],
  ];

  return (
    <footer className={styles.footer}>
      <ScrollReveal className={styles.container}>
        <FooterColumns>
          {footerColumns.map((column) => (
            <div className={styles.footerColumn} key={column[0].title}>
              {column.map(({ title, links, mobileFirstRow }) => (
                <div key={title} className={mobileFirstRow ? styles.footerFirstRow : undefined}>
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
              ))}
            </div>
          ))}
          <FooterSocials title={footer.social} />
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
