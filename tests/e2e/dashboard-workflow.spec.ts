import { randomUUID } from "node:crypto";
import { expect, test, type BrowserContext } from "@playwright/test";

test.skip(process.env.TAPLIFY_DASHBOARD_E2E !== "true", "Requires the isolated dashboard replica set");

const origin = "http://127.0.0.1:3000";
const password = "dashboard-test-only-password";

async function register(context: BrowserContext) {
  const id = randomUUID();
  const response = await context.request.post(`${origin}/api/auth/sign-up/email`, {
    headers: { origin },
    data: { email: `dashboard-${id}@example.test`, password, name: "Dashboard QA" },
  });
  expect(response.status()).toBe(200);
  const page = await context.newPage();
  await page.goto(`${origin}/dashboard`);
  await expect(page).toHaveURL(/\/dashboard\/[a-f0-9-]+$/);
  return { page, organizationId: new URL(page.url()).pathname.split("/")[2] };
}

test("creates, publishes, archives, and restores a page", async ({ context, browser }) => {
  const { page, organizationId } = await register(context);
  await expect(page.getByRole("heading", { name: "No pages yet" })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 780 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog", { name: "Dashboard navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Dashboard navigation" })).not.toBeVisible();

  await page.getByRole("link", { name: "New page" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Page name").fill("Field Notes");
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel("Page name")).toHaveValue("Field Notes");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/editor$/);
  const pageId = new URL(page.url()).pathname.split("/")[4];
  const privatePath = `/dashboard/${organizationId}/pages/${pageId}`;

  const guest = await browser.newContext();
  try {
    const visitor = await guest.newPage();
    await visitor.goto(`${origin}${privatePath}/editor`);
    expect(new URL(visitor.url()).searchParams.get("next")).toBe(`${privatePath}/editor`);

    const slug = `field-notes-${randomUUID()}`;
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await page.getByLabel("Public slug").fill(slug);
    await page.getByRole("button", { name: "Publish saved draft" }).click();
    await expect(page.getByRole("button", { name: "Publish changes" })).toBeVisible();
    const published = await visitor.goto(`${origin}/p/${slug}`);
    expect(published?.status()).toBe(200);
    await expect(visitor.getByRole("heading", { name: "Field Notes", level: 2 })).toBeVisible();

    await page.getByLabel("Display name").fill("Draft only");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Draft saved.", { exact: true })).toBeVisible();
    await visitor.reload();
    await expect(visitor.getByRole("heading", { name: "Field Notes", level: 2 })).toBeVisible();

    await page.goto(`${privatePath}/settings`);
    await page.getByRole("button", { name: "Archive page", exact: true }).click();
    await page.getByLabel("Type the page name to confirm").fill("Field Notes");
    await page.getByRole("button", { name: "Confirm archive" }).click();
    await expect(page.getByRole("button", { name: "Restore draft" })).toBeVisible();
    expect((await guest.request.get(`${origin}/p/${slug}`)).status()).toBe(404);
    await page.getByRole("button", { name: "Restore draft" }).click();
    await expect(page.getByRole("button", { name: "Archive page", exact: true })).toBeVisible();
    await expect(page.getByLabel("Public URL")).toHaveValue(`${origin}/p/${slug}`);
  } finally {
    await guest.close();
  }
});

test("scopes resources and resolves concurrent page writes", async ({ context, browser }) => {
  const { organizationId } = await register(context);
  const url = `/api/organizations/${organizationId}/pages`;
  const data = { name: "Concurrent draft", type: "Personal", requestId: randomUUID() };
  const created = await Promise.all([context.request.post(url, { data }), context.request.post(url, { data })]);
  const ids = await Promise.all(created.map(async (response) => {
    expect(response.status()).toBe(201);
    return (await response.json()).id as string;
  }));
  expect(ids[0]).toBe(ids[1]);
  const route = `${url}/${ids[0]}`;
  const { draft, revision } = await (await context.request.get(route)).json();
  const writes = await Promise.all(["First edit", "Second edit"].map((name) =>
    context.request.put(`${route}/draft`, { data: { expectedRevision: revision, draft: { ...draft, name } } })));
  expect(writes.map((response) => response.status()).sort()).toEqual([200, 409]);

  const outsider = await browser.newContext();
  try {
    await register(outsider);
    expect((await outsider.request.get(`${origin}${route}`)).status()).toBe(404);
  } finally {
    await outsider.close();
  }
});
