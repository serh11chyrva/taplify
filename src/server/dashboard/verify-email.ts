import "server-only";
import { dashboardDestination } from "@/lib/dashboard-destination";
import { getAuth } from "@/server/auth";
import { DashboardError } from "./errors";
import { mailConfigured } from "./mail";

export async function requestOwnVerification(headers: Headers, email: string, next: string) {
  if (!mailConfigured()) throw new DashboardError(503, "MAIL_NOT_CONFIGURED", "Email delivery is not configured.");
  const auth = await getAuth();
  await auth.api.sendVerificationEmail({
    headers,
    body: { email, callbackURL: dashboardDestination(next) },
  });
  return { requested: true };
}
