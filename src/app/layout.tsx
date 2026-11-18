import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Taplify", template: "%s · Taplify" },
  description: "A home for your links, work, and next conversation.",
};

export const runtime = "nodejs";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
