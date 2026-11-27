import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/server/services/session";
import { SignOut } from "@/components/auth/sign-out";
import { CookieFooter } from "@/components/cookies/cookie-footer";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession(await headers());
  if (!session) redirect("/sign-in");

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
