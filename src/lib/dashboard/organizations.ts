import { z } from "zod";

export const resourceId = z.uuid();
export const organizationName = z.string().trim().min(1, "Enter an organization name.").max(45);
export const organizationInput = z.object({ name: organizationName });
export const lastOrganizationCookie = "taplify_last_organization";

export type OrganizationRole = "owner" | "editor" | "operator";

export type OrganizationSummary = {
  id: string;
  name: string;
  personal: boolean;
  role: OrganizationRole;
};

export function organizationPath(organizationId: string) {
  return `/dashboard/${organizationId}`;
}

export function organizationApiPath(organizationId: string) {
  return `/api/organizations/${organizationId}`;
}
