import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail } from "../contact-email";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using the Taplify demonstration project and contacting its maintainer.",
};

export default function TermsOfServicePage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className={styles.updated}>Last updated <time dateTime="2026-11-26">November 26, 2026</time></p>

      <section>
        <h2>Using the demo</h2>
        <p>
          Taplify is a demonstration project intended for exploration and evaluation.
          It is unsuitable for production workflows and day-to-day business operations.
        </p>
      </section>

      <section>
        <h2>Availability and functionality</h2>
        <p>
          Taplify is provided as is, without guarantees of availability or functionality.
          Features may change or become unavailable as the project evolves.
        </p>
      </section>

      <section>
        <h2>Contact and content removal</h2>
        <p>
          Email <ContactEmail /> for any questions or requests, including a request
          to remove content. For content removal, include the URL of the content and a brief description.
          For personal data requests, see the <Link href="/privacy-policy">Privacy Policy</Link>.
        </p>
      </section>
    </>
  );
}
