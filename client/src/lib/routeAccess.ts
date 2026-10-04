import type { AuthMe } from "./apiClient";

export function isRouteAllowed(me: AuthMe, roles?: string[], permission?: string) {
  return (!roles || roles.includes(me.role)) && (!permission || me.permissions?.includes(permission) === true);
}
