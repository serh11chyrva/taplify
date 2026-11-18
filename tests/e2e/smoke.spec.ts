import { expect, test } from "@playwright/test";

test("opens the landing page and sign-in screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("One page.");
  await page.getByRole("link", { name: "Get started" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
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
