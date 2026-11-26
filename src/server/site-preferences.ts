import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";
import { getBrowserLocale, languageCookie, parseLocale, parseTheme, themeCookie } from "@/lib/site-preferences";

export const getSitePreferences = cache(async () => {
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(themeCookie)?.value) ?? "system";
  const language = parseLocale(cookieStore.get(languageCookie)?.value) ?? "auto";
  const locale = language === "auto" ? getBrowserLocale((await headers()).get("accept-language")) : language;
  return { theme, language, locale };
});
