"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOut() {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    setError(false);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Sign-out failed");
      router.replace("/login");
      router.refresh();
    } catch {
      setError(true);
      setPending(false);
    }
  }

  return <div><Button variant="outline" size="sm" onClick={signOut} disabled={pending}>Sign out</Button>{error && <p role="alert" className="mt-2 text-sm text-red-700">Please try again.</p>}</div>;
}
