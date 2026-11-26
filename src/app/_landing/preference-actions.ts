"use server";

import { cookies } from "next/headers";
import { parseTheme, themeCookie } from "@/lib/site-preferences";

export async function saveTheme(value: string) {
  const theme = parseTheme(value);
  if (!theme) throw new Error("Invalid theme.");

  (await cookies()).set(themeCookie, theme, {
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
