"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function GoogleSignIn({ enabled }: { enabled: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function signIn() {
    setPending(true);
    setError(undefined);
    try {
      const result = await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
      if (result.error) {
        setError("Unable to sign in. Please try again.");
        setPending(false);
      }
    } catch {
      setError("Unable to connect. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button className="w-full" disabled={!enabled || pending} onClick={signIn}>
        {pending ? "Connecting…" : "Continue with Google"}
      </Button>
      {!enabled && <p className="text-sm text-muted-foreground">Sign-in is not available yet. Please check back soon.</p>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
