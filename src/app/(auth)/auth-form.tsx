"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import styles from "./auth.module.css";

type AuthMethod = "email" | "google";
type AuthError = { method: AuthMethod; message: string; field?: "confirmPassword" };

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

function PasswordField({ id, name, label, autoComplete, disabled, minLength, hint, error, onChange }: {
  id: string;
  name: "password" | "confirmPassword";
  label: string;
  autoComplete: "current-password" | "new-password";
  disabled: boolean;
  minLength?: number;
  hint?: string;
  error?: string;
  onChange: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const VisibilityIcon = visible ? EyeOff : Eye;
  const fieldName = name === "confirmPassword" ? "password confirmation" : "password";
  const description = error ?? hint;
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.passwordControl}>
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          placeholder="••••••••"
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          minLength={minLength}
          maxLength={maxPasswordLength}
          aria-describedby={descriptionId}
          aria-invalid={error ? true : undefined}
          required
          disabled={disabled}
          onChange={onChange}
        />
        <button
          className={styles.passwordToggle}
          type="button"
          aria-label={`${visible ? "Hide" : "Show"} ${fieldName}`}
          aria-controls={id}
          disabled={disabled}
          onClick={() => setVisible((isVisible) => !isVisible)}
        >
          <VisibilityIcon size={18} aria-hidden="true" />
        </button>
      </div>
      {description && <p id={descriptionId} role={error ? "alert" : undefined} className={error ? styles.error : styles.note}>{description}</p>}
    </div>
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
  const confirmationId = `${id}-confirm-password`;
  const [pending, setPending] = useState<AuthMethod>();
  const [error, setError] = useState<AuthError | undefined>(
    googleCallbackFailed ? { method: "google", message: googleError } : undefined,
  );
  const emailAction = signUp ? "Create account" : "Sign in";
  const emailPending = signUp ? "Creating account…" : "Signing in…";
  const confirmationError = error?.field === "confirmPassword" ? error.message : undefined;

  function clearConfirmationError() {
    if (confirmationError) setError(undefined);
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailEnabled || pending) return;

    const fields = new FormData(event.currentTarget);
    const email = String(fields.get("email") ?? "").trim();
    const password = String(fields.get("password") ?? "");
    if (signUp && password !== fields.get("confirmPassword")) {
      setError({ method: "email", field: "confirmPassword", message: "Passwords do not match." });
      document.getElementById(confirmationId)?.focus();
      return;
    }
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
          <input id={`${id}-email`} name="email" type="email" placeholder="you@example.com" autoComplete="username" required disabled={!emailEnabled} />
        </div>
        <PasswordField
          id={`${id}-password`}
          name="password"
          label="Password"
          autoComplete={signUp ? "new-password" : "current-password"}
          minLength={signUp ? minPasswordLength : undefined}
          hint={signUp ? passwordHint : undefined}
          disabled={!emailEnabled}
          onChange={clearConfirmationError}
        />
        {signUp && (
          <PasswordField
            id={confirmationId}
            name="confirmPassword"
            label="Confirm password"
            autoComplete="new-password"
            error={confirmationError}
            disabled={!emailEnabled}
            onChange={clearConfirmationError}
          />
        )}
        {signUp && <AccountTerms id={termsId} signUp />}
        {error?.method === "email" && !error.field && <p role="alert" className={styles.error}>{error.message}</p>}
        <Button className={styles.primaryAction} type="submit" disabled={!emailEnabled || Boolean(pending)} aria-describedby={signUp ? termsId : undefined}>
          {pending === "email" ? emailPending : emailAction}
        </Button>
      </form>
      <p className={styles.divider}>or</p>
      <div className={styles.method}>
        <Button
          className={styles.googleAction}
          type="button"
          variant="outline"
          disabled={!googleEnabled || Boolean(pending)}
          onClick={continueWithGoogle}
          aria-describedby={termsId}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
          </svg>
          {pending === "google" ? "Connecting…" : "Continue with Google"}
        </Button>
        {!signUp && <AccountTerms id={termsId} signUp={false} />}
        {emailEnabled && !googleEnabled && <p className={styles.note}>Google sign-in is unavailable.</p>}
        {error?.method === "google" && <p role="alert" className={styles.error}>{error.message}</p>}
      </div>
    </>
  );
}
