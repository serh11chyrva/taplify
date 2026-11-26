import {
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_SECONDS,
  COOKIE_CONSENT_VERSION,
  parseCookieConsent,
  type CookieConsent,
} from "@/lib/cookie-consent";
import { stopGoogleAnalytics } from "./google-tag";

const MAX_TIMEOUT_MS = 2_147_483_647;

export function createConsentStore(measurementId: string | null) {
  const listeners = new Set<() => void>();
  let consent: CookieConsent | null | undefined;
  let expiryTimer: number | undefined;
  let saveFailed = false;

  function publish(next: CookieConsent | null) {
    window.clearTimeout(expiryTimer);
    if (next && listeners.size > 0) {
      const delay = Math.min(next.expiresAt - Date.now(), MAX_TIMEOUT_MS);
      expiryTimer = window.setTimeout(refresh, delay);
    }

    if (next === consent || (next && consent && next.analytics === consent.analytics && next.expiresAt === consent.expiresAt)) {
      return;
    }
    if (!measurementId || !next?.analytics) stopGoogleAnalytics(measurementId);

    consent = next;
    for (const listener of listeners) listener();
  }

  function refresh() {
    let next: CookieConsent | null = null;
    try {
      if (!saveFailed) {
        const storage = window.localStorage;
        const value = storage.getItem(COOKIE_CONSENT_KEY);
        const stored = parseCookieConsent(value);
        if (stored && stored.expiresAt > Date.now()) {
          next = measurementId && stored.analytics === null ? null : stored;
        } else if (stored && storage.getItem(COOKIE_CONSENT_KEY) === value) {
          storage.removeItem(COOKIE_CONSENT_KEY);
        }
      }
    } catch {
      // An unavailable store has no valid consent.
    }
    publish(next);
  }

  function refreshOnStorage(event: StorageEvent) {
    if (event.key === COOKIE_CONSENT_KEY || event.key === null) refresh();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    if (listeners.size === 1) {
      window.addEventListener("storage", refreshOnStorage);
      window.addEventListener("pageshow", refresh);
      document.addEventListener("visibilitychange", refresh);
      refresh();
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        window.removeEventListener("storage", refreshOnStorage);
        window.removeEventListener("pageshow", refresh);
        document.removeEventListener("visibilitychange", refresh);
        window.clearTimeout(expiryTimer);
      }
    };
  }

  function save(analytics: boolean) {
    const next: CookieConsent = {
      version: COOKIE_CONSENT_VERSION,
      analytics: measurementId ? analytics : null,
      expiresAt: Date.now() + COOKIE_CONSENT_SECONDS * 1000,
    };

    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(next));
    } catch {
      saveFailed = true;
      publish(null);
      try {
        window.localStorage.removeItem(COOKIE_CONSENT_KEY);
      } catch {
        // Keep analytics disabled in this tab even if an old choice could not be removed.
      }
      return false;
    }

    saveFailed = false;
    publish(next);
    return true;
  }

  return {
    subscribe,
    getSnapshot: () => consent,
    save,
    allowsAnalytics: () => {
      refresh();
      return consent?.analytics === true;
    },
  };
}

export type ConsentStore = ReturnType<typeof createConsentStore>;
