import Link from "next/link";
import { CookieFooter } from "@/components/cookies/cookie-footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24">
      <main>
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="my-5 text-muted-foreground">This page is unavailable or has not been published.</p>
        <Button asChild><Link href="/">Back to Taplify</Link></Button>
      </main>
      <CookieFooter className="mt-10 border-t pt-6" />
    </div>
  );
}
