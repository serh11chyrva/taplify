export const COOKIE_POLICY_PATH = "/cookie-policy";
export const COOKIE_CONSENT_KEY = "taplify:cookie-consent";
export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_DAYS = 180;
export const COOKIE_CONSENT_SECONDS = COOKIE_CONSENT_DAYS * 24 * 60 * 60;
export const GA4_COOKIE_PREFIX = "taplify";

export type CookieConsent = {
  version: number;
  analytics: boolean;
  expiresAt: number;
};

const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim();
export const ga4MeasurementId = measurementId && /^G-[A-Z0-9]+$/.test(measurementId) ? measurementId : null;

export function parseCookieConsent(value: string | null): CookieConsent | null {
  if (value === null) return null;

  try {
    const consent = JSON.parse(value) as Partial<CookieConsent> | null;
    if (
      consent?.version === COOKIE_CONSENT_VERSION &&
      typeof consent.analytics === "boolean" &&
      typeof consent.expiresAt === "number" &&
      Number.isSafeInteger(consent.expiresAt)
    ) {
      return { version: consent.version, analytics: consent.analytics, expiresAt: consent.expiresAt };
    }
  } catch {
    return null;
  }

  return null;
}
