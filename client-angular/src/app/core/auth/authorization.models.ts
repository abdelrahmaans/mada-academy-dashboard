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
  | 'invoices.read'
  | 'invoices.create'
  | 'payments.create'
  | 'payments.evidence.read'
  | 'payments.evidence.write'
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

export type EndpointKey =
  | 'auth.session'
  | 'platform.admin'
  | 'academy.admin'
  | 'dashboard.summary'
  | 'students.read'
  | 'students.write'
  | 'student.enrollments'
  | 'sessions.read'
  | 'sessions.assigned.read'
  | 'sessions.manage'
  | 'attendance.read'
  | 'attendance.write'
  | 'supervision.manage'
  | 'supervision.read'
  | 'evaluations.write'
  | 'evaluations.review'
  | 'notifications.read'
  | 'finance.invoices'
  | 'consumer.invitations'
  | 'finance.expenses'
  | 'finance.reports'
  | 'reports.operational'
  | 'consumer.links'
  | 'consumer.portal'
  | 'consumer.invoices'
  | 'marketing';

export const ENDPOINT_ROLES: Readonly<Record<EndpointKey, readonly StaffRoleCode[]>> = {
  'auth.session': ['R00_PLATFORM_ADMIN', 'R01_ACADEMY_OWNER', 'R02_BRANCH_MANAGER', 'R03_HEAD_INSTRUCTORS', 'R04_INSTRUCTOR', 'R05_SECRETARY', 'R06_ACCOUNTANT', 'R07_MEDIA_MANAGER', 'R08_PARENT', 'R09_STUDENT'],
  'platform.admin': ['R00_PLATFORM_ADMIN'],
  'academy.admin': ['R01_ACADEMY_OWNER'],
  'dashboard.summary': ['R01_ACADEMY_OWNER', 'R02_BRANCH_MANAGER'],
  'students.read': ['R01_ACADEMY_OWNER', 'R02_BRANCH_MANAGER', 'R03_HEAD_INSTRUCTORS', 'R04_INSTRUCTOR', 'R05_SECRETARY', 'R06_ACCOUNTANT'],
  'students.write': ['R02_BRANCH_MANAGER', 'R05_SECRETARY'],
  'student.enrollments': ['R02_BRANCH_MANAGER', 'R05_SECRETARY'],
  'sessions.read': ['R01_ACADEMY_OWNER', 'R02_BRANCH_MANAGER', 'R03_HEAD_INSTRUCTORS', 'R04_INSTRUCTOR', 'R05_SECRETARY', 'R06_ACCOUNTANT'],
  'sessions.assigned.read': ['R04_INSTRUCTOR'],
  'sessions.manage': ['R01_ACADEMY_OWNER', 'R02_BRANCH_MANAGER'],
  'attendance.read': ['R01_ACADEMY_OWNER', 'R02_BRANCH_MANAGER', 'R03_HEAD_INSTRUCTORS', 'R04_INSTRUCTOR', 'R05_SECRETARY', 'R06_ACCOUNTANT'],
  'attendance.write': ['R02_BRANCH_MANAGER', 'R04_INSTRUCTOR'],
  'supervision.manage': ['R02_BRANCH_MANAGER'],
  'supervision.read': ['R03_HEAD_INSTRUCTORS'],
  'evaluations.write': ['R03_HEAD_INSTRUCTORS', 'R04_INSTRUCTOR'],
  'evaluations.review': ['R03_HEAD_INSTRUCTORS'],
  'notifications.read': ['R00_PLATFORM_ADMIN', 'R01_ACADEMY_OWNER', 'R02_BRANCH_MANAGER', 'R03_HEAD_INSTRUCTORS', 'R04_INSTRUCTOR', 'R05_SECRETARY', 'R06_ACCOUNTANT', 'R07_MEDIA_MANAGER'],
  'finance.invoices': ['R05_SECRETARY', 'R06_ACCOUNTANT'],
  'consumer.invitations': ['R01_ACADEMY_OWNER', 'R02_BRANCH_MANAGER', 'R05_SECRETARY'],
  'finance.expenses': ['R01_ACADEMY_OWNER', 'R02_BRANCH_MANAGER', 'R06_ACCOUNTANT'],
  'finance.reports': ['R01_ACADEMY_OWNER', 'R02_BRANCH_MANAGER', 'R06_ACCOUNTANT'],
  'reports.operational': ['R01_ACADEMY_OWNER', 'R02_BRANCH_MANAGER', 'R06_ACCOUNTANT'],
  'consumer.links': ['R01_ACADEMY_OWNER', 'R02_BRANCH_MANAGER', 'R05_SECRETARY'],
  'consumer.portal': ['R08_PARENT', 'R09_STUDENT'],
  'consumer.invoices': ['R08_PARENT', 'R09_STUDENT'],
  marketing: ['R07_MEDIA_MANAGER'],
};

export const ENDPOINT_PERMISSIONS: Readonly<Partial<Record<EndpointKey, readonly PermissionKey[]>>> = {
  'dashboard.summary': ['branch.read'],
  'students.read': ['students.read'],
  'students.write': ['students.create'],
  'student.enrollments': ['students.create'],
  'sessions.assigned.read': ['sessions.assigned.read'],
  'sessions.manage': ['sessions.create'],
  'attendance.read': ['attendance.read'],
  'attendance.write': ['attendance.write'],
  'evaluations.write': ['evaluations.write'],
  'evaluations.review': ['evaluations.review'],
  'finance.invoices': ['invoices.read'],
  'finance.expenses': ['finance.expenses.read'],
  'finance.reports': ['reports.read'],
  'reports.operational': ['reports.read'],
  marketing: ['marketing.read'],
};

export function hasRole(me: AuthMe | null, roles: readonly StaffRoleCode[]): boolean {
  return me !== null && roles.includes(me.role as StaffRoleCode);
}

export function hasPermissions(me: AuthMe | null, permissions: readonly PermissionKey[], requireAll = true): boolean {
  if (!me) return false;
  const granted = new Set(me.permissions ?? []);
  return requireAll ? permissions.every((permission) => granted.has(permission)) : permissions.some((permission) => granted.has(permission));
}
