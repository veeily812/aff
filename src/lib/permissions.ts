import type { Role } from "@/generated/prisma/enums";

export type { Role };

const ASSIGNABLE_ROLES_BY_ACTOR: Record<Role, Role[]> = {
  OWNER: ["SECONDARY_ADMIN", "MANAGER", "STAFF", "CHANNEL_STAFF"],
  SECONDARY_ADMIN: ["MANAGER", "STAFF", "CHANNEL_STAFF"],
  MANAGER: [],
  STAFF: [],
  CHANNEL_STAFF: [],
};

export function canAccessUsersPage(role: Role): boolean {
  return role === "OWNER" || role === "SECONDARY_ADMIN";
}

export function canManageChannels(role: Role): boolean {
  return role === "OWNER" || role === "SECONDARY_ADMIN";
}

export function assignableRoles(actorRole: Role): Role[] {
  return ASSIGNABLE_ROLES_BY_ACTOR[actorRole];
}

export function canManageTargetRole(actorRole: Role, targetRole: Role): boolean {
  return ASSIGNABLE_ROLES_BY_ACTOR[actorRole].includes(targetRole);
}

export function canDeleteContent(role: Role): boolean {
  return role === "OWNER" || role === "SECONDARY_ADMIN" || role === "MANAGER";
}

export function canImportContent(role: Role): boolean {
  return role === "OWNER" || role === "SECONDARY_ADMIN" || role === "MANAGER";
}

/**
 * Returns the channel a user is restricted to, or null if they can see everything.
 * Only CHANNEL_STAFF is scoped; all other roles have no channel restriction.
 */
export function getChannelScope(user: { role: Role; channelId: string | null }): string | null {
  return user.role === "CHANNEL_STAFF" ? user.channelId : null;
}
