import type { Metadata } from "next";
import { AuthPage, type AuthPageProps } from "../auth-page";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage({ searchParams }: AuthPageProps) {
  return <AuthPage searchParams={searchParams} />;
}
