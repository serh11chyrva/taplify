import "server-only";
import { z } from "zod";
import { DashboardError } from "./errors";

const mailEnvironment = z.object({
  RESEND_API_KEY: z.string().trim().min(1),
  TAPLIFY_MAIL_FROM: z.string().trim().min(3).max(254).refine((value) => !/[\r\n]/.test(value)),
});

export function mailConfigured() {
  return mailEnvironment.safeParse(process.env).success;
}

export async function sendTransactionalMail(message: { recipient: string; subject: string; text: string; requestKey: string }) {
  const result = mailEnvironment.safeParse(process.env);
  if (!result.success) throw new DashboardError(503, "MAIL_NOT_CONFIGURED", "Email delivery is not configured.");
  const { RESEND_API_KEY, TAPLIFY_MAIL_FROM } = result.data;
  const unavailable = () => new DashboardError(503, "MAIL_UNAVAILABLE", "Email delivery is temporarily unavailable. Please try again.");
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": message.requestKey,
      },
      body: JSON.stringify({ from: TAPLIFY_MAIL_FROM, to: [message.recipient], subject: message.subject, text: message.text }),
    });
  } catch {
    throw unavailable();
  }
  if (!response.ok) throw unavailable();
}
