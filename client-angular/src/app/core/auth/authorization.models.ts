import type { AuthMe } from './auth.models';

export type StaffRoleCode =
  | 'R00_PLATFORM_ADMIN'
  | 'R01_ACADEMY_OWNER'
  | 'R02_BRANCH_MANAGER'
  | 'R03_HEAD_INSTRUCTORS'
  | 'R04_INSTRUCTOR'
  | 'R05_SECRETARY'
  | 'R06_ACCOUNTANT'
  | 'R07_MEDIA_MANAGER'
  | 'R08_PARENT'
  | 'R09_STUDENT';

export type PermissionKey =
  | 'academy.read'
  | 'academy.update'
  | 'branch.read'
  | 'branch.create'
  | 'classrooms.manage'
  | 'staff.read'
  | 'staff.invite'
  | 'roles.read'
  | 'roles.manage'
  | 'students.read'
  | 'students.create'
  | 'sessions.read'
  | 'sessions.create'
  | 'sessions.assigned.read'
  | 'attendance.read'
  | 'attendance.write'
  | 'evaluations.write'
  | 'evaluations.review'
  | 'finance.read'
  | 'finance.expenses.read'
  | 'finance.expenses.write'
  | 'finance.expenses.approve'
  | 'marketing.read'
  | 'marketing.write'
  | 'reports.read'
  | 'platform.read'
  | 'academy.create';

export interface AuthorizationPolicy {
  readonly roles?: readonly StaffRoleCode[];
  readonly permissions?: readonly PermissionKey[];
  readonly requireAllPermissions?: boolean;
}

export function hasRole(me: AuthMe | null, roles: readonly StaffRoleCode[]): boolean {
  return me !== null && roles.includes(me.role as StaffRoleCode);
}

export function hasPermissions(
  me: AuthMe | null,
  permissions: readonly PermissionKey[],
  requireAll = true,
): boolean {
  if (!me) return false;
  const granted = new Set(me.permissions ?? []);
  return requireAll
    ? permissions.every((permission) => granted.has(permission))
    : permissions.some((permission) => granted.has(permission));
}
