import { ArrowUpRight, Globe, SunMoon } from "lucide-react";
import Link from "next/link";
import { ManageCookiesButton } from "@/components/cookies/cookie-consent-provider";
import { COOKIE_POLICY_PATH } from "@/lib/cookie-consent";
import { getSiteMessages } from "@/lib/i18n/messages";
import { locales, themes } from "@/lib/site-preferences";
import { getSitePreferences } from "@/server/site-preferences";
import styles from "../landing.module.css";
import { saveLanguage, saveTheme } from "./preference-actions";
import { PreferenceSelect } from "./preference-select";
import { productLinks } from "./products";
import { ScrollReveal } from "./scroll-reveal";

type FooterLinkItem = { label: string; marker?: string; href?: string; prefetch?: boolean };
type FooterItem = FooterLinkItem | { label: string; manageCookies: true };

function placeholders(labels: string[]) {
  return labels.map((label) => ({ label, marker: "**" }));
}

function FooterLink({ label, marker, href, prefetch }: FooterLinkItem) {
  const content = (
    <>
      {label}{marker && <sup>{marker}</sup>}
      <ArrowUpRight className={styles.footerLinkIcon} aria-hidden="true" />
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
  const footerColumns: { title: string; links: FooterItem[] }[][] = [
    [
      {
        title: "Taplify",
        links: [
          { label: footer.home, href: "/" },
          ...placeholders([footer.templates, footer.about, footer.support, footer.faqAndGuides, footer.status]),
        ],
      },
      { title: landing.products, links: productLinks },
    ],
    [{
      title: footer.developers,
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
      <ScrollReveal className={[styles.container, styles.reveal].join(" ")}>
        <div className={styles.footerColumns}>
          {footerColumns.map((column) => (
            <div className={styles.footerColumn} key={column[0].title}>
              {column.map(({ title, links }) => (
                <div key={title}>
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
        </div>
        <div className={styles.footerNotes}>
          <p>* {footer.starredProducts}</p>
          <p>** {footer.placeholderLinks}</p>
        </div>
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © 2026 Taplify {footer.poweredBy} <FooterLink label="Vercel" href="https://vercel.com/" />
          </p>
          <div className={styles.footerPreferences}>
            <PreferenceSelect
              label={preferences.theme}
              value={theme}
              options={themes.map((value) => ({ value, label: preferences[value] }))}
              icon={<SunMoon />}
              saveAction={saveTheme}
              errorMessage={preferences.saveError}
            />
            <PreferenceSelect
              label={preferences.language}
              value={language}
              options={[
                { value: "auto", label: preferences.automatic },
                ...locales.map(({ value, label }) => ({ value, label, language: value })),
              ]}
              icon={<Globe />}
              saveAction={saveLanguage}
              errorMessage={preferences.saveError}
            />
          </div>
        </div>
      </ScrollReveal>
    </footer>
  );
}
