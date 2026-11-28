import { z } from "zod";
import { resourceId } from "./organizations";

export const teamRole = z.enum(["editor", "operator"]);
export type TeamRole = z.infer<typeof teamRole>;
export const roleLabels = { owner: "Owner", editor: "Editor", operator: "Operator" } as const;
export const inviteInput = z.object({
  email: z.string().trim().max(254).toLowerCase().pipe(z.email()),
  role: teamRole,
  requestId: resourceId,
});

export type OrganizationInvitation = {
  id: string;
  email: string;
  role: TeamRole;
  state: "pending" | "accepted" | "revoked" | "expired";
  delivery: "pending" | "sent" | "failed";
  expiresAt: string;
};

export function invitationPath(invitationId: string) {
  return `/dashboard/invitations/${invitationId}`;
}
