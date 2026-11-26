export const themeCookie = "taplify-theme";
export const themes = ["system", "dark", "light"] as const;

export function parseTheme(value: string | undefined) {
  return themes.find((theme) => theme === value);
}
