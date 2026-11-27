import type { Metadata } from "next";
import Link from "next/link";
import { ManageCookiesButton } from "@/components/cookies/cookie-consent-provider";
import { COOKIE_CONSENT_DAYS, ga4MeasurementId } from "@/lib/cookie-consent";
import { ContactEmail } from "../contact-email";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Taplify uses cookies and browser storage, and how to manage your preferences.",
};

export default function CookiePolicyPage() {
  return (
    <>
      <h1>Cookie Policy</h1>
      <p className={styles.updated}>Last updated <time dateTime="2026-11-27">November 27, 2026</time></p>
      <p>Taplify uses cookies and browser storage to provide sign-in and remember your preferences.</p>

      <section>
        <h2>Necessary cookies and storage</h2>
        <dl className={`${styles.assets} mt-3`}>
          <div>
            <dt><code>better-auth.state</code></dt>
            <dd>Taplify uses this Better Auth cookie to verify your Google sign-in. It expires after 5 minutes.</dd>
          </div>
          <div>
            <dt><code>better-auth.session_token</code></dt>
            <dd>Taplify uses this Better Auth cookie to keep you signed in. It lasts 7 days and can renew while you use the service.</dd>
          </div>
          <div>
            <dt>Cookie preferences</dt>
            <dd>Taplify stores your choices in your browser&apos;s local storage. Your choices expire after {COOKIE_CONSENT_DAYS} days.</dd>
          </div>
          <div>
            <dt><code>taplify-theme</code></dt>
            <dd>Taplify uses this cookie to remember your theme choice for up to one year.</dd>
          </div>
          <div>
            <dt><code>taplify-language</code></dt>
            <dd>Taplify uses this cookie to remember your selected language for up to one year.</dd>
          </div>
        </dl>
        <p>Taplify adds the <code>__Secure-</code> prefix to the Better Auth cookie names on HTTPS.</p>
      </section>

      {ga4MeasurementId && (
        <section>
          <h2>Analytics cookies</h2>
          <p>With your permission, Google Analytics measures visits and helps Taplify improve the service.</p>
          <dl className={`${styles.assets} mt-3`}>
            <div>
              <dt><code>taplify_ga</code></dt>
              <dd>Google Analytics uses this cookie to distinguish browsers. It lasts up to {COOKIE_CONSENT_DAYS} days.</dd>
            </div>
            <div>
              <dt><code>taplify_ga_&lt;measurement ID suffix&gt;</code></dt>
              <dd>Google Analytics uses this cookie to maintain analytics session state. It lasts up to {COOKIE_CONSENT_DAYS} days.</dd>
            </div>
          </dl>
          <p>Read how <a href="https://policies.google.com/technologies/partner-sites">Google uses information from sites that use its services</a>.</p>
        </section>
      )}

      <section>
        <h2>Analytics on published Taplify pages</h2>
        <p>
          When page analytics is available, you can allow the page owner to measure visits and link clicks.
          The <code>taplify_page_analytics</code> cookie stores a browser identifier for up to 90 days.
          If you decline, <code>taplify_page_analytics_declined</code> remembers the choice for up to 90 days.
          Use Page analytics settings on a published page to change your choice.
        </p>
      </section>

      <section>
        <h2>Manage your choices</h2>
        <p>Use Manage Cookies here or in the footer to change your choices for this site in your current browser.</p>
        <ManageCookiesButton className={styles.manageCookies} />
        <p>For more about personal data, see the <Link href="/privacy-policy">Privacy Policy</Link>. For questions, email <ContactEmail />.</p>
      </section>
    </>
  );
}
