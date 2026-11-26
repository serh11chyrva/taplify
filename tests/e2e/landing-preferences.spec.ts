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
