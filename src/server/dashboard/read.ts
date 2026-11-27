import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { DashboardError } from "./errors";
import { dashboardFeatures } from "./features";
import { requireOrganization, type OrganizationPermission } from "./organizations";
import { requireDashboardSession } from "./session";

export async function dashboardRead<T>(load: () => Promise<T>) {
  try {
    return await load();
  } catch (error) {
    if (error instanceof DashboardError && (error.status === 403 || error.status === 404)) notFound();
    throw error;
  }
}

export const workspace = cache(async (organizationId: string, permission?: OrganizationPermission) => {
  const session = await requireDashboardSession();
  if (!dashboardFeatures().dashboard) notFound();
  const organization = await dashboardRead(() => requireOrganization(session.user.id, organizationId, permission));
  return { user: session.user, organization };
});
