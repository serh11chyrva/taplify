import Link from "next/link";
import { getGoogleAuthEnv, isAuthConfigured } from "@/server/env";
import { AuthForm } from "./auth-form";
import styles from "./auth.module.css";

export type AuthPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export async function AuthPage({ searchParams, signUp = false }: AuthPageProps & { signUp?: boolean }) {
  const { error } = await searchParams;
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
      />
      <p className={styles.switchPage}>
        {signUp ? "Already have an account?" : "New to Taplify?"}{" "}
        <Link className={styles.inlineLink} href={signUp ? "/sign-in" : "/sign-up"}>
          {signUp ? "Sign in" : "Sign up"}
        </Link>
      </p>
    </section>
  );
}
