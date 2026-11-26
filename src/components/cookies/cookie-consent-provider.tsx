"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { COOKIE_POLICY_PATH, type CookieConsent } from "@/lib/cookie-consent";
import { createConsentStore } from "./consent-store";
import styles from "./cookie-consent.module.css";
import { TaplifyAnalytics } from "./taplify-analytics";

const OpenPreferences = createContext<((trigger: HTMLButtonElement) => void) | null>(null);
const SAVE_ERROR = "Your preferences could not be saved. Optional cookies are off.";

function restoreFocus(trigger?: HTMLButtonElement) {
  window.requestAnimationFrame(() => {
    if (trigger?.isConnected) {
      trigger.focus({ preventScroll: true });
      return;
    }

    const main = document.querySelector("main");
    if (main && !main.hasAttribute("tabindex")) main.tabIndex = -1;
    main?.focus({ preventScroll: true });
  });
}

export function ManageCookiesButton({ className }: { className?: string }) {
  const open = useContext(OpenPreferences);

  return (
    <button className={className} type="button" aria-haspopup="dialog" onClick={(event) => open?.(event.currentTarget)}>
      Manage Cookies
    </button>
  );
}

function CookieBanner({ save }: { save: (analytics: boolean) => boolean }) {
  const space = useRef<HTMLDivElement>(null);
  const banner = useRef<HTMLElement>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    const spacer = space.current;
    const panel = banner.current;
    if (!spacer || !panel) return;

    const reserveSpace = () => spacer.style.setProperty("--cookie-banner-height", `${panel.offsetHeight}px`);

    reserveSpace();
    const observer = new ResizeObserver(reserveSpace);
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  function choose(analytics: boolean) {
    if (save(analytics)) restoreFocus();
    else setSaveFailed(true);
  }

  return (
    <>
      <div ref={space} className={styles.bannerSpace} aria-hidden="true" />
      <section ref={banner} className={`${styles.panel} ${styles.banner}`} aria-labelledby="cookie-banner-heading">
        <h2 id="cookie-banner-heading" className="text-base font-semibold">Cookies on Taplify</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Taplify uses essential cookies for sign-in. With your permission, Google Analytics helps us understand how people use Taplify.
        </p>
        {saveFailed && <p role="alert" className="mt-2 text-sm text-red-700">{SAVE_ERROR}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" className="h-auto min-h-10 px-2 py-2 whitespace-normal" onClick={() => choose(true)}>
            Accept all
          </Button>
          <Button type="button" variant="outline" className="h-auto min-h-10 px-2 py-2 whitespace-normal" onClick={() => choose(false)}>
            Reject optional
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <ManageCookiesButton className={styles.textAction} />
          <Link className={styles.textAction} href={COOKIE_POLICY_PATH}>Cookie Policy</Link>
        </div>
      </section>
    </>
  );
}

function CookiePreferences({ analyticsAvailable, consent, save, onClose }: {
  analyticsAvailable: boolean;
  consent: CookieConsent | null | undefined;
  save: (analytics: boolean) => boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<{ startingConsent: typeof consent; analytics: boolean }>();
  const [saveFailed, setSaveFailed] = useState(false);
  const analytics = draft && draft.startingConsent === consent ? draft.analytics : consent?.analytics === true;

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      className={`${styles.panel} ${styles.dialog}`}
      aria-labelledby="cookie-preferences-title"
      aria-describedby="cookie-preferences-description"
      onClose={onClose}
    >
      <h2 id="cookie-preferences-title" className="text-xl font-semibold">Cookie preferences</h2>
      <p id="cookie-preferences-description" className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Choose how Taplify uses cookies and browser storage.
      </p>
      <form onSubmit={(event) => {
        event.preventDefault();
        if (analyticsAvailable && !save(analytics)) {
          setSaveFailed(true);
          return;
        }
        dialog.current?.close();
      }}>
        <div className="mt-5 space-y-3">
          <div className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-1 text-sm">
              <h3 className="font-semibold">Necessary</h3>
              <span className="text-muted-foreground">Always active</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Protect sign-in, keep you signed in, and remember your cookie choices.</p>
          </div>
          {analyticsAvailable && (
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <input
                id="cookie-analytics"
                className="mt-0.5 size-4 shrink-0 accent-primary"
                type="checkbox"
                checked={analytics}
                aria-describedby="cookie-analytics-description"
                onChange={(event) => setDraft({ startingConsent: consent, analytics: event.currentTarget.checked })}
              />
              <div>
                <label htmlFor="cookie-analytics" className="block cursor-pointer text-sm font-semibold">Analytics</label>
                <p id="cookie-analytics-description" className="mt-1 text-sm text-muted-foreground">
                  Google Analytics measures visits and helps Taplify improve the service.
                </p>
              </div>
            </div>
          )}
        </div>
        {saveFailed && <p role="alert" className="mt-3 text-sm text-red-700">{SAVE_ERROR}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => dialog.current?.close()}>{analyticsAvailable ? "Cancel" : "Close"}</Button>
          {analyticsAvailable && <Button type="submit">Save preferences</Button>}
        </div>
      </form>
    </dialog>
  );
}

export function CookieConsentProvider({ children, measurementId }: { children: ReactNode; measurementId: string | null }) {
  const [store] = useState(() => createConsentStore(measurementId));
  const consent = useSyncExternalStore(store.subscribe, store.getSnapshot, () => undefined);
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);

  return (
    <OpenPreferences.Provider value={setTrigger}>
      {children}
      {measurementId && consent === null && <CookieBanner save={store.save} />}
      {trigger && (
        <CookiePreferences
          analyticsAvailable={measurementId !== null}
          consent={consent}
          save={store.save}
          onClose={() => {
            setTrigger(null);
            restoreFocus(trigger);
          }}
        />
      )}
      {measurementId && <TaplifyAnalytics measurementId={measurementId} allowed={consent?.analytics === true} store={store} />}
    </OpenPreferences.Provider>
  );
}
