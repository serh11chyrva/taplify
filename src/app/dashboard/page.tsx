import type { Metadata } from "next";

export const metadata: Metadata = { title: "Your pages" };

export default function DashboardPage() {
  return (
    <main className="py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Your pages</h1>
      <section className="mt-8 rounded-xl border border-dashed p-12 text-center">
        <h2 className="text-xl font-medium">A space for your next idea</h2>
        <p className="mx-auto mt-3 max-w-md leading-7 text-muted-foreground">Your pages will live here. Page creation is coming soon.</p>
      </section>
    </main>
  );
}
