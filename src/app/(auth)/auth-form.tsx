"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import styles from "./auth.module.css";

type AuthMethod = "email" | "google";
type PasswordName = "password" | "confirmPassword";
type AuthError = { method: AuthMethod; message: string; field?: PasswordName };

const googleError = "Unable to continue with Google. Please try again.";
const connectionError = "Unable to connect. Please try again.";
const minPasswordLength = 8;
const maxPasswordLength = 128;
const passwordLengthError = `Use ${minPasswordLength} to ${maxPasswordLength} characters for your password.`;

function emailErrorMessage(signUp: boolean, error?: { code?: string; status: number }) {
  if (error?.status === 429) return "Too many attempts. Please wait and try again.";
  switch (error?.code) {
    case "INVALID_EMAIL":
      return "Enter a valid email address.";
    case "INVALID_EMAIL_OR_PASSWORD":
      return "The email or password is incorrect.";
    case "PASSWORD_TOO_SHORT":
    case "PASSWORD_TOO_LONG":
      return passwordLengthError;
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

function PasswordField({
  id, name, label, autoComplete, disabled, maxLength, error, visible,
  revealLabel, revealedInputIds, onRevealChange, onChange,
}: {
  id: string;
  name: PasswordName;
  label: string;
  autoComplete: "current-password" | "new-password";
  disabled: boolean;
  maxLength?: number;
  error?: string;
  visible: boolean;
  revealLabel: string;
  revealedInputIds: string;
  onRevealChange: (field: PasswordName, reveal: boolean) => void;
  onChange: (field: PasswordName) => void;
}) {
  const VisibilityIcon = visible ? EyeOff : Eye;
  const errorId = error ? `${id}-error` : undefined;

  function revealWithPointer(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    onRevealChange(name, true);
  }

  function revealWithKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    if (!event.repeat) onRevealChange(name, event.type === "keydown");
  }

  function hidePassword() {
    onRevealChange(name, false);
  }

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
          maxLength={maxLength}
          aria-describedby={errorId}
          aria-invalid={error ? true : undefined}
          required
          disabled={disabled}
          onChange={() => onChange(name)}
        />
        <button
          className={styles.passwordToggle}
          type="button"
          aria-label={revealLabel}
          aria-controls={revealedInputIds}
          title={revealLabel}
          disabled={disabled}
          onPointerDown={revealWithPointer}
          onPointerUp={hidePassword}
          onPointerCancel={hidePassword}
          onLostPointerCapture={hidePassword}
          onKeyDown={revealWithKeyboard}
          onKeyUp={revealWithKeyboard}
          onBlur={hidePassword}
          onContextMenu={(event) => event.preventDefault()}
        >
          <VisibilityIcon size={18} aria-hidden="true" />
        </button>
      </div>
      {error && <p id={errorId} role="alert" className={styles.error}>{error}</p>}
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
  const passwordId = `${id}-password`;
  const confirmationId = `${id}-confirm-password`;
  const [pending, setPending] = useState<AuthMethod>();
  const [revealedBy, setRevealedBy] = useState<PasswordName>();
  const [error, setError] = useState<AuthError | undefined>(
    googleCallbackFailed ? { method: "google", message: googleError } : undefined,
  );
  const emailAction = signUp ? "Create account" : "Sign in";
  const emailPending = signUp ? "Creating account…" : "Signing in…";

  useEffect(() => {
    const hidePasswords = () => setRevealedBy(undefined);
    window.addEventListener("blur", hidePasswords);
    document.addEventListener("visibilitychange", hidePasswords);
    return () => {
      window.removeEventListener("blur", hidePasswords);
      document.removeEventListener("visibilitychange", hidePasswords);
    };
  }, []);

  function changePasswordVisibility(field: PasswordName, reveal: boolean) {
    if (reveal) {
      setRevealedBy(field);
    } else {
      setRevealedBy((current) => current === field ? undefined : current);
    }
  }

  function clearPasswordError(field: PasswordName) {
    if (error?.field && (field === "password" || error.field === "confirmPassword")) setError(undefined);
  }

  const passwordFieldProps = {
    visible: revealedBy !== undefined,
    revealLabel: signUp ? "Hold to show passwords" : "Hold to show password",
    revealedInputIds: signUp ? `${passwordId} ${confirmationId}` : passwordId,
    onRevealChange: changePasswordVisibility,
    onChange: clearPasswordError,
    disabled: !emailEnabled,
  };

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailEnabled || pending) return;

    const fields = new FormData(event.currentTarget);
    const email = String(fields.get("email") ?? "").trim();
    const password = String(fields.get("password") ?? "");
    if (signUp && (password.length < minPasswordLength || password.length > maxPasswordLength)) {
      setError({ method: "email", field: "password", message: passwordLengthError });
      document.getElementById(passwordId)?.focus();
      return;
    }
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
          {...passwordFieldProps}
          id={passwordId}
          name="password"
          label="Password"
          autoComplete={signUp ? "new-password" : "current-password"}
          maxLength={signUp ? undefined : maxPasswordLength}
          error={error?.field === "password" ? error.message : undefined}
        />
        {signUp && (
          <PasswordField
            {...passwordFieldProps}
            id={confirmationId}
            name="confirmPassword"
            label="Confirm password"
            autoComplete="new-password"
            error={error?.field === "confirmPassword" ? error.message : undefined}
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
          <svg className="shrink-0" width="20" height="20" viewBox="-1 -1 26 26" fill="currentColor" aria-hidden="true">
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
