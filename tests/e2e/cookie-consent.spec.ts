import { expect, test, type BrowserContext } from "@playwright/test";
import {
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_VERSION,
  COOKIE_POLICY_PATH,
  GA4_COOKIE_PREFIX,
  ga4MeasurementId,
} from "@/lib/cookie-consent";

async function interceptAnalytics(context: BrowserContext) {
  const requests: URL[] = [];
  await context.route((url) => /(^|\.)(googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net)$/.test(url.hostname), async (route) => {
    const url = new URL(route.request().url());
    requests.push(url);
    if (url.pathname !== "/gtag/js") {
      await route.fulfill({ status: 204 });
      return;
    }

    await route.fulfill({
      contentType: "application/javascript",
      body: `
        const measurementId = ${JSON.stringify(url.searchParams.get("id"))};
        const cookiePrefix = ${JSON.stringify(GA4_COOKIE_PREFIX)};
        const layer = window.dataLayer;
        const push = layer.push.bind(layer);
        layer.push = (...commands) => {
          for (const [name, type, params] of commands) {
            if (name !== "event" || type !== "page_view" || window["ga-disable-" + measurementId]) continue;
            document.cookie = cookiePrefix + "_ga=test-id; Path=/";
            document.cookie = cookiePrefix + "_ga_" + measurementId.slice(2) + "=test-session; Path=/";
            const collect = new URL("https://www.google-analytics.com/g/collect");
            collect.searchParams.set("dl", params.page_location);
            collect.searchParams.set("tid", params.send_to);
            void fetch(collect, { mode: "no-cors", keepalive: true });
          }
          return push(...commands);
        };
      `,
    });
  });

  return {
    requests,
    tagLoads: () => requests.filter((url) => url.pathname === "/gtag/js"),
    views: () => requests.filter((url) => url.pathname === "/g/collect").map((url) => url.searchParams.get("dl")),
  };
}

test("shows the cookie banner and remembers a confirmation without GA4", async ({ page, context }) => {
  test.skip(ga4MeasurementId !== null, "Requires a build without GA4.");
  const analytics = await interceptAnalytics(context);
  const banner = page.getByRole("region", { name: "Cookies on Taplify" });

  for (const path of ["/", "/sign-in", "/sign-up", COOKIE_POLICY_PATH, "/unknown-cookie-test-page"]) {
    await page.goto(path);
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: "Cookie Policy" })).toHaveAttribute("href", COOKIE_POLICY_PATH);
    await expect(footer.getByRole("button", { name: "Manage Cookies" })).toBeVisible();
    await expect(banner.getByRole("button", { name: "Manage Cookies" })).toBeVisible();
    await expect(banner.getByRole("button", { name: "Confirm" })).toBeVisible();
    await expect(banner.getByRole("button", { name: "Reject optional" })).toBeVisible();
  }

  await expect(banner).toHaveCSS("position", "fixed");
  await banner.getByRole("button", { name: "Manage Cookies" }).click();
  const preferences = page.getByRole("dialog", { name: "Cookie preferences" });
  await expect(preferences.getByText("Always active")).toBeVisible();
  await expect(preferences.getByRole("checkbox", { name: "Analytics" })).toHaveCount(0);
  await preferences.getByRole("button", { name: "Close" }).click();
  await expect(preferences).toBeHidden();

  await banner.getByRole("button", { name: "Confirm" }).click();
  await expect(banner).toBeHidden();
  const savedChoice = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "null"), COOKIE_CONSENT_KEY);
  expect(savedChoice).toMatchObject({ version: COOKIE_CONSENT_VERSION, analytics: null });
  await page.goto("/sign-in");
  await expect(banner).toBeHidden();
  await page.getByRole("contentinfo").getByRole("button", { name: "Manage Cookies" }).click();
  await expect(preferences.getByText("Always active")).toBeVisible();
  expect(analytics.requests).toEqual([]);
});

