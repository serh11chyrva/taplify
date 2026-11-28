import { randomUUID } from "node:crypto";
import { appendFile } from "node:fs/promises";

const mailbox = process.env.TAPLIFY_TEST_MAILBOX;
if (mailbox) {
  const original = globalThis.fetch;
  const handled = new Map();
  globalThis.fetch = async (input, options) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url !== "https://api.resend.com/emails" || options?.method !== "POST") return original(input, options);
    const key = new Headers(options.headers).get("idempotency-key");
    if (key && handled.has(key)) return Response.json({ id: handled.get(key) });
    const message = JSON.parse(options.body);
    const id = randomUUID();
    if (key) handled.set(key, id);
    await appendFile(mailbox, `${JSON.stringify({ to: message.to, subject: message.subject, text: message.text })}\n`, "utf8");
    return Response.json({ id });
  };
}
