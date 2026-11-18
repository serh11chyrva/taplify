import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8 sm:px-10">
      <header className="flex items-center justify-between border-b pb-6">
        <Link href="/" className="text-xl font-bold tracking-tight">taplify<span className="text-primary">.</span></Link>
        <Button asChild variant="outline" size="sm"><Link href="/login">Sign in</Link></Button>
      </header>
      <section className="my-auto max-w-2xl py-24">
        <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-primary">Your next connection starts here</p>
        <h1 className="text-5xl font-semibold leading-tight tracking-tight sm:text-7xl">One page.<br />More possibilities.</h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">Bring your links, portfolio, and conversations together in a space that feels like you.</p>
        <Button asChild size="lg" className="mt-9"><Link href="/login">Get started <ArrowUpRight className="size-4" aria-hidden="true" /></Link></Button>
      </section>
      <footer className="border-t pt-6 text-sm text-muted-foreground">Links. Work. Conversations.</footer>
    </main>
  );
}
