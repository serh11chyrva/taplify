import { COOKIE_CONSENT_SECONDS, GA4_COOKIE_PREFIX } from "@/lib/cookie-consent";

type TagWindow = Window & {
  dataLayer?: unknown[];
  [key: `ga-disable-${string}`]: boolean | undefined;
};

const defaultConsent = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
};

const analyticsCookie = `${GA4_COOKIE_PREFIX}_ga`;

function gtag(...command: unknown[]): void;
function gtag() {
  const tagWindow = window as TagWindow;
  (tagWindow.dataLayer ??= []).push(arguments);
}

export function prepareGoogleTag() {
  gtag("consent", "default", defaultConsent);
  gtag("js", new Date());
}

export function stopGoogleAnalytics(measurementId: string | null) {
  if (measurementId) (window as TagWindow)[`ga-disable-${measurementId}`] = true;

  try {
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.split("=", 1)[0].trim();
      if (name === analyticsCookie || name.startsWith(`${analyticsCookie}_`)) {
        document.cookie = `${name}=; Max-Age=0; Path=/`;
      }
    }
  } catch {
    // The browser may block access to cookies. Collection is already disabled.
  }
}

export function recordGoogleAnalyticsPage(
  measurementId: string,
  page: { page_location: string; page_referrer: string },
  start: boolean,
) {
  (window as TagWindow)[`ga-disable-${measurementId}`] = false;

  if (start) {
    gtag("consent", "update", { ...defaultConsent, analytics_storage: "granted" });
    gtag("config", measurementId, {
      ...page,
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_prefix: GA4_COOKIE_PREFIX,
      cookie_domain: "none",
      cookie_path: "/",
      cookie_expires: COOKIE_CONSENT_SECONDS,
      cookie_update: false,
    });
  } else {
    gtag("config", measurementId, { ...page, send_page_view: false, update: true });
  }

  gtag("event", "page_view", { ...page, send_to: measurementId });
}
