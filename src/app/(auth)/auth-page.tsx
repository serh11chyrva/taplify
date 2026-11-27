import Link from "next/link";
import { authDestination, dashboardDestination } from "@/lib/dashboard-destination";
import { getGoogleAuthEnv, isAuthConfigured } from "@/server/env";
import { AuthForm } from "./auth-form";
import styles from "./auth.module.css";

export type AuthPageProps = {
  searchParams: Promise<{ error?: string | string[]; next?: string | string[] }>;
};

export async function AuthPage({ searchParams, signUp = false }: AuthPageProps & { signUp?: boolean }) {
  const { error, next } = await searchParams;
  const destination = dashboardDestination(next);
  const emailEnabled = isAuthConfigured();

  return (
    <section className={styles.card} aria-labelledby="auth-title">
      <h1 id="auth-title">{signUp ? "Create an account" : "Sign in"}</h1>
      {!emailEnabled && <p className={styles.note}>Authentication is temporarily unavailable.</p>}
      <AuthForm
        signUp={signUp}
        emailEnabled={emailEnabled}
        googleEnabled={emailEnabled && Boolean(getGoogleAuthEnv())}
        googleCallbackFailed={Boolean(error)}
        destination={destination}
      />
      <p className={styles.switchPage}>
        {signUp ? "Already have an account?" : "New to Taplify?"}{" "}
        <Link className={styles.inlineLink} href={authDestination(signUp ? "/sign-in" : "/sign-up", destination)}>
          {signUp ? "Sign in" : "Sign up"}
        </Link>
      </p>
    </section>
  );
}
