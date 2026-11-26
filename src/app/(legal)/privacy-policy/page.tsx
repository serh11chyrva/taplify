import type { Metadata } from "next";
import { ContactEmail } from "../contact-email";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How the Taplify demo handles sign-in, session, and contact data.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className={styles.updated}>Last updated <time dateTime="2026-11-26">November 26, 2026</time></p>
      <p>This policy explains how the Taplify demo handles personal data when you visit, sign in, or contact us.</p>

      <section>
        <h2>Google sign-in</h2>
        <p>
          When you sign in with Google, Taplify receives your Google account identifier, name,
          email address and verification status, and a profile picture when provided. Taplify
          uses these details to create and identify your account and sign you in. Account records
          and the sign-in tokens Google returns are stored in MongoDB.
        </p>
      </section>

      <section>
        <h2>Sessions and cookies</h2>
        <p>
          Taplify uses cookies to protect the sign-in process and keep you signed in. Session
          records are stored in MongoDB and may include your IP address and browser information.
          Sessions expire after a limited period and can be renewed while you use the site.
          Signing out ends your current session.
        </p>
      </section>

      <section>
        <h2>Hosting and diagnostics</h2>
        <p>
          Vercel hosts Taplify and may process technical request data, such as the page requested,
          IP address, and browser information, to serve the site and diagnose errors. Log retention
          depends on the hosting configuration.
        </p>
      </section>

      <section>
        <h2>Contact and data deletion</h2>
        <p>
          Taplify keeps account data while your account exists. If you email us, we use your email
          address and the contents of your message to respond and handle your request.
        </p>
        <p>
          Email <ContactEmail /> for privacy questions or to request deletion of your account or
          other personal data held by Taplify. Include the email address associated with your account,
          if applicable, and enough detail to identify the data.
        </p>
      </section>
    </>
  );
}
