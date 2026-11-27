"use client";

import { Button } from "@/components/ui/button";

export default function WorkspaceError({ reset }: { reset: () => void }) {
  return (
    <section className="space-y-3 rounded-xl border bg-surface p-6">
      <h1 className="text-xl font-semibold">We could not load this workspace</h1>
      <p className="text-muted-foreground">Try again in a moment.</p>
      <Button type="button" variant="outline" onClick={reset}>Try again</Button>
    </section>
  );
}
