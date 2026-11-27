import { expect, test } from "@playwright/test";

test("opens the landing page and authentication screens", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/One link\.\s*Your whole story\./);
  const header = page.getByRole("banner");
  await expect(header).not.toHaveAttribute("data-overlap", "");
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

  await page.evaluate(() => window.scrollTo(0, 32));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await expect(header).not.toHaveAttribute("data-overlap", "");

  const examples = page.getByRole("region", { name: "A page for whatever you do." });
  const firstExample = examples.getByRole("article").first();
  await expect(firstExample.locator("..")).toHaveAttribute("data-reveal", "pending");
  await firstExample.scrollIntoViewIfNeeded();
  await expect(firstExample.locator("..")).toHaveAttribute("data-reveal", "shown");
  await expect(page.getByRole("region", { name: "From draft to one shareable link." })).toBeAttached();
  await expect(page.getByRole("region", { name: "Give every visit a next step." })).toBeAttached();

  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();
  await expect(header).toHaveAttribute("data-overlap", "");
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

  for (const [name, path] of [
    ["Sign In", "/sign-in"],
    ["Sign Up", "/sign-up"],
    ["Create your first page", "/sign-up"],
  ]) {
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await page.goBack();
  }
});

test("shows the email forms and account terms on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/login?error=access_denied");
  await expect(page).toHaveURL("/sign-in?error=access_denied");
  await page.getByRole("button", { name: "Reject optional" }).click();

  const main = page.getByRole("main");
  const signIn = main.getByRole("region", { name: "Sign in" });
  const logo = main.getByRole("link", { name: "Taplify", exact: true });
  const back = main.getByRole("link", { name: "Back to Taplify" });
  const email = main.getByLabel("Email", { exact: true });
  const password = main.getByLabel("Password", { exact: true });
  const confirmation = main.getByLabel("Confirm password", { exact: true });
  const google = main.getByRole("button", { name: "Continue with Google" });
  const googleIcon = google.locator("svg");
  await expect(logo.locator("svg")).toBeVisible();
  await expect(logo.locator("svg path")).toHaveCSS("shape-rendering", /geometricprecision/i);
  await expect(email).toHaveAttribute("type", "email");
  await expect(email).toHaveAttribute("placeholder", "you@example.com");
  await expect(password).toHaveAttribute("type", "password");
  await expect(password).toHaveAttribute("placeholder", "••••••••");
  await expect(password).toHaveAttribute("autocomplete", "current-password");
  await expect(confirmation).toHaveCount(0);
  await expect(main.getByRole("button", { name: "Hold to show password", exact: true })).toBeVisible();
  const signInAction = main.getByRole("button", { name: "Sign in", exact: true });
  await expect(signInAction).toHaveCSS("background-color", await logo.evaluate((element) => getComputedStyle(element).color));
  await expect(signInAction).toHaveCSS("color", "rgb(255, 255, 255)");
  await back.hover();
  await expect(back).toHaveCSS("background-color", "rgb(234, 234, 234)");
  await expect(google).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(google).toHaveCSS("border-top-width", "1px");
  await expect(googleIcon).toBeVisible();
  await expect(googleIcon).toHaveAttribute("fill", "currentColor");
  await expect(googleIcon.locator("path")).toHaveCSS("shape-rendering", /geometricprecision/i);
  expect(await googleIcon.evaluate((element) => {
    const viewBox = (element as SVGSVGElement).viewBox.baseVal;
    const path = element.querySelector("path")?.getBBox();
    return Boolean(path && path.x > viewBox.x && path.y > viewBox.y
      && path.x + path.width < viewBox.x + viewBox.width
      && path.y + path.height < viewBox.y + viewBox.height);
  })).toBe(true);
  await expect(google).toHaveAccessibleDescription(/If you create an account with Google/);
  const [googleBounds, termsBounds] = await Promise.all([
    google.boundingBox(),
    signIn.getByRole("link", { name: "Terms of Service" }).boundingBox(),
  ]);
  if (!googleBounds || !termsBounds) throw new Error("The Google button or terms are missing.");
  expect(termsBounds.y).toBeGreaterThanOrEqual(googleBounds.y + googleBounds.height);
  await expect(main.getByRole("alert")).toHaveText("Unable to continue with Google. Please try again.");
  await expect(signIn).toHaveCSS("background-color", "rgb(255, 255, 255)");

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(signIn).toHaveCSS("background-color", "rgb(24, 24, 24)");
  await expect(signInAction).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(back).toHaveCSS("background-color", "rgb(37, 37, 37)");
  await main.getByRole("link", { name: "Sign up", exact: true }).click();
  await expect(page).toHaveURL("/sign-up");
  await expect(main.getByRole("heading", { name: "Create an account", level: 1 })).toBeVisible();
  await expect(password).toHaveAttribute("autocomplete", "new-password");
  await expect(main.getByText(/Use 8 to 128 characters/)).toHaveCount(0);
  await expect(confirmation).toHaveAttribute("autocomplete", "new-password");
  await expect(confirmation).toHaveAttribute("placeholder", "••••••••");
  await expect(confirmation).toHaveAttribute("required", "");
  await expect(main.getByRole("button", { name: "Hold to show passwords", exact: true })).toHaveCount(2);
  await expect(main.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms-of-service");
  await expect(main.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy-policy");
  const createAccount = main.getByRole("button", { name: "Create account" });
  await expect(createAccount).toHaveCSS("background-color", await logo.evaluate((element) => getComputedStyle(element).color));
  await expect(createAccount).toHaveCSS("color", "rgb(255, 255, 255)");
  for (const action of [google, createAccount]) {
    await expect(action).toHaveAccessibleDescription(/By creating an account, you agree to the Terms of Service and acknowledge the Privacy Policy/);
  }
  await expect(page.getByRole("contentinfo").getByRole("group", { name: "Theme" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);

  await main.getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/sign-in");
  await back.click();
  await expect(page).toHaveURL("/");
});

test("fits the navigation, footer columns, and link arrows on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await page.getByRole("button", { name: "Reject optional" }).click();

  const header = page.getByRole("banner");
  const toggle = header.getByRole("button", { name: "Main", exact: true });
  const dialog = page.getByRole("dialog", { name: "Main" });
  const nav = dialog.getByRole("navigation", { name: "Main" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(dialog).toBeHidden();
  await expect(header.getByRole("link", { name: "Sign In", exact: true })).toBeHidden();

  await toggle.click();
  await expect(dialog).toHaveCSS("width", "320px");
  await expect(dialog).toHaveCSS("height", "740px");
  await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
  await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
  await expect(nav).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Sign In", exact: true })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Sign Up", exact: true })).toBeVisible();
  const products = nav.getByRole("button", { name: "Products" });
  await products.press("Enter");
  await expect(products).toHaveAttribute("aria-expanded", "true");
  await products.press("Escape");
  await expect(products).toHaveAttribute("aria-expanded", "false");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();

  const footer = page.getByRole("contentinfo");
  const headings = await footer.getByRole("heading").evaluateAll((elements) => elements
    .map((element) => {
      const { x, y } = element.getBoundingClientRect();
      return { title: element.textContent, x, y };
    })
    .sort((a, b) => a.y - b.y || a.x - b.x));
  expect(headings.map(({ title }) => title)).toEqual(["Taplify", "Developers", "Products", "Legal", "Cookie", "Social"]);
  for (let row = 0; row < headings.length; row += 2) {
    expect(headings[row + 1].y).toBe(headings[row].y);
    expect(headings[row + 1].x).toBeGreaterThan(headings[row].x);
  }

  const link = footer.getByRole("link", { name: "Company Information**", exact: true });
  const arrow = link.locator("svg");
  await expect(arrow).toHaveCSS("opacity", "0");
  await link.hover();
  await expect(arrow).toHaveCSS("opacity", "1");
  await expect(arrow).toHaveCSS("width", "14px");
  expect(await link.evaluate((element) => {
    const icon = element.querySelector("svg");
    return Boolean(icon && icon.getBoundingClientRect().right <= element.getBoundingClientRect().right + 0.5);
  })).toBe(true);

  await toggle.click();
  await dialog.getByRole("link", { name: "Sign Up", exact: true }).click();
  await expect(page).toHaveURL("/sign-up");
});

