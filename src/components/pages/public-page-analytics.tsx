"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type MouseEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { pageAnalyticsSeconds, type PageAnalyticsChoice } from "@/lib/dashboard/analytics-consent";
import { dashboardRequest, jsonRequest, requestMessage } from "@/lib/dashboard/request";

const preferenceKey = "taplify:page-analytics-preference";
const choiceEvent = "taplify:page-analytics-change";
const CurrentPageView = createContext<() => string | undefined>(() => undefined);

export function usePageView() {
  return useContext(CurrentPageView);
}

function subscribe(callback: () => void) {
  function storageChanged(event: StorageEvent) {
    if (!event.key || event.key === preferenceKey) callback();
  }
  window.addEventListener("storage", storageChanged);
  window.addEventListener(choiceEvent, callback);
  return () => {
    window.removeEventListener("storage", storageChanged);
    window.removeEventListener(choiceEvent, callback);
  };
}

function storedChoice() {
  try {
    const value = JSON.parse(window.localStorage.getItem(preferenceKey) ?? "null") as { expiresAt?: number; choice?: string } | null;
    if (value && typeof value.expiresAt === "number" && value.expiresAt > Date.now() &&
        (value.choice === "granted" || value.choice === "declined")) return value.choice;
  } catch {
    return undefined;
  }
}

function rememberChoice(choice: "granted" | "declined") {
  try {
    window.localStorage.setItem(preferenceKey, JSON.stringify({ choice, expiresAt: Date.now() + pageAnalyticsSeconds * 1000 }));
    window.dispatchEvent(new Event(choiceEvent));
  } catch {
    // The server cookie still records the choice when browser storage is unavailable.
  }
}

function acquisitionSource() {
  const url = new URL(window.location.href);
  let referrer: string | undefined;
  try {
    const previous = new URL(document.referrer);
    if (previous.origin !== url.origin && /^[a-z0-9.-]{1,253}$/.test(previous.hostname)) referrer = previous.hostname;
  } catch {
    // Direct traffic has no referrer.
  }
  const campaign = (key: string) => {
    const value = url.searchParams.get(key)?.trim();
    return value && /^[a-zA-Z0-9][a-zA-Z0-9 ._-]{0,79}$/.test(value) ? value : undefined;
  };
  return { referrer, utmSource: campaign("utm_source"), utmMedium: campaign("utm_medium"), utmCampaign: campaign("utm_campaign") };
}

function sendEvent(slug: string, input: object) {
  if (storedChoice() === "declined") return;
  void fetch(`/api/public/pages/${slug}/events`, {
    ...jsonRequest("POST", input), keepalive: true,
  }).catch(() => {});
}

export function PublicPageAnalytics({ initial, slug, publicationVersion, children }: {
  initial: PageAnalyticsChoice; slug: string; publicationVersion: number; children: ReactNode;
}) {
  const [decision, setDecision] = useState<PageAnalyticsChoice>();
  const stored = useSyncExternalStore(subscribe, storedChoice, () => undefined);
  const choice = stored === "declined" ? "declined" : decision ?? initial;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const visit = useRef<{ id: string; slug: string; publicationVersion: number } | null>(null);

  useEffect(() => {
    if (choice !== "granted") {
      visit.current = null;
      return;
    }
    if (visit.current?.slug === slug && visit.current.publicationVersion === publicationVersion) return;
    const id = crypto.randomUUID();
    visit.current = { id, slug, publicationVersion };
    sendEvent(slug, { type: "view", eventId: id, pageViewId: id, publicationVersion, source: acquisitionSource() });
  }, [choice, slug, publicationVersion]);

  function currentPageView() {
    return choice === "granted" && storedChoice() !== "declined" ? visit.current?.id : undefined;
  }

  function trackLink(event: MouseEvent<HTMLDivElement>) {
    if (event.type === "auxclick" && event.button !== 1) return;
    const pageViewId = currentPageView();
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-page-link]") : null;
    if (pageViewId && link?.dataset.pageLink) sendEvent(slug, {
      type: "click", eventId: crypto.randomUUID(), pageViewId, publicationVersion, linkId: link.dataset.pageLink,
    });
  }

  async function update(granted: boolean) {
    if (pending) return;
    setPending(true);
    setError("");
    if (!granted) {
      setDecision("declined");
      rememberChoice("declined");
    }
    try {
      await dashboardRequest("/api/public/pages/consent", jsonRequest("POST", { granted }));
      if (granted) {
        setDecision("granted");
        rememberChoice("granted");
      }
      dialog.current?.close();
    } catch (problem) {
      setError(requestMessage(problem));
    } finally {
      setPending(false);
    }
  }

  const controls = (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" disabled={pending} onClick={() => void update(true)}>Allow page analytics</Button>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => void update(false)}>Decline page analytics</Button>
    </div>
  );
  const description = "The page owner can measure visits and link clicks if you allow a browser identifier for 90 days.";

  return (
    <>
      <CurrentPageView.Provider value={currentPageView}>
        <div onClickCapture={trackLink} onAuxClickCapture={trackLink}>{children}</div>
      </CurrentPageView.Provider>
      <div className="mx-auto max-w-lg px-5 pb-7 text-sm">
        <button type="button" className="rounded underline underline-offset-4" onClick={() => dialog.current?.showModal()}>Page analytics settings</button>
      </div>
      {choice === "unanswered" && <aside aria-label="Page analytics" className="fixed inset-x-4 bottom-4 z-20 mx-auto max-w-lg space-y-2 rounded-xl border bg-surface p-4 text-foreground shadow-xl">
        <h2 className="font-semibold">Page analytics</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        {controls}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </aside>}
      <dialog ref={dialog} aria-label="Page analytics settings" className="m-auto w-[min(27rem,calc(100vw-2rem))] space-y-3 rounded-xl border bg-surface p-5 text-foreground shadow-xl backdrop:bg-black/60">
        <h2 className="text-lg font-semibold">Page analytics</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-sm">Current choice: {choice === "granted" ? "Allowed" : choice === "declined" ? "Declined" : "Pending"}</p>
        {controls}
        <Button type="button" variant="ghost" size="sm" onClick={() => dialog.current?.close()}>Close</Button>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </dialog>
    </>
  );
}
