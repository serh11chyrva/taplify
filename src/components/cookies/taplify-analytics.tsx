"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { COOKIE_POLICY_PATH } from "@/lib/cookie-consent";
import type { ConsentStore } from "./consent-store";
import { prepareGoogleTag, recordGoogleAnalyticsPage } from "./google-tag";

const measuredPaths = new Set([
  "/", "/dashboard", "/licenses", "/privacy-policy", "/sign-in", "/sign-up", "/terms-of-service", COOKIE_POLICY_PATH,
]);

export function TaplifyAnalytics({
  measurementId, allowed, store,
}: {
  measurementId: string;
  allowed: boolean;
  store: ConsentStore;
}) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const prepared = useRef(false);
  const lastPage = useRef<{ pathname: string; location: string } | null>(null);

  useLayoutEffect(() => {
    if (allowed && !prepared.current) {
      prepareGoogleTag();
      prepared.current = true;
    }
  }, [allowed]);

  useEffect(() => {
    if (!allowed) {
      lastPage.current = null;
      return;
    }
    if (!ready || lastPage.current?.pathname === pathname || !store.allowsAnalytics()) return;

    const origin = window.location.origin;
    const location = `${origin}${measuredPaths.has(pathname) ? pathname : "/404"}`;
    const referrer = lastPage.current?.location ?? (document.referrer ? new URL(document.referrer).origin : "");
    recordGoogleAnalyticsPage(measurementId, {
      page_location: location,
      page_referrer: referrer,
    }, lastPage.current === null);
    lastPage.current = { pathname, location };
  }, [allowed, measurementId, pathname, ready, store]);

  return allowed ? (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      strategy="afterInteractive"
      onReady={() => setReady(true)}
    />
  ) : null;
}
