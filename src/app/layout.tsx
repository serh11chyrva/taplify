import type { Metadata } from "next";
import localFont from "next/font/local";
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
  return <html lang="en" className={geist.variable}><body>{children}</body></html>;
}
