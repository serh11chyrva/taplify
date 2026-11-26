import type { Metadata } from "next";
import localFont from "next/font/local";
import { CookieConsentProvider } from "@/components/cookies/cookie-consent-provider";
import { ga4MeasurementId } from "@/lib/cookie-consent";
import { getSiteMessages } from "@/lib/i18n/messages";
import { getSitePreferences } from "@/server/site-preferences";
import "./globals.css";

const geist = localFont({
  src: "./_fonts/Geist-Variable.woff2",
  weight: "100 900",
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Taplify", template: "%s · Taplify" },
  description: "A home for your links, work, and next conversation.",
};

export const runtime = "nodejs";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { theme, locale } = await getSitePreferences();
  const { cookies } = getSiteMessages(locale);

  return (
    <html lang={locale} className={geist.variable} data-theme={theme}>
      <body>
        <CookieConsentProvider measurementId={ga4MeasurementId} copy={cookies}>{children}</CookieConsentProvider>
      </body>
    </html>
  );
}
