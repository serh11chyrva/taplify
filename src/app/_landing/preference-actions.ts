"use server";

import { cookies } from "next/headers";
import { languageCookie, parseLocale, parseTheme, themeCookie } from "@/lib/site-preferences";

const cookieOptions = {
  httpOnly: true,
  maxAge: 365 * 24 * 60 * 60,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function saveTheme(value: string) {
  const theme = parseTheme(value);
  if (!theme) throw new Error("Invalid theme.");

  (await cookies()).set(themeCookie, theme, cookieOptions);
}

export async function saveLanguage(value: string) {
  const cookieStore = await cookies();
  if (value === "auto") {
    cookieStore.delete(languageCookie);
    return;
  }

  const locale = parseLocale(value);
  if (!locale) throw new Error("Invalid language.");

  cookieStore.set(languageCookie, locale, cookieOptions);
}
