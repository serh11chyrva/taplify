import { expect, test } from "@playwright/test";

test("opens the landing page and sign-in screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/One link\.\s*Your whole story\./);
  const nav = page.getByRole("navigation", { name: "Main" });
  const products = nav.getByRole("button", { name: "Products" });
  const pricing = nav.getByRole("button", { name: "Pricing" });
  await expect(pricing).toBeDisabled();
  await pricing.hover();
  await expect(pricing).toHaveCSS("text-decoration-line", "underline");
  await products.hover();
  await expect(products).toHaveCSS("text-decoration-line", "underline");
  await expect(products).toHaveAttribute("aria-expanded", "true");
  await expect(nav.getByRole("link")).toHaveText([
    "Taplify Notes*", "Taplify Store*", "Taplify AI*", "Taplify CMS",
  ]);
  const notes = nav.getByRole("link", { name: "Taplify Notes*" });
  await notes.hover();
  await expect(notes).toHaveCSS("text-decoration-line", "underline");
  await expect(notes).toBeDisabled();
  await expect(notes).not.toHaveAttribute("href");
  await page.keyboard.press("Escape");
  await expect(products).toHaveAttribute("aria-expanded", "false");
  await products.focus();
  await page.keyboard.press("Enter");
  await expect(products).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(products).toHaveAttribute("aria-expanded", "false");
  await expect(products).toBeFocused();

  await expect(page.getByRole("region", { name: "A page for whatever you do." })).toBeAttached();
  await expect(page.getByRole("region", { name: "From draft to one shareable link." })).toBeAttached();
  await expect(page.getByRole("region", { name: "Give every visit a next step." })).toBeAttached();

  const footer = page.getByRole("contentinfo");
  await expect(footer).toHaveCSS("background-color", "rgb(0, 0, 0)");
  await expect(footer.getByRole("heading")).toHaveText(["Taplify", "Products", "Developers", "Legal"]);
  await expect(footer.getByRole("listitem")).toHaveText([
    "Templates**", "About**", "Support**", "FAQ & Guides**", "Status**",
    "Taplify Notes*", "Taplify Store*", "Taplify AI*", "Taplify CMS",
    "GitHub**", "Documentation**", "API**", "Integrations**", "Webhooks**",
    "Terms of Service**", "Privacy Policy**", "Cookie Policy**", "Licenses**", "Company Information**",
  ]);
  await expect(footer.getByText("* Starred products are shown for demonstration purposes.")).toBeAttached();
  await expect(footer.getByText("** These links are placeholders.")).toBeAttached();
  const templates = footer.getByRole("link", { name: "Templates**" });
  await expect(templates).not.toHaveAttribute("href");
  await expect(templates.locator("svg")).toHaveCSS("opacity", "0");
  await templates.hover();
  await expect(templates.locator("svg")).toHaveCSS("opacity", "1");
  const vercel = footer.getByRole("link", { name: "Vercel" });
  await expect(vercel).toHaveAttribute("href", "https://vercel.com/");
  await expect(footer.getByText(/© 2026 Taplify powered by/)).toBeAttached();
  await vercel.hover();
  await expect(vercel).toHaveCSS("text-decoration-line", "underline");

  for (const name of ["Sign in", "Create your first page"]) {
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await page.goBack();
  }
});

test("protects the dashboard from anonymous visitors", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("executes Typegoose in the production API route", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({ status: "ok", service: "taplify" });
});
