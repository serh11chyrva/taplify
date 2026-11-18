import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-6 py-24">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="my-5 text-muted-foreground">This page is unavailable or has not been published.</p>
      <Button asChild><Link href="/">Back to Taplify</Link></Button>
    </main>
  );
}
