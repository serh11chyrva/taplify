"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import styles from "./auth.module.css";

type AuthMethod = "email" | "google";
type AuthError = { method: AuthMethod; message: string };

const googleError = "Unable to continue with Google. Please try again.";
const connectionError = "Unable to connect. Please try again.";
const minPasswordLength = 8;
const maxPasswordLength = 128;
const passwordHint = `Use ${minPasswordLength} to ${maxPasswordLength} characters.`;

function emailErrorMessage(signUp: boolean, error?: { code?: string; status: number }) {
  if (error?.status === 429) return "Too many attempts. Please wait and try again.";
  switch (error?.code) {
    case "INVALID_EMAIL":
      return "Enter a valid email address.";
    case "INVALID_EMAIL_OR_PASSWORD":
      return "The email or password is incorrect.";
    case "PASSWORD_TOO_SHORT":
    case "PASSWORD_TOO_LONG":
      return passwordHint;
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Try signing in or use a different email address.";
    default:
      return signUp ? "Unable to create your account. Please try again." : "Unable to sign in. Please try again.";
  }
}

function AccountTerms({ id, signUp }: { id: string; signUp: boolean }) {
  return (
    <p className={styles.note} id={id}>
      {signUp ? "By creating an account, you agree to the " : "If you create an account with Google, you agree to the "}
      <Link className={styles.inlineLink} href="/terms-of-service">Terms of Service</Link>
      {" and acknowledge the "}
      <Link className={styles.inlineLink} href="/privacy-policy">Privacy Policy</Link>.
    </p>
  );
}

export function AuthForm({ signUp, emailEnabled, googleEnabled, googleCallbackFailed }: {
  signUp: boolean;
  emailEnabled: boolean;
  googleEnabled: boolean;
  googleCallbackFailed: boolean;
}) {
  const id = useId();
  const termsId = `${id}-terms`;
  const [pending, setPending] = useState<AuthMethod>();
  const [error, setError] = useState<AuthError | undefined>(
    googleCallbackFailed ? { method: "google", message: googleError } : undefined,
  );
  const emailAction = signUp ? "Create account" : "Sign in";
  const emailPending = signUp ? "Creating account…" : "Signing in…";

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailEnabled || pending) return;

    const fields = new FormData(event.currentTarget);
    const email = String(fields.get("email") ?? "").trim();
    const password = String(fields.get("password") ?? "");
    setPending("email");
    setError(undefined);

    try {
      const result = signUp
        ? await authClient.signUp.email({ email, password, name: email.slice(0, email.lastIndexOf("@")) })
        : await authClient.signIn.email({ email, password });

      if (result.data?.token) {
        window.location.replace("/dashboard");
        return;
      }
      setError({ method: "email", message: emailErrorMessage(signUp, result.error ?? undefined) });
    } catch {
      setError({ method: "email", message: connectionError });
    }
    setPending(undefined);
  }

  async function continueWithGoogle() {
    if (!googleEnabled || pending) return;
    setPending("google");
    setError(undefined);

    try {
      const { data } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
        errorCallbackURL: signUp ? "/sign-up" : "/sign-in",
      });
      if (data?.redirect && data.url) return;
      setError({ method: "google", message: googleError });
    } catch {
      setError({ method: "google", message: connectionError });
    }
    setPending(undefined);
  }

  return (
    <>
      <form className={styles.method} method="post" onSubmit={submitEmail}>
        <div className={styles.field}>
          <label htmlFor={`${id}-email`}>Email</label>
          <input id={`${id}-email`} name="email" type="email" autoComplete="username" required disabled={!emailEnabled} />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-password`}>Password</label>
          <input
            id={`${id}-password`}
            name="password"
            type="password"
            autoComplete={signUp ? "new-password" : "current-password"}
            minLength={signUp ? minPasswordLength : undefined}
            maxLength={maxPasswordLength}
            aria-describedby={signUp ? `${id}-password-hint` : undefined}
            required
            disabled={!emailEnabled}
          />
          {signUp && <p id={`${id}-password-hint`} className={styles.note}>{passwordHint}</p>}
        </div>
        {signUp && <AccountTerms id={termsId} signUp />}
        {error?.method === "email" && <p role="alert" className={styles.error}>{error.message}</p>}
        <Button type="submit" disabled={!emailEnabled || Boolean(pending)} aria-describedby={signUp ? termsId : undefined}>
          {pending === "email" ? emailPending : emailAction}
        </Button>
      </form>
      <p className={styles.divider}>or</p>
      <div className={styles.method}>
        {!signUp && <AccountTerms id={termsId} signUp={false} />}
        <Button
          type="button"
          variant="outline"
          disabled={!googleEnabled || Boolean(pending)}
          onClick={continueWithGoogle}
          aria-describedby={termsId}
        >
          {pending === "google" ? "Connecting…" : "Continue with Google"}
        </Button>
        {emailEnabled && !googleEnabled && <p className={styles.note}>Google sign-in is unavailable.</p>}
        {error?.method === "google" && <p role="alert" className={styles.error}>{error.message}</p>}
      </div>
    </>
  );
}
