import type { Metadata } from "next";
import { AuthPage, type AuthPageProps } from "../auth-page";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage({ searchParams }: AuthPageProps) {
  return <AuthPage searchParams={searchParams} signUp />;
}
