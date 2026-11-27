import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOut } from "@/components/auth/sign-out";
import { CookieFooter } from "@/components/cookies/cookie-footer";
import { lastOrganizationCookie, organizationPath } from "@/lib/dashboard/organizations";
import { dashboardFeatures } from "@/server/dashboard/features";
import { resolveOrganization } from "@/server/dashboard/organizations";
import { requireDashboardSession } from "@/server/dashboard/session";

export const metadata: Metadata = { title: "Your pages" };

export default async function DashboardPage() {
  const session = await requireDashboardSession();
  if (dashboardFeatures().dashboard) {
    const selected = (await cookies()).get(lastOrganizationCookie)?.value;
    redirect(organizationPath(await resolveOrganization(session.user.id, selected)));
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="flex items-center justify-between gap-4 border-b pb-6">
        <Link href="/" className="text-xl font-bold">taplify<span className="text-primary">.</span></Link>
        <SignOut />
      </header>
      <main className="py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Your pages</h1>
        <section className="mt-8 rounded-xl border border-dashed p-12 text-center">
          <h2 className="text-xl font-medium">A space for your next idea</h2>
          <p className="mx-auto mt-3 max-w-md leading-7 text-muted-foreground">Your pages will live here. Page creation is coming soon.</p>
        </section>
      </main>
      <CookieFooter className="border-t pt-6" />
    </div>
  );
}