test.describe("touch footer", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 });

  test("shows the arrow during touch press and focus", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Reject optional" }).click();
    const footer = page.getByRole("contentinfo");
    const link = footer.getByRole("link", { name: "Terms of Service", exact: true });
    const arrow = link.locator("svg");
    const touch = { pointerType: "touch", isPrimary: true };
    await expect(arrow).toHaveCSS("opacity", "0");
    await link.dispatchEvent("pointerdown", touch);
    await expect(arrow).toHaveCSS("opacity", "1");
    expect(await arrow.evaluate((icon) => {
      const shape = icon.querySelector("polygon");
      return Boolean(shape?.isPointInFill(new DOMPoint(5, 11))
        && shape.isPointInFill(new DOMPoint(8, 8))
        && !shape.isPointInFill(new DOMPoint(8, 9)));
    })).toBe(true);
    await link.dispatchEvent("pointercancel", touch);
    await expect(arrow).toHaveCSS("opacity", "0");
    await link.focus();
    await expect(arrow).toHaveCSS("opacity", "1");
    await link.blur();
    await expect(arrow).toHaveCSS("opacity", "0");
  });
});

test("reveals a block once a fifth of it is in view", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 740 });
  await page.goto("/");
  const block = page.getByRole("article").first().locator("..");
  await expect(block).toHaveAttribute("data-reveal", "pending");

  for (const [share, state] of [[0.1, "pending"], [0.25, "shown"]] as const) {
    await block.evaluate((element, visibleShare) => {
      const { top, height } = element.getBoundingClientRect();
      window.scrollBy(0, top - document.documentElement.clientHeight + height * visibleShare);
      return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    }, share);
    await expect(block).toHaveAttribute("data-reveal", state);
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
  await expect(page).toHaveURL("/sign-in");
});

test("executes Typegoose in the production API route", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({ status: "ok", service: "taplify" });
});
