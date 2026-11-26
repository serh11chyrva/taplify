import type { Metadata } from "next";
import localFont from "next/font/local";
import { CookieConsentProvider } from "@/components/cookies/cookie-consent-provider";
import { ga4MeasurementId } from "@/lib/cookie-consent";
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <body>
        <CookieConsentProvider measurementId={ga4MeasurementId}>{children}</CookieConsentProvider>
      </body>
    </html>
  );
}