test.describe("cookie consent with GA4 configured", () => {
  test.skip(ga4MeasurementId === null, "Requires a build with a test GA4 measurement ID.");

  test("offers a keyboard-accessible choice on mobile and keeps a refusal across pages", async ({ page, context }) => {
    const analytics = await interceptAnalytics(context);
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/sign-in");
    const banner = page.getByRole("region", { name: "Cookies on Taplify" });
    await expect(banner).toBeVisible();
    const bounds = await banner.evaluate((element) => {
      const { left, right, bottom } = element.getBoundingClientRect();
      return { left, rightGap: document.documentElement.clientWidth - right, bottomGap: window.innerHeight - bottom };
    });
    expect(bounds).toEqual({ left: 0, rightGap: 0, bottomGap: 0 });

    const opener = banner.getByRole("button", { name: "Manage Cookies" });
    await opener.focus();
    await page.keyboard.press("Enter");
    const preferences = page.getByRole("dialog", { name: "Cookie preferences" });
    const analyticsChoice = preferences.getByRole("checkbox", { name: "Analytics" });
    await expect(analyticsChoice).not.toBeChecked();
    await analyticsChoice.check();
    await page.keyboard.press("Escape");
    await expect(preferences).toBeHidden();
    await expect(opener).toBeFocused();

    await banner.getByRole("button", { name: "Reject optional" }).click();
    await expect(banner).toBeHidden();
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await page.getByRole("contentinfo").getByRole("link", { name: "Cookie Policy" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Cookie Policy" })).toBeVisible();
    await page.reload();
    await expect(banner).toBeHidden();
    await page.getByRole("main").getByRole("button", { name: "Manage Cookies" }).click();
    await expect(analyticsChoice).not.toBeChecked();
    expect(analytics.requests).toEqual([]);
  });

  test("starts after consent, counts client-side views, and stops after revocation across tabs", async ({ page, context }) => {
    const analytics = await interceptAnalytics(context);
    const secondTab = await context.newPage();
    await page.goto("/sign-in?error=example#details");
    await secondTab.goto(COOKIE_POLICY_PATH);
    const origin = new URL(page.url()).origin;
    const banner = page.getByRole("region", { name: "Cookies on Taplify" });
    const secondBanner = secondTab.getByRole("region", { name: "Cookies on Taplify" });
    await expect(banner).toBeVisible();
    await expect(secondBanner).toBeVisible();
    expect(analytics.requests).toEqual([]);

    await banner.getByRole("button", { name: "Accept all" }).click();
    await expect(secondBanner).toBeHidden();
    await expect.poll(() => analytics.views().sort()).toEqual([
      `${origin}${COOKIE_POLICY_PATH}`, `${origin}/sign-in`,
    ]);
    expect(analytics.tagLoads().map((url) => url.searchParams.get("id"))).toEqual([ga4MeasurementId, ga4MeasurementId]);

    await page.getByRole("main").getByRole("link", { name: "Sign up", exact: true }).click();
    await expect.poll(analytics.views).toHaveLength(3);
    expect(analytics.views()[2]).toBe(`${origin}/sign-up`);

    await page.getByRole("contentinfo").getByRole("link", { name: "Cookie Policy" }).click();
    await expect.poll(analytics.views).toHaveLength(4);
    expect(analytics.views()[3]).toBe(`${origin}${COOKIE_POLICY_PATH}`);
    expect(analytics.tagLoads()).toHaveLength(2);

    await context.addCookies([{ name: "better-auth.state", value: "test-state", url: origin, httpOnly: true }]);
    await secondTab.getByRole("main").getByRole("button", { name: "Manage Cookies" }).click();
    const preferences = secondTab.getByRole("dialog", { name: "Cookie preferences" });
    const analyticsChoice = preferences.getByRole("checkbox", { name: "Analytics" });
    await expect(analyticsChoice).toBeChecked();
    await analyticsChoice.uncheck();
    await preferences.getByRole("button", { name: "Save preferences" }).click();
    await expect(preferences).toBeHidden();
    await expect.poll(async () => (await context.cookies(origin)).map((cookie) => cookie.name)).toEqual(["better-auth.state"]);

    await page.getByRole("main").getByRole("button", { name: "Manage Cookies" }).click();
    const syncedPreferences = page.getByRole("dialog", { name: "Cookie preferences" });
    await expect(syncedPreferences.getByRole("checkbox", { name: "Analytics" })).not.toBeChecked();
    await syncedPreferences.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("main").getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeVisible();
    await page.reload();
    await expect(banner).toBeHidden();
    expect(analytics.views()).toHaveLength(4);
    expect(analytics.tagLoads()).toHaveLength(2);
  });

  test("asks again when stored consent has expired", async ({ page, context }) => {
    const analytics = await interceptAnalytics(context);
    await page.addInitScript(({ key, version }) => {
      window.localStorage.setItem(key, JSON.stringify({ version, analytics: true, expiresAt: Date.now() - 1000 }));
    }, { key: COOKIE_CONSENT_KEY, version: COOKIE_CONSENT_VERSION });

    await page.goto(COOKIE_POLICY_PATH);
    await expect(page.getByRole("region", { name: "Cookies on Taplify" })).toBeVisible();
    expect(await page.evaluate((key) => window.localStorage.getItem(key), COOKIE_CONSENT_KEY)).toBeNull();
    expect(analytics.requests).toEqual([]);
  });

  test("asks for analytics consent after a necessary-only confirmation", async ({ page, context }) => {
    const analytics = await interceptAnalytics(context);
    await page.addInitScript(({ key, version }) => {
      window.localStorage.setItem(key, JSON.stringify({ version, analytics: null, expiresAt: Date.now() + 60_000 }));
    }, { key: COOKIE_CONSENT_KEY, version: COOKIE_CONSENT_VERSION });

    await page.goto(COOKIE_POLICY_PATH);
    const banner = page.getByRole("region", { name: "Cookies on Taplify" });
    await expect(banner.getByRole("button", { name: "Accept all" })).toBeVisible();
    await banner.getByRole("button", { name: "Manage Cookies" }).click();
    await expect(page.getByRole("dialog").getByRole("checkbox", { name: "Analytics" })).not.toBeChecked();
    expect(analytics.requests).toEqual([]);
  });

  test("keeps analytics off when the browser cannot persist a choice", async ({ page, context }) => {
    const analytics = await interceptAnalytics(context);
    await page.addInitScript((key) => {
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (this: Storage, name: string, value: string) {
        if (name === key) throw new DOMException("Cannot save consent", "QuotaExceededError");
        setItem.call(this, name, value);
      };
    }, COOKIE_CONSENT_KEY);

    await page.goto("/sign-in");
    const banner = page.getByRole("region", { name: "Cookies on Taplify" });
    await banner.getByRole("button", { name: "Accept all" }).click();
    await expect(banner.getByRole("alert")).toContainText("Your preferences could not be saved");
    expect(analytics.requests).toEqual([]);
  });
});
