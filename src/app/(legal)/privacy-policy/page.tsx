import type { Metadata } from "next";
import Link from "next/link";
import { COOKIE_POLICY_PATH, ga4MeasurementId } from "@/lib/cookie-consent";
import { ContactEmail } from "../contact-email";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How the Taplify demo handles personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className={styles.updated}>Last updated <time dateTime="2026-11-28">November 28, 2026</time></p>
      <p>This policy explains how the Taplify demo handles personal data when you visit, sign in, or contact us.</p>

      <section>
        <h2>Email and password</h2>
        <p>
          When you register with an email address and password, Taplify uses your email address to
          identify your account and the part before @ as your account name. Taplify stores these
          details and a password hash in MongoDB to verify future sign-ins.
        </p>
      </section>

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
        <h2>Organization invitations</h2>
        <p>
          Organization owners enter an email address to invite a teammate. Taplify uses Resend to send
          invitation and email verification messages. The invitation records the requested role and expires
          after seven days.
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
        <p>See the <Link href={COOKIE_POLICY_PATH}>Cookie Policy</Link> for details and to manage your preferences.</p>
      </section>

      {ga4MeasurementId && (
        <section>
          <h2>Analytics</h2>
          <p>
            With your permission, Google Analytics measures visits to Taplify using browser and device information
            and a random identifier stored in cookies. See the <Link href={COOKIE_POLICY_PATH}>Cookie Policy</Link>
            {" "}for details and to change your choice.
          </p>
        </section>
      )}

      <section>
        <h2>Reports for page owners</h2>
        <p>
          If you allow page analytics, Taplify records views and link clicks on published pages, the referring
          domain, and supported campaign labels. Taplify uses a browser identifier scoped to the organization
          in stored events and keeps those events for up to 90 days. Successful form submissions are counted
          in reports. You can withdraw measurement consent from Page analytics settings on a published page.
        </p>
      </section>

      <section>
        <h2>Contact forms on published pages</h2>
        <p>
          When you submit a form on a Taplify page, we store your answers and the time of submission
          and make them available to the organization that publishes the page. The organization can
          use the information to respond and can delete the inquiry from its inbox. Taplify stores
          a record of successful submissions for reporting and to avoid processing duplicate requests.
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
