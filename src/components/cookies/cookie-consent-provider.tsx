"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { COOKIE_POLICY_PATH, type CookieConsent } from "@/lib/cookie-consent";
import type { SiteMessages } from "@/lib/i18n/en";
import { createConsentStore } from "./consent-store";
import styles from "./cookie-consent.module.css";
import { TaplifyAnalytics } from "./taplify-analytics";

const OpenPreferences = createContext<((trigger: HTMLButtonElement) => void) | null>(null);
type CookieCopy = SiteMessages["cookies"];

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

export function ManageCookiesButton({ className, label = "Manage Cookies" }: { className?: string; label?: string }) {
  const open = useContext(OpenPreferences);

  return (
    <button className={className} type="button" aria-haspopup="dialog" onClick={(event) => open?.(event.currentTarget)}>
      {label}
    </button>
  );
}

function CookieBanner({ analyticsAvailable, copy, save }: {
  analyticsAvailable: boolean;
  copy: CookieCopy;
  save: (analytics: boolean) => boolean;
}) {
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
      <section ref={banner} className={styles.banner} aria-labelledby="cookie-banner-heading">
        <div className={styles.bannerContent}>
          <div className={styles.bannerCopy}>
            <h2 id="cookie-banner-heading" className="text-base font-semibold">{copy.bannerTitle}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {copy.bannerDescription}
              {analyticsAvailable && <> {copy.bannerAnalytics}</>}
              {" "}<Link className={styles.textAction} href={COOKIE_POLICY_PATH}>{copy.policy}</Link>
            </p>
            {saveFailed && <p role="alert" className="mt-2 text-sm text-danger">{copy.saveError}</p>}
          </div>
          <div className={styles.bannerActions}>
            <ManageCookiesButton label={copy.manage} className={buttonVariants({ variant: "outline", className: styles.bannerManage })} />
            <Button type="button" variant="outline" onClick={() => choose(analyticsAvailable)}>
              {analyticsAvailable ? copy.acceptAll : copy.confirm}
            </Button>
            <Button type="button" variant="outline" onClick={() => choose(false)}>
              {copy.rejectOptional}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function CookiePreferences({ analyticsAvailable, consent, copy, save, onClose }: {
  analyticsAvailable: boolean;
  consent: CookieConsent | null | undefined;
  copy: CookieCopy;
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
      <h2 id="cookie-preferences-title" className="text-xl font-semibold">{copy.preferencesTitle}</h2>
      <p id="cookie-preferences-description" className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {copy.preferencesDescription}
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
              <h3 className="font-semibold">{copy.necessary}</h3>
              <span className="text-muted-foreground">{copy.alwaysActive}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{copy.necessaryDescription}</p>
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
                <label htmlFor="cookie-analytics" className="block cursor-pointer text-sm font-semibold">{copy.analytics}</label>
                <p id="cookie-analytics-description" className="mt-1 text-sm text-muted-foreground">
                  {copy.analyticsDescription}
                </p>
              </div>
            </div>
          )}
        </div>
        {saveFailed && <p role="alert" className="mt-3 text-sm text-danger">{copy.saveError}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => dialog.current?.close()}>{analyticsAvailable ? copy.cancel : copy.close}</Button>
          {analyticsAvailable && <Button type="submit">{copy.save}</Button>}
        </div>
      </form>
    </dialog>
  );
}

export function CookieConsentProvider({ children, copy, measurementId }: {
  children: ReactNode;
  copy: CookieCopy;
  measurementId: string | null;
}) {
  const [store] = useState(() => createConsentStore(measurementId));
  const consent = useSyncExternalStore(store.subscribe, store.getSnapshot, () => undefined);
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const analyticsAvailable = measurementId !== null;

  return (
    <OpenPreferences.Provider value={setTrigger}>
      {children}
      {consent === null && <CookieBanner analyticsAvailable={analyticsAvailable} copy={copy} save={store.save} />}
      {trigger && (
        <CookiePreferences
          analyticsAvailable={analyticsAvailable}
          consent={consent}
          copy={copy}
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
