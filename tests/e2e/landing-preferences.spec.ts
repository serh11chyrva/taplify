import { expect, test } from "@playwright/test";

test("follows the system theme and remembers an explicit theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.getByRole("button", { name: "Reject optional" }).click();

  const footer = page.getByRole("contentinfo");
  const theme = footer.getByRole("group", { name: "Theme" });
  const system = theme.getByRole("button", { name: "System" });
  const light = theme.getByRole("button", { name: "Light" });
  const dark = theme.getByRole("button", { name: "Dark" });
  await expect(system).toHaveAttribute("aria-pressed", "true");
  await expect(footer).toHaveCSS("background-color", "rgb(248, 246, 251)");

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(footer).toHaveCSS("background-color", "rgb(0, 0, 0)");

  await light.click();
  await expect(footer).toHaveCSS("background-color", "rgb(248, 246, 251)");
  await page.reload();
  await expect(light).toHaveAttribute("aria-pressed", "true");
  await expect(footer).toHaveCSS("background-color", "rgb(248, 246, 251)");

  await dark.click();
  await page.emulateMedia({ colorScheme: "light" });
  await expect(footer).toHaveCSS("background-color", "rgb(0, 0, 0)");

  await system.click();
  await expect(footer).toHaveCSS("background-color", "rgb(248, 246, 251)");
});

test.describe("landing language", () => {
  test.use({ locale: "fr-CA", viewport: { width: 375, height: 812 } });

  test("uses the browser language and remembers a manual choice", async ({ page }) => {
    await page.goto("/");
    const document = page.locator("html");
    const hero = page.getByRole("heading", { level: 1 });
    const footer = page.getByRole("contentinfo");
    const language = footer.getByRole("button", { name: /^(Langue|Sprache|Język|Language|Мова) / });
    const menu = footer.getByRole("menu");

    await expect(document).toHaveAttribute("lang", "fr");
    await expect(hero).toHaveText(/Un seul lien\.\s*Toute votre histoire\./);
    await expect(language).toHaveAccessibleName("Langue Automatique");
    await expect(page.getByRole("region", { name: "Les cookies sur Taplify" })).toBeVisible();
    await page.getByRole("button", { name: "Refuser les cookies facultatifs" }).click();

    const [copyright, themeControl, languageControl] = await Promise.all([
      footer.getByText(/© 2026 Taplify/).boundingBox(),
      footer.getByRole("group", { name: "Thème" }).boundingBox(),
      language.boundingBox(),
    ]);
    if (!copyright || !themeControl || !languageControl) throw new Error("The footer controls are missing.");
    expect(themeControl.x).toBeGreaterThanOrEqual(copyright.x + copyright.width);
    expect(languageControl.x).toBeGreaterThanOrEqual(copyright.x + copyright.width);
    expect(languageControl.y < themeControl.y || languageControl.x < themeControl.x).toBe(true);

    await language.press("Enter");
    const automatic = menu.getByRole("menuitemradio", { name: "Automatique" });
    await expect(automatic).toHaveAttribute("aria-checked", "true");
    await expect(automatic).toBeFocused();
    await page.keyboard.press("End");
    await expect(menu.getByRole("menuitemradio", { name: "Українська" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(language).toBeFocused();

    for (const [locale, label, title] of [
      ["de", "Deutsch", /Ein Link\.\s*Deine ganze Geschichte\./],
      ["pl", "Polski", /Jeden link\.\s*Cała Twoja historia\./],
      ["en", "English", /One link\.\s*Your whole story\./],
      ["uk", "Українська", /Одне посилання\.\s*Уся ваша історія\./],
    ] as const) {
      await language.click();
      await menu.getByRole("menuitemradio", { name: label }).click();
      await expect(document).toHaveAttribute("lang", locale);
      await expect(hero).toHaveText(title);
    }

    await expect(page).toHaveTitle(/Створіть мікросайт/);
    await page.reload();
    await expect(language).toHaveAccessibleName("Мова Українська");
    await expect(document).toHaveAttribute("lang", "uk");
    await footer.getByRole("button", { name: "Керувати файлами cookie" }).click();
    await expect(page.getByRole("dialog", { name: "Налаштування файлів cookie" })).toBeVisible();
    await page.keyboard.press("Escape");

    await language.click();
    await menu.getByRole("menuitemradio", { name: "Автоматично" }).click();
    await expect(document).toHaveAttribute("lang", "fr");
    await expect(footer.getByRole("link", { name: "Accueil" })).toBeVisible();
  });
});
