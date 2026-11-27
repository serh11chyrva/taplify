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
  const platformPage = !pathname.startsWith("/p/") && !pathname.startsWith("/dashboard/invitations/");
  const [ready, setReady] = useState(false);
  const prepared = useRef(false);
  const lastPage = useRef<{ pathname: string; location: string } | null>(null);

  useLayoutEffect(() => {
    if (allowed && platformPage && !prepared.current) {
      prepareGoogleTag();
      prepared.current = true;
    }
  }, [allowed, platformPage]);

  useEffect(() => {
    if (!allowed || !platformPage) {
      lastPage.current = null;
      return;
    }
    if (!ready || lastPage.current?.pathname === pathname || !store.allowsAnalytics()) return;

    const origin = window.location.origin;
    const measuredPath = pathname.startsWith("/dashboard/") ? "/dashboard" : measuredPaths.has(pathname) ? pathname : "/404";
    const location = `${origin}${measuredPath}`;
    const referrer = lastPage.current?.location ?? (document.referrer ? new URL(document.referrer).origin : "");
    recordGoogleAnalyticsPage(measurementId, {
      page_location: location,
      page_referrer: referrer,
    }, lastPage.current === null);
    lastPage.current = { pathname, location };
  }, [allowed, measurementId, pathname, platformPage, ready, store]);

  return allowed && platformPage ? (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      strategy="afterInteractive"
      onReady={() => setReady(true)}
    />
  ) : null;
}
