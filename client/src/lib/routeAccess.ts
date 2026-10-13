import type { AuthMe } from "./apiClient";

export type RouteGuardOptions = {
  roles?: readonly string[] | string[];
  permission?: string;
  anyOfPermissions?: readonly string[] | string[];
};

export function isRouteAllowed(
  me: AuthMe,
  roles?: readonly string[] | string[],
  permission?: string,
  anyOfPermissions?: readonly string[] | string[]
): boolean {
  const normalizedRole = me.role.match(/^R\d+/)?.[0] ?? me.role;
  const userPermissions = me.permissions ?? [];

  // 1. If an exact permission is required, user must possess it
  if (permission && !userPermissions.includes(permission)) {
    return false;
  }

  // 2. If anyOfPermissions is provided, user must possess at least one
  if (anyOfPermissions && anyOfPermissions.length > 0) {
    const hasAny = anyOfPermissions.some((p) => userPermissions.includes(p));
    if (!hasAny) return false;
  }

  // 3. If roles are restricted, current role (or normalized code) must match
  if (roles && roles.length > 0) {
    const roleMatches = roles.includes(me.role) || roles.includes(normalizedRole);
    if (!roleMatches) return false;
  }

  return true;
}
