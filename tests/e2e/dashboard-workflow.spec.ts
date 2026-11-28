import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { MongoClient } from "mongodb";
import { expect, test, type BrowserContext } from "@playwright/test";
import { createBlock } from "../../src/lib/dashboard/draft";

test.skip(process.env.TAPLIFY_DASHBOARD_E2E !== "true", "Requires the isolated dashboard replica set");

const origin = "http://127.0.0.1:3000";
const password = "dashboard-test-only-password";

async function register(context: BrowserContext) {
  const id = randomUUID();
  const email = `dashboard-${id}@example.test`;
  const signUp = () => context.request.post(`${origin}/api/auth/sign-up/email`, {
    headers: { origin },
    data: { email, password, name: "Dashboard QA" },
  });
  let response = await signUp();
  for (let attempt = 0; response.status() === 429 && attempt < 3; attempt += 1) {
    const wait = Math.min(Number(response.headers()["retry-after"]) || 10, 10);
    await new Promise((resolve) => setTimeout(resolve, (wait + 1) * 1000));
    response = await signUp();
  }
  expect(response.status()).toBe(200);
  const page = await context.newPage();
  await page.goto(`${origin}/dashboard`);
  await expect(page).toHaveURL(/\/dashboard\/[a-f0-9-]+$/);
  return { page, email, organizationId: new URL(page.url()).pathname.split("/")[2] };
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
  const creation = page.waitForResponse((response) => response.url().endsWith(`/api/organizations/${organizationId}/pages`) && response.request().method() === "POST");
  await page.getByRole("button", { name: "Create draft" }).click();
  const created = await creation;
  expect(created.status()).toBe(201);
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

test("validates form versions and records a submission once", async ({ context }) => {
  test.skip(process.env.PAGE_FORMS_ENABLED !== "true", "Requires the contact form release");
  const { organizationId } = await register(context);
  const api = `/api/organizations/${organizationId}/pages`;
  const { id: pageId } = await (await context.request.post(api, {
    data: { name: "Contact page", type: "Personal", requestId: randomUUID() },
  })).json();
  const route = `${api}/${pageId}`;
  const { draft, revision } = await (await context.request.get(route)).json();
  const form = createBlock("contact");
  if (form.type !== "contact") throw new Error("Expected a contact form");
  const [email, message] = form.fields;
  const saved = await context.request.put(`${route}/draft`, {
    data: { expectedRevision: revision, draft: { ...draft, blocks: [...draft.blocks, form] } },
  });
  expect(saved.status()).toBe(200);
  const slug = `contact-${randomUUID()}`;
  expect((await context.request.post(`${route}/publish`, { data: { expectedRevision: revision + 1, slug } })).status()).toBe(200);

  const publicApi = `/api/public/pages/${slug}`;
  const { version } = await (await context.request.get(`${publicApi}/form`)).json();
  const data = { submissionId: randomUUID(), formVersion: version, answers: { [email.id]: "visitor@example.test", [message.id]: "=1+1" } };
  expect((await context.request.post(`${publicApi}/submissions`, { data: { ...data, formVersion: version + 1 } })).status()).toBe(409);
  expect((await context.request.post(`${publicApi}/submissions`, { data: { ...data, answers: { [email.id]: "invalid" } } })).status()).toBe(422);
  const delivery = await Promise.all([
    context.request.post(`${publicApi}/submissions`, { data }), context.request.post(`${publicApi}/submissions`, { data }),
  ]);
  expect(delivery.map((response) => response.status())).toEqual([200, 200]);
  expect(await delivery[0].json()).toEqual(await delivery[1].json());
  const inbox = await context.request.get(`${route}/leads`);
  expect(inbox.status()).toBe(200);
  const { items, total } = await inbox.json();
  expect(total).toBe(1);
  const leadUrl = `${route}/leads/${items[0].id}`;
  const updated = await context.request.patch(leadUrl, { data: { status: "in_progress", read: true } });
  expect(updated.status()).toBe(200);
  expect(await updated.json()).toMatchObject({ status: "in_progress", readAt: expect.any(String), formVersion: version });
  const columns = `${route}/lead-columns`;
  expect((await context.request.put(columns, { data: { columns: [`answer:${email.id}`, "status"] } })).status()).toBe(200);
  expect(await (await context.request.get(columns)).json()).toMatchObject({ selected: [`answer:${email.id}`, "status"], automatic: false });
  const exported = await context.request.get(`${route}/leads/export?status=in_progress`);
  expect(exported.status()).toBe(200);
  expect(await exported.text()).toContain(`"'=1+1"`);
  const otherStatus = await context.request.get(`${route}/leads/export?status=closed`);
  expect(await otherStatus.text()).not.toContain("visitor@example.test");

  const [submission, unpublish] = await Promise.all([
    context.request.post(`${publicApi}/submissions`, { data: { ...data, submissionId: randomUUID() } }),
    context.request.post(`${route}/unpublish`),
  ]);
  expect([200, 404, 409]).toContain(submission.status());
  expect(unpublish.status()).toBe(200);
  expect((await context.request.post(`${publicApi}/submissions`, { data })).status()).toBe(404);
});

test("collects consented views across pages and stops after withdrawal", async ({ context, browser }) => {
  test.skip(process.env.PAGE_ANALYTICS_ENABLED !== "true", "Requires the page analytics release");
  test.setTimeout(60000);
  const { organizationId, page: dashboard } = await register(context);
  const api = `/api/organizations/${organizationId}`;
  const slugs = [`traffic-one-${randomUUID()}`, `traffic-two-${randomUUID()}`];
  for (const [index, slug] of slugs.entries()) {
    const draft = await context.request.post(`${api}/pages`, { data: { name: `Traffic page ${index + 1}`, type: "Personal", requestId: randomUUID() } });
    expect(draft.status()).toBe(201);
    const { id } = await draft.json();
    expect((await context.request.post(`${api}/pages/${id}/publish`, { data: { expectedRevision: 1, slug } })).status()).toBe(200);
  }
  const guest = await browser.newContext({ baseURL: origin });
  try {
    const visitor = await guest.newPage();
    const endpoint = (slug: string) => `/api/public/pages/${slug}/events`;
    const syntheticView = (slug: string) => {
      const id = randomUUID();
      return guest.request.post(endpoint(slug), { data: { type: "view", eventId: id, pageViewId: id, publicationVersion: 1 } });
    };
    await visitor.goto(`/p/${slugs[0]}?utm_source=Newsletter`);
    expect(await (await syntheticView(slugs[0])).json()).toEqual({ recorded: false });
    const consent = visitor.waitForResponse((response) => response.url().endsWith("/api/public/pages/consent"), { timeout: 10000 });
    const first = visitor.waitForResponse((response) => response.url().endsWith(endpoint(slugs[0])), { timeout: 15000 });
    await visitor.getByRole("button", { name: "Allow page analytics", exact: true }).click();
    const consentResult = await consent;
    expect(await consentResult.json()).toEqual({ granted: true });
    expect((await guest.cookies()).some((cookie) => cookie.name === "taplify_page_analytics")).toBe(true);
    const viewed = await first;
    expect(await viewed.json()).toEqual({ recorded: true });
    expect((await guest.request.post(endpoint(slugs[0]), { data: viewed.request().postDataJSON() })).status()).toBe(200);

    const second = visitor.waitForResponse((response) => response.url().endsWith(endpoint(slugs[1])), { timeout: 15000 });
    await visitor.goto(`/p/${slugs[1]}`);
    expect((await second).status()).toBe(200);
    await visitor.getByRole("button", { name: "Page analytics settings" }).click();
    await visitor.getByRole("button", { name: "Decline page analytics", exact: true }).click();
    await expect(visitor.getByRole("dialog", { name: "Page analytics settings" })).not.toBeVisible();
    expect(await (await syntheticView(slugs[1])).json()).toEqual({ recorded: false });
    const result = await context.request.get(`${api}/analytics?range=7`);
    expect(result.status()).toBe(200);
    expect(await result.json()).toMatchObject({
      report: { totals: { views: 2, uniqueVisitors: 1 }, campaigns: [{ label: "Newsletter", count: 1 }] },
    });
    await dashboard.goto(`/dashboard/${organizationId}/analytics?range=7`);
    await expect(dashboard.getByRole("heading", { name: "Organization analytics" })).toBeVisible();
  } finally {
    await guest.close();
  }
});

async function mailLink(email: string, subject: string): Promise<string> {
  const mailbox = process.env.TAPLIFY_TEST_MAILBOX;
  if (!mailbox) throw new Error("The dashboard test mailbox is unavailable.");
  let link: string | undefined;
  await expect.poll(async () => {
    const messages = (await readFile(mailbox, "utf8").catch(() => "")).split("\n").filter(Boolean)
      .map((line) => JSON.parse(line) as { to: string[]; subject: string; text: string });
    const message = messages.reverse().find((item) => item.to.includes(email) && item.subject.includes(subject));
    link = message?.text.match(/https?:\/\/[^\s]+/)?.[0];
    return Boolean(link);
  }).toBe(true);
  if (!link) throw new Error("The expected email was not captured.");
  return link;
}

test("verifies invitation recipients, enforces roles, and revokes access", async ({ context, browser }) => {
  test.skip(process.env.ORGANIZATION_INVITATIONS_ENABLED !== "true" || !process.env.TAPLIFY_TEST_MAILBOX, "Requires the test mail transport");
  test.setTimeout(90000);
  await register(context);
  const created = await context.request.post("/api/organizations", { data: { name: "Dashboard team" } });
  expect(created.status(), await created.text()).toBe(201);
  const { id: organizationId } = await created.json();
  const base = `/api/organizations/${organizationId}`;
  const draft = await context.request.post(`${base}/pages`, {
    data: { name: "Team page", type: "Personal", requestId: randomUUID() },
  });
  expect(draft.status()).toBe(201);
  const { id: pageId } = await draft.json();
  const pageEndpoint = `${base}/pages/${pageId}`;
  const editor = await browser.newContext({ baseURL: origin });
  const operator = await browser.newContext({ baseURL: origin });
  try {
    const editing = await register(editor);
    const operating = await register(operator);
    async function invite(email: string, role: "editor" | "operator") {
      const response = await context.request.post(`${base}/invitations`, { data: { email, role, requestId: randomUUID() } });
      expect(response.status(), await response.text()).toBe(201);
      return (await response.json()).id as string;
    }
    const editorId = await invite(editing.email, "editor");
    const editorEndpoint = `/api/organization-invitations/${editorId}`;
    expect((await operator.request.post(`${editorEndpoint}/accept`)).status()).toBe(404);
    expect((await editor.request.post(`${editorEndpoint}/accept`)).status()).toBe(403);

    const outdated = await invite(operating.email, "operator");
    const database = process.env.MONGODB_URI;
    if (!database?.startsWith("mongodb://127.0.0.1:27017/taplify_dashboard_test?")) throw new Error("Expected an isolated dashboard database.");
    const mongo = await new MongoClient(database).connect();
    try {
      await mongo.db("taplify_dashboard_test").collection<{ _id: string; expiresAt: Date }>("organization_invitations")
        .updateOne({ _id: outdated }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    } finally {
      await mongo.close();
    }
    await operating.page.goto(`/dashboard/invitations/${outdated}`);
    await expect(operating.page.getByText("This invitation expired.")).toBeVisible();
    const revoked = await invite(operating.email, "operator");
    expect((await context.request.post(`${base}/invitations/${revoked}/revoke`)).status()).toBe(200);
    await operating.page.goto(`/dashboard/invitations/${revoked}`);
    await expect(operating.page.getByText("This invitation was revoked.")).toBeVisible();
    const operatorId = await invite(operating.email, "operator");

    for (const [recipient, id] of [[editing, editorId], [operating, operatorId]] as const) {
      const inviteUrl = await mailLink(recipient.email, "invited");
      expect(new URL(inviteUrl).pathname).toBe(`/dashboard/invitations/${id}`);
      await recipient.page.goto(inviteUrl);
      await recipient.page.getByRole("button", { name: "Send verification email" }).click();
      await expect(recipient.page.getByText("Open the link in your verification email")).toBeVisible();
      await recipient.page.goto(await mailLink(recipient.email, "Verify"));
      await recipient.page.getByRole("button", { name: "Accept invitation" }).click();
      await expect(recipient.page).toHaveURL(`${origin}/dashboard/${organizationId}`);
    }

    expect((await editor.request.get(pageEndpoint)).status()).toBe(200);
    expect((await editor.request.post(`${pageEndpoint}/publish`, { data: { expectedRevision: 1, slug: "editor-publish" } })).status()).toBe(403);
    expect((await editor.request.get(`${pageEndpoint}/leads`)).status()).toBe(403);
    expect((await operator.request.get(`${pageEndpoint}/leads`)).status()).toBe(200);
    expect((await operator.request.get(`${base}/analytics`)).status()).toBe(200);
    expect((await operator.request.get(`${pageEndpoint}/leads/export`)).status()).toBe(403);
    expect((await operator.request.get(pageEndpoint)).status()).toBe(403);
    expect((await editor.request.post(`${editorEndpoint}/accept`)).status()).toBe(200);

    const members = await (await context.request.get(`${base}/members`)).json() as { id: string; email: string }[];
    const membership = members.find((member) => member.email === editing.email);
    expect(membership).toBeDefined();
    expect((await context.request.patch(`${base}/members/${membership?.id}`, { data: { role: "operator" } })).status()).toBe(200);
    expect((await editor.request.get(pageEndpoint)).status()).toBe(403);
    expect((await editor.request.get(`${base}/analytics`)).status()).toBe(200);
    expect((await context.request.delete(`${base}/members/${membership?.id}`)).status()).toBe(200);
    expect((await editor.request.get(`${base}/analytics`)).status()).toBe(404);
    expect((await editor.request.post(`${editorEndpoint}/accept`)).status()).toBe(409);
  } finally {
    await editor.close();
    await operator.close();
  }
});
