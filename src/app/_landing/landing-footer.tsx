import { ArrowUpRight } from "lucide-react";
import styles from "../landing.module.css";
import { productLinks } from "./products";
import { ScrollReveal } from "./scroll-reveal";

function placeholders(labels: string[]) {
  return labels.map((label) => ({ label, marker: "**" }));
}

const footerColumns = [
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
    links: placeholders(["Terms of Service", "Privacy Policy", "Cookie Policy", "Licenses", "Company Information"]),
  }],
];

function FooterLink({ label, marker, href }: { label: string; marker?: string; href?: string }) {
  return (
    <a
      className={styles.footerLink}
      href={href}
      role={href ? undefined : "link"}
      aria-disabled={href ? undefined : true}
    >
      {label}{marker && <sup>{marker}</sup>}
      <ArrowUpRight className={styles.footerLinkIcon} aria-hidden="true" />
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
                    {links.map(({ label, marker }) => (
                      <li key={label}><FooterLink label={label} marker={marker} /></li>
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
