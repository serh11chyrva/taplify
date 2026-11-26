import { ArrowUpRight, SunMoon } from "lucide-react";
import Link from "next/link";
import { ManageCookiesButton } from "@/components/cookies/cookie-consent-provider";
import { COOKIE_POLICY_PATH } from "@/lib/cookie-consent";
import { getSiteTheme } from "@/server/site-preferences";
import styles from "../landing.module.css";
import { saveTheme } from "./preference-actions";
import { PreferenceSelect } from "./preference-select";
import { productLinks } from "./products";
import { ScrollReveal } from "./scroll-reveal";

type FooterLinkItem = { label: string; marker?: string; href?: string; prefetch?: boolean };
type FooterItem = FooterLinkItem | { label: "Manage Cookies"; manageCookies: true };

function placeholders(labels: string[]) {
  return labels.map((label) => ({ label, marker: "**" }));
}

const footerColumns: { title: string; links: FooterItem[] }[][] = [
  [
    {
      title: "Taplify",
      links: [
        { label: "Home", href: "/" },
        ...placeholders(["Templates", "About", "Support", "FAQ & Guides", "Status"]),
      ],
    },
    { title: "Products", links: productLinks },
  ],
  [{
    title: "Developers",
    links: [
      { label: "GitHub", href: "https://github.com/serh11chyrva/taplify" },
      ...placeholders(["Documentation", "API", "Integrations", "Webhooks"]),
    ],
  }],
  [
    {
      title: "Legal",
      links: [
        { label: "Terms of Service", href: "/terms-of-service" },
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Licenses", href: "/licenses", prefetch: false },
        { label: "Company Information", marker: "**" },
      ],
    },
    {
      title: "Cookie",
      links: [
        { label: "Cookie Policy", href: COOKIE_POLICY_PATH },
        { label: "Manage Cookies", manageCookies: true },
      ],
    },
  ],
];

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
  const theme = await getSiteTheme();

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
                        {"manageCookies" in item ? <ManageCookiesButton className={styles.footerLink} /> : <FooterLink {...item} />}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className={styles.footerNotes}>
          <p>* Starred products are shown for demonstration purposes.</p>
          <p>** These links are placeholders.</p>
        </div>
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © 2026 Taplify powered by <FooterLink label="Vercel" href="https://vercel.com/" />
          </p>
          <div className={styles.footerPreferences}>
            <PreferenceSelect
              label="Theme"
              value={theme}
              options={[
                { value: "system", label: "System" },
                { value: "dark", label: "Dark" },
                { value: "light", label: "Light" },
              ]}
              icon={<SunMoon />}
              saveAction={saveTheme}
            />
          </div>
        </div>
      </ScrollReveal>
    </footer>
  );
}
