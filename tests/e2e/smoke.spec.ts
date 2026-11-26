import { expect, test } from "@playwright/test";

test("opens the landing page and sign-in screen", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/One link\.\s*Your whole story\./);
  const header = page.getByRole("banner");
  await expect(header).not.toHaveAttribute("data-scrolled", "");
  const brand = header.getByRole("link", { name: "Taplify", exact: true });
  await expect(brand).toHaveCSS("font-style", "italic");
  await expect(brand).toHaveCSS("font-weight", "700");
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

  const examples = page.getByRole("region", { name: "A page for whatever you do." });
  const firstExample = examples.getByRole("article").first();
  await expect(firstExample.locator("..")).toHaveAttribute("data-reveal", "pending");
  await firstExample.scrollIntoViewIfNeeded();
  await expect(firstExample.locator("..")).toHaveAttribute("data-reveal", "shown");
  await expect(page.getByRole("region", { name: "From draft to one shareable link." })).toBeAttached();
  await expect(page.getByRole("region", { name: "Give every visit a next step." })).toBeAttached();

  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();
  await expect(header).toHaveCSS("backdrop-filter", /blur\(12px\)/);
  await expect(header).toHaveCSS("box-shadow", "none");
  await expect(footer).toHaveCSS("background-color", "rgb(0, 0, 0)");
  await expect(footer.getByRole("heading")).toHaveText(["Taplify", "Products", "Developers", "Legal", "Cookie", "Social"]);
  await expect(footer.getByRole("listitem").filter({ hasText: /\S/ })).toHaveText([
    "Home", "Pricing**", "Dashboard", "Templates**", "About**", "Support**", "FAQ & Guides**", "Status**",
    "Taplify Commercial*", "Taplify Analytics*", "Taplify AI*",
    "GitHub", "Documentation**", "API**", "Integrations**", "Webhooks**",
    "Terms of Service", "Privacy Policy", "Licenses", "Company Information**",
    "Cookie Policy", "Manage Cookies",
  ]);
  const cookieGroup = footer.getByRole("heading", { name: "Cookie", exact: true }).locator("..");
  await expect(cookieGroup.getByRole("listitem")).toHaveText(["Cookie Policy", "Manage Cookies"]);
  await expect(footer.getByRole("link", { name: "Pricing**", exact: true })).toBeDisabled();
  await expect(footer.getByRole("link", { name: "Dashboard", exact: true })).toHaveAttribute("href", "/dashboard");
  const socials = footer.getByRole("heading", { name: "Social", exact: true }).locator("..");
  await expect(socials.getByRole("link")).toHaveCount(0);
  for (const name of ["X", "YouTube", "Instagram", "TikTok"]) {
    const icon = socials.getByRole("img", { name, exact: true });
    await expect(icon).toBeVisible();
    await expect(icon.locator("..")).toHaveCSS("border-top-width", "0px");
    const height = await icon.evaluate((svg) => {
      const path = svg.querySelector("path");
      const transform = path?.getScreenCTM();
      if (!path || !transform) throw new Error("The social icon is missing its visible path.");
      return path.getBBox().height * transform.d;
    });
    expect(height).toBeCloseTo(16, 0);
  }
  await expect(footer.getByRole("link", { name: "GitHub", exact: true }))
    .toHaveAttribute("href", "https://github.com/serh11chyrva/taplify");
  await expect(footer.getByText("* Starred products are shown for demonstration purposes.")).toBeAttached();
  await expect(footer.getByText("** These links are placeholders.")).toBeAttached();
  const templates = footer.getByRole("link", { name: "Templates**" });
  await expect(templates).not.toHaveAttribute("href");
  await expect(templates.locator("svg")).toHaveCSS("opacity", "0");
  await templates.hover();
  await expect(templates.locator("svg")).toHaveCSS("opacity", "1");
  const arrowCenterOffset = await templates.evaluate((link) => {
    const arrow = link.querySelector("svg");
    if (!arrow) throw new Error("The footer link is missing its arrow.");
    const linkBounds = link.getBoundingClientRect();
    const arrowBounds = arrow.getBoundingClientRect();
    return (arrowBounds.top + arrowBounds.bottom - linkBounds.top - linkBounds.bottom) / 2;
  });
  expect(Math.abs(arrowCenterOffset)).toBeLessThan(0.5);
  const copyright = footer.getByText("© 2026 Taplify", { exact: true });
  await expect(copyright).toBeVisible();
  await expect(copyright.locator("svg")).toBeVisible();
  await expect(footer.getByRole("link", { name: "Vercel", exact: true })).toHaveCount(0);

  for (const name of ["Sign In", "Sign Up", "Create your first page"]) {
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

  const home = page.getByRole("contentinfo").getByRole("link", { name: "Home", exact: true });
  await expect(home).toHaveAttribute("href", "/");
  await home.click();
  await expect(page).toHaveURL("/");
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
