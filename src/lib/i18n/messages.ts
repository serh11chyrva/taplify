import "server-only";

import type { Locale } from "@/lib/site-preferences";
import { german } from "./de";
import { english, type SiteMessages, type SiteTranslation } from "./en";
import { french } from "./fr";
import { polish } from "./pl";
import { ukrainian } from "./uk";

const translations: Partial<Record<Locale, SiteTranslation>> = {
  fr: french,
  de: german,
  pl: polish,
  uk: ukrainian,
};

export function getSiteMessages(locale: Locale): SiteMessages {
  const translation = translations[locale];
  return {
    landing: { ...english.landing, ...translation?.landing },
    footer: { ...english.footer, ...translation?.footer },
    cookies: { ...english.cookies, ...translation?.cookies },
    preferences: { ...english.preferences, ...translation?.preferences },
  };
}
