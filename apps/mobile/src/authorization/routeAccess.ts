import type { AuthIdentity } from "../auth/types";
import { INSTRUCTOR_ROLE, isAccountTypeCompatible } from "./roles";

export type MobileRoute = "home" | "schedule" | "tasks" | "account";

export type MobileTab = {
  route: MobileRoute;
  label: string;
  href: string;
};

const ROUTE_POLICIES: Record<
  MobileRoute,
  {
    roles: readonly string[];
    allPermissions?: readonly string[];
    anyPermissions?: readonly string[];
  }
> = {
  home: {
    roles: [INSTRUCTOR_ROLE],
    anyPermissions: [
      "sessions.assigned.read",
      "attendance.read",
      "evaluations.write",
    ],
  },
  schedule: {
    roles: [INSTRUCTOR_ROLE],
    allPermissions: ["sessions.assigned.read"],
  },
  tasks: {
    roles: [INSTRUCTOR_ROLE],
    anyPermissions: ["attendance.write", "evaluations.write"],
  },
  account: { roles: [INSTRUCTOR_ROLE] },
};

const TAB_DEFINITIONS: readonly MobileTab[] = [
  { route: "home", label: "الرئيسية", href: "/(instructor)" },
  { route: "schedule", label: "الجدول", href: "/(instructor)/schedule" },
  { route: "tasks", label: "المهام", href: "/(instructor)/tasks" },
  { route: "account", label: "حسابي", href: "/(instructor)/account" },
];

export function hasPermission(identity: AuthIdentity, permission: string) {
  return identity.permissions.includes(permission);
}

export function canAccessMobileRoute(
  identity: AuthIdentity | null,
  route: MobileRoute
) {
  if (
    !identity ||
    !isAccountTypeCompatible(identity.role, identity.accountType)
  )
    return false;
  const policy = ROUTE_POLICIES[route];
  if (!policy.roles.includes(identity.role)) return false;
  if (
    policy.allPermissions?.some(
      permission => !hasPermission(identity, permission)
    )
  )
    return false;
  if (
    policy.anyPermissions?.length &&
    !policy.anyPermissions.some(permission =>
      hasPermission(identity, permission)
    )
  )
    return false;
  return true;
}

export function getVisibleMobileTabs(identity: AuthIdentity | null) {
  return TAB_DEFINITIONS.filter(tab =>
    canAccessMobileRoute(identity, tab.route)
  );
}
