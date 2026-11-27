"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PageTabs({ base, tabs }: { base: string; tabs: { label: string; segment: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Page sections" className="mb-6 flex gap-1 overflow-x-auto rounded-lg border bg-surface p-1 text-sm">
      {tabs.map(({ label, segment }) => {
        const href = `${base}/${segment}`;
        const current = pathname === href || pathname.startsWith(`${href}/`);
        return <Link key={segment} href={href} aria-current={current ? "page" : undefined}
          className="shrink-0 rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted aria-[current=page]:bg-muted aria-[current=page]:text-foreground">
          {label}
        </Link>;
      })}
    </nav>
  );
}
