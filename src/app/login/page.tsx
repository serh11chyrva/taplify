import type { Metadata } from "next";
import Link from "next/link";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { CookieFooter } from "@/components/cookies/cookie-footer";
import { isAuthConfigured } from "@/server/env";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div lang="en" className="flex min-h-dvh flex-col">
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <section className="w-full max-w-sm rounded-xl border bg-surface p-8 shadow-sm">
          <Link href="/" className="text-lg font-bold">taplify<span className="text-primary">.</span></Link>
          <h1 className="mt-8 text-3xl font-semibold tracking-tight">Welcome to Taplify</h1>
          <p className="mb-8 mt-3 leading-6 text-muted-foreground">A little space for everything you do. Sign in to make it yours.</p>
          <GoogleSignIn enabled={isAuthConfigured()} />
        </section>
      </main>
      <CookieFooter className="justify-center px-6 pb-6" />
    </div>
  );
}
