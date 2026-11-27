import type { Metadata } from "next";
import Link from "next/link";
import { requireDashboardSession } from "@/server/dashboard/session";
import { SignOut } from "@/components/auth/sign-out";
import { CookieFooter } from "@/components/cookies/cookie-footer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireDashboardSession();

  return (
    <div lang="en" className="mx-auto max-w-5xl px-6 py-8">
      <header className="flex items-center justify-between gap-4 border-b pb-6">
        <Link href="/dashboard" className="text-xl font-bold">taplify<span className="text-primary">.</span></Link>
        <SignOut />
      </header>
      {children}
      <CookieFooter className="border-t pt-6" />
    </div>
  );
}
