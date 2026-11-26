export const themeCookie = "taplify-theme";
export const languageCookie = "taplify-language";
export const themes = ["system", "dark", "light"] as const;
export const locales = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "pl", label: "Polski" },
  { value: "uk", label: "Українська" },
] as const;

export type Locale = (typeof locales)[number]["value"];

export function parseTheme(value: string | undefined) {
  return themes.find((theme) => theme === value);
}

export function parseLocale(value: string | undefined) {
  return locales.find((locale) => locale.value === value)?.value;
}

export function getBrowserLocale(acceptLanguage: string | null): Locale {
  let preferred: Locale = "en";
  let bestQuality = 0;

  for (const range of (acceptLanguage ?? "").split(",")) {
    const [tag, weight] = range.split(";");
    const locale = parseLocale(tag.trim().toLowerCase().split("-")[0]);
    const quality = weight === undefined ? 1 : Number(/^q=([\d.]+)$/i.exec(weight.trim())?.[1]);
    if (locale && quality > bestQuality && quality <= 1) {
      preferred = locale;
      bestQuality = quality;
    }
  }

  return preferred;
}
