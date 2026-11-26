import { expect, it } from "vitest";
import { getBrowserLocale } from "@/lib/site-preferences";

it.each([
  ["FR-CA,en-US;q=0.9", "fr"],
  ["de-DE;q=0.5,pl-PL;q=0.9", "pl"],
  ["es-MX,uk-UA;q=0.9", "uk"],
  ["ja,fr;q=0,pl;q=invalid", "en"],
  [null, "en"],
])("matches the browser language preference %s to %s", (acceptLanguage, expectedLocale) => {
  expect(getBrowserLocale(acceptLanguage)).toBe(expectedLocale);
});
