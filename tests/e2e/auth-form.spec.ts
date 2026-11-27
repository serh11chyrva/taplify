import { expect, test } from "@playwright/test";

test("reveals passwords only while held and validates registration before sending", async ({ page }) => {
  let signUpRequests = 0;
  await page.route("**/api/auth/sign-up/email", async (route) => {
    signUpRequests++;
    await route.fulfill({ status: 400, json: { code: "TEST_RESPONSE" } });
  });

  await page.goto("/sign-up");
  const form = page.getByRole("main");
  const createAccount = form.getByRole("button", { name: "Create account", exact: true });
  test.skip(!process.env.BETTER_AUTH_SECRET && await createAccount.isDisabled(), "Requires configured authentication.");
  await expect(createAccount).toBeEnabled();
  await page.getByRole("button", { name: "Reject optional" }).click();

  const password = form.getByLabel("Password", { exact: true });
  const confirmation = form.getByLabel("Confirm password", { exact: true });
  const reveal = form.getByRole("button", { name: "Hold to show passwords", exact: true });
  const google = form.getByRole("button", { name: "Continue with Google" });
  if (process.env.GOOGLE_CLIENT_ID || await google.isEnabled()) {
    await expect(google).toBeEnabled();
    await expect(google).toHaveCSS("cursor", "pointer");
  }
  await form.getByLabel("Email", { exact: true }).fill("alex@example.com");
  await password.fill("example-password");
  await confirmation.fill("example-password");

  await reveal.first().hover();
  await expect(reveal.first()).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await page.mouse.down();
  await expect(password).toHaveAttribute("type", "text");
  await expect(confirmation).toHaveAttribute("type", "text");
  await page.mouse.move(1, 1);
  await page.mouse.up();
  await expect(password).toHaveAttribute("type", "password");
  await expect(confirmation).toHaveAttribute("type", "password");

  await reveal.last().focus();
  await page.keyboard.down("Space");
  await expect(password).toHaveAttribute("type", "text");
  await expect(confirmation).toHaveAttribute("type", "text");
  await page.keyboard.up("Space");
  await expect(password).toHaveAttribute("type", "password");
  await expect(confirmation).toHaveAttribute("type", "password");

  for (const invalidPassword of ["short", "a".repeat(129)]) {
    await password.fill(invalidPassword);
    await confirmation.fill(invalidPassword);
    await createAccount.click();
    await expect(password).toBeFocused();
    await expect(password).toHaveAccessibleDescription("Use 8 to 128 characters for your password.");
    expect(signUpRequests).toBe(0);
  }

  await password.fill("example-password");
  await confirmation.fill("different-password");
  await createAccount.click();
  await expect(confirmation).toBeFocused();
  await expect(confirmation).toHaveAccessibleDescription("Passwords do not match.");
  expect(signUpRequests).toBe(0);

  await confirmation.fill("example-password");
  await expect(form.getByRole("alert")).toHaveCount(0);
  const submitted = page.waitForRequest("**/api/auth/sign-up/email");
  await createAccount.click();
  expect((await submitted).postDataJSON()).toEqual({ email: "alex@example.com", name: "alex", password: "example-password" });
  await expect(form.getByRole("alert")).toHaveText("Unable to create your account. Please try again.");
});
