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
    "Taplify Commercial*", "Taplify Analytics*", "Taplify AI*",
  ]);
  const commercial = nav.getByRole("link", { name: "Taplify Commercial*" });
  await commercial.hover();
  await expect(commercial).toHaveCSS("text-decoration-line", "underline");
  await expect(commercial).toBeDisabled();
  await expect(commercial).not.toHaveAttribute("href");
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
    "Taplify Commercial*", "Taplify Analytics*", "Taplify AI*",
    "GitHub**", "Documentation**", "API**", "Integrations**", "Webhooks**",
    "Terms of Service", "Privacy Policy", "Cookie Policy", "Manage Cookies", "Licenses", "Company Information**",
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

test("opens public policy pages from the footer and by URL", async ({ page }) => {
  for (const [title, path] of [
    ["Terms of Service", "/terms-of-service"],
    ["Privacy Policy", "/privacy-policy"],
    ["Cookie Policy", "/cookie-policy"],
  ]) {
    await page.goto("/");
    const link = page.getByRole("contentinfo").getByRole("link", { name: title, exact: true });
    await expect(link).toHaveAttribute("href", path);
    await link.click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

    expect((await page.goto(path))?.ok()).toBe(true);
    await expect(page.getByRole("link", { name: "serhiichyrva@hotmail.com", exact: true }))
      .toHaveAttribute("href", "mailto:serhiichyrva@hotmail.com");
    await expect(page.getByRole("link", { name: "Back to Taplify" })).toHaveAttribute("href", "/");
  }
});

test("opens Licenses from the footer and serves its notices", async ({ page, request }) => {
  await page.goto("/");
  const link = page.getByRole("contentinfo").getByRole("link", { name: "Licenses", exact: true });
  await expect(link).toHaveAttribute("href", "/licenses");
  await link.click();
  await expect(page).toHaveURL("/licenses");
  await expect(page.getByRole("heading", { name: "Licenses", level: 1 })).toBeVisible();

  expect((await page.goto("/licenses"))?.ok()).toBe(true);
  await expect(page.getByRole("table", { name: "Dependencies" })).toBeVisible();
  const noticesPath = "/third-party-notices.txt";
  await expect(page.getByRole("link", { name: "Download third-party notices" })).toHaveAttribute("href", noticesPath);
  const response = await request.get(noticesPath);
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain("React Bits Dither");
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
