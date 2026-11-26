import { expect, test } from "@playwright/test";

test("follows the system theme and remembers an explicit theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.getByRole("button", { name: "Reject optional" }).click();

  const footer = page.getByRole("contentinfo");
  const theme = footer.getByRole("combobox", { name: "Theme" });
  await expect(theme).toHaveValue("system");
  await expect(footer).toHaveCSS("background-color", "rgb(248, 246, 251)");

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(footer).toHaveCSS("background-color", "rgb(0, 0, 0)");

  await theme.selectOption("light");
  await expect(footer).toHaveCSS("background-color", "rgb(248, 246, 251)");
  await page.reload();
  await expect(theme).toHaveValue("light");
  await expect(footer).toHaveCSS("background-color", "rgb(248, 246, 251)");

  await theme.selectOption("dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(footer).toHaveCSS("background-color", "rgb(0, 0, 0)");

  await theme.selectOption("system");
  await expect(footer).toHaveCSS("background-color", "rgb(248, 246, 251)");
});

test.describe("landing language", () => {
  test.use({ locale: "fr-CA", viewport: { width: 375, height: 812 } });

  test("uses the browser language and remembers a manual choice", async ({ page }) => {
    await page.goto("/");
    const document = page.locator("html");
    const hero = page.getByRole("heading", { level: 1 });
    const footer = page.getByRole("contentinfo");
    const language = footer.getByRole("combobox", { name: /^(Langue|Sprache|Język|Language|Мова)$/ });

    await expect(document).toHaveAttribute("lang", "fr");
    await expect(hero).toHaveText(/Un seul lien\.\s*Toute votre histoire\./);
    await expect(language).toHaveValue("auto");
    await expect(page.getByRole("region", { name: "Les cookies sur Taplify" })).toBeVisible();
    await page.getByRole("button", { name: "Refuser les cookies facultatifs" }).click();

    const [copyright, themeControl, languageControl] = await Promise.all([
      footer.getByText(/© 2026 Taplify/).boundingBox(),
      footer.getByRole("combobox", { name: "Thème" }).boundingBox(),
      language.boundingBox(),
    ]);
    if (!copyright || !themeControl || !languageControl) throw new Error("The footer controls are missing.");
    expect(themeControl.x).toBeGreaterThanOrEqual(copyright.x + copyright.width);
    expect(languageControl.x).toBeGreaterThanOrEqual(copyright.x + copyright.width);

    for (const [locale, title] of [
      ["de", /Ein Link\.\s*Deine ganze Geschichte\./],
      ["pl", /Jeden link\.\s*Cała Twoja historia\./],
      ["en", /One link\.\s*Your whole story\./],
      ["uk", /Одне посилання\.\s*Уся ваша історія\./],
    ] as const) {
      await language.selectOption(locale);
      await expect(document).toHaveAttribute("lang", locale);
      await expect(hero).toHaveText(title);
    }

    await expect(page).toHaveTitle(/Створіть мікросайт/);
    await page.reload();
    await expect(language).toHaveValue("uk");
    await expect(document).toHaveAttribute("lang", "uk");
    await footer.getByRole("button", { name: "Керувати файлами cookie" }).click();
    await expect(page.getByRole("dialog", { name: "Налаштування файлів cookie" })).toBeVisible();
    await page.keyboard.press("Escape");

    await language.selectOption("auto");
    await expect(document).toHaveAttribute("lang", "fr");
    await expect(footer.getByRole("link", { name: "Accueil" })).toBeVisible();
  });
});
