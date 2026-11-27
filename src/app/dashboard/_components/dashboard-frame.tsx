"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, CircleUserRound, Files, LayoutDashboard, Menu, PanelLeftClose, PanelLeftOpen, Settings2, X } from "lucide-react";
import { TaplifyIcon } from "@/app/_landing/taplify-icon";
import { Button } from "@/components/ui/button";
import { SignOut } from "@/components/auth/sign-out";
import { CookieFooter } from "@/components/cookies/cookie-footer";
import { organizationApiPath, organizationPath, type OrganizationSummary } from "@/lib/dashboard/organizations";
import { pagePath, type PageSummary } from "@/lib/dashboard/pages";
import { dashboardRequest, requestMessage } from "@/lib/dashboard/request";
import { cn } from "@/lib/utils";

type Account = { name: string; email: string };

export function DashboardFrame({ organization, organizations, account, projects, children }: {
  organization: OrganizationSummary;
  organizations: OrganizationSummary[];
  account: Account;
  projects: PageSummary[];
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const mobileMenu = useRef<HTMLDialogElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");
  const home = organizationPath(organization.id);
  const pageId = pathname.startsWith(`${home}/pages/`) ? pathname.split("/")[4] : undefined;
  const page = projects.find((item) => item.id === pageId);
  const current = page?.name ?? (pathname.endsWith("/settings") ? "Settings" : pathname.endsWith("/new") ? "New page" : "Dashboard");

  async function switchOrganization(nextId: string) {
    if (switching || nextId === organization.id) return;
    setSwitching(true);
    setError("");
    try {
      await dashboardRequest(`${organizationApiPath(nextId)}/select`, { method: "POST" });
      mobileMenu.current?.close();
      router.push(organizationPath(nextId));
      router.refresh();
    } catch (problem) {
      setError(requestMessage(problem));
    } finally {
      setSwitching(false);
    }
  }

  function navigation(compact: boolean) {
    return (
      <div className="flex min-h-full flex-col gap-6 p-3">
        <Link href="/dashboard" prefetch={false} className="flex h-10 items-center gap-2.5 px-2 font-black italic" aria-label="Taplify dashboard" onClick={() => mobileMenu.current?.close()}>
          <TaplifyIcon className="size-6 shrink-0" />{compact ? null : "taplify"}
        </Link>
        <nav aria-label="Dashboard" className="grid gap-1">
          {!compact && <p className="px-2 pb-1 text-xs text-muted-foreground">Workspace</p>}
          <Link href={home} aria-current={pathname === home ? "page" : undefined} title={compact ? "Dashboard" : undefined}
            className="dashboard-nav-link" onClick={() => mobileMenu.current?.close()}>
            <LayoutDashboard size={16} aria-hidden="true" /><span className={compact ? "sr-only" : ""}>Dashboard</span>
          </Link>
        </nav>
        {projects.length > 0 && (
          <nav aria-label="Projects" className="grid gap-1 border-t pt-3">
            {!compact && <p className="px-2 pb-1 text-xs text-muted-foreground">Projects</p>}
            {projects.map((project) => (
              <Link key={project.id} href={`${pagePath(organization.id, project.id)}/focus`} aria-current={project.id === pageId ? "true" : undefined}
                title={compact ? project.name : undefined} className="dashboard-nav-link" onClick={() => mobileMenu.current?.close()}>
                <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded border bg-muted text-xs">{project.name.slice(0, 1).toUpperCase()}</span>
                <span className={compact ? "sr-only" : "truncate"}>{project.name}</span>
              </Link>
            ))}
          </nav>
        )}
        <div className="mt-auto grid gap-2 border-t pt-3">
          <Link href={`${home}/settings`} title={compact ? "Organization settings" : undefined} className="dashboard-nav-link"
            aria-current={pathname === `${home}/settings` ? "page" : undefined} onClick={() => mobileMenu.current?.close()}>
            <Settings2 size={16} aria-hidden="true" /><span className={compact ? "sr-only" : ""}>Organization settings</span>
          </Link>
          {!compact && (
            <label className="grid gap-1 rounded-lg border bg-surface p-2 text-xs text-muted-foreground">
              Organization
              <select className="w-full rounded bg-surface text-sm font-semibold text-foreground" value={organization.id}
                disabled={switching} onChange={(event) => void switchOrganization(event.target.value)}>
                {organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          )}
          {error && <p role="alert" className="text-xs text-danger">{error}</p>}
          <details className="group rounded-lg border bg-surface">
            <summary className="flex cursor-pointer list-none items-center gap-2 p-2 text-sm font-medium" title={compact ? "Account" : undefined}>
              <CircleUserRound size={17} className="shrink-0" aria-hidden="true" />
              <span className={compact ? "sr-only" : "truncate"}>{account.name || "Account"}</span>
            </summary>
            <div className={cn("p-2", compact && "absolute z-10 ml-9 min-w-36 rounded-lg border bg-surface shadow-xl")}>
              <p className="mb-2 truncate text-xs text-muted-foreground">{account.email}</p>
              <SignOut />
            </div>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-theme flex min-h-dvh bg-background text-foreground lg:gap-3 lg:p-2.5" lang="en">
      <aside className={cn("sticky top-2.5 hidden h-[calc(100dvh-1.25rem)] shrink-0 lg:block", collapsed ? "w-14" : "w-52")}>
        <div className={cn("h-full", !collapsed && "overflow-y-auto")}>{navigation(collapsed)}</div>
      </aside>
      <dialog ref={mobileMenu} className="dashboard-drawer" aria-label="Dashboard navigation"
        onClick={(event) => { if (event.target === event.currentTarget) mobileMenu.current?.close(); }}>
        <div className="flex justify-end border-b p-2">
          <Button type="button" size="icon" variant="ghost" aria-label="Close navigation" onClick={() => mobileMenu.current?.close()}>
            <X size={18} aria-hidden="true" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto">{navigation(false)}</div>
      </dialog>
      <div className="min-w-0 flex-1 lg:rounded-xl lg:border">
        <header className="flex min-h-13 items-center gap-3 border-b bg-surface px-4 lg:rounded-t-xl lg:px-9">
          <Button type="button" size="sm" variant="ghost" className="lg:hidden" aria-label="Open navigation" onClick={() => mobileMenu.current?.showModal()}>
            <Menu size={17} aria-hidden="true" />
          </Button>
          <Button type="button" size="sm" variant="outline" className="hidden h-8 px-2 lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <PanelLeftOpen size={15} aria-hidden="true" /> : <PanelLeftClose size={15} aria-hidden="true" />}
          </Button>
          <Link href={home} className="min-w-0 truncate text-sm text-muted-foreground">{organization.name}</Link>
          <ChevronRight size={14} aria-hidden="true" className="shrink-0 text-muted-foreground" />
          <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
            {page && <Files size={14} aria-hidden="true" className="shrink-0" />}<span className="truncate">{current}</span>
          </span>
        </header>
        <main id="dashboard-content" className="mx-auto min-h-[70vh] max-w-7xl px-4 py-8 lg:px-9 lg:py-10">{children}</main>
        <CookieFooter className="mx-4 border-t py-4 text-muted-foreground lg:mx-9" />
      </div>
    </div>
  );
}
