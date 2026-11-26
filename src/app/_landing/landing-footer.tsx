import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ManageCookiesButton } from "@/components/cookies/cookie-consent-provider";
import { COOKIE_POLICY_PATH } from "@/lib/cookie-consent";
import styles from "../landing.module.css";
import { productLinks } from "./products";
import { ScrollReveal } from "./scroll-reveal";

type FooterLinkItem = { label: string; marker?: string; href?: string; prefetch?: boolean };
type FooterItem = FooterLinkItem | { label: "Manage Cookies"; manageCookies: true };

function placeholders(labels: string[]) {
  return labels.map((label) => ({ label, marker: "**" }));
}

const footerColumns: { title: string; links: FooterItem[] }[][] = [
  [
    { title: "Taplify", links: placeholders(["Templates", "About", "Support", "FAQ & Guides", "Status"]) },
    { title: "Products", links: productLinks },
  ],
  [{
    title: "Developers",
    links: placeholders(["GitHub", "Documentation", "API", "Integrations", "Webhooks"]),
  }],
  [{
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Cookie Policy", href: COOKIE_POLICY_PATH },
      { label: "Manage Cookies", manageCookies: true },
      { label: "Licenses", href: "/licenses", prefetch: false },
      { label: "Company Information", marker: "**" },
    ],
  }],
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

export function LandingFooter() {
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
        <p className={styles.copyright}>
          © 2026 Taplify powered by <FooterLink label="Vercel" href="https://vercel.com/" />
        </p>
      </ScrollReveal>
    </footer>
  );
}
