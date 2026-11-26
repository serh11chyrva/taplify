import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { parseTheme, themeCookie } from "@/lib/site-preferences";

export const getSiteTheme = cache(async () => {
  const cookieStore = await cookies();
  return parseTheme(cookieStore.get(themeCookie)?.value) ?? "system";
});
