import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authDestination, dashboardDestination, dashboardDestinationHeader } from "@/lib/dashboard-destination";
import { getSession } from "@/server/services/session";

export const requireDashboardSession = cache(async () => {
  const requestHeaders = await headers();
  const session = await getSession(requestHeaders);
  if (!session) {
    redirect(authDestination("/sign-in", dashboardDestination(requestHeaders.get(dashboardDestinationHeader))));
  }
  return session;
});
