import { featureFlags } from "@/lib/apiClient";
export type {
  RoleCode,
  RoleIdentityKind,
  RoleScopeLevel,
} from "@/contexts/RoleScopeContext";
import type {
  RoleCode,
  RoleIdentityKind,
  RoleScopeLevel,
} from "@/contexts/RoleScopeContext";

export type RoleNavigationItem = {
  path: string;
  label: string;
  purpose: string;
  permission?: string;
  anyOfPermissions?: readonly string[] | string[];
  featureKey?: string;
};

export type RoleDefinition = {
  code: RoleCode;
  label: string;
  identityKind: RoleIdentityKind;
  scopeLevel: RoleScopeLevel;
  defaultScopeLabel: string;
  homePath: string;
  backPath: string;
  navigation: readonly RoleNavigationItem[];
};

/**
 * Shared UX registry for navigation and display with dynamic permission bindings.
 * The backend remains authoritative for permissions and tenant/branch scope enforcement.
 */
export const ROLE_DEFINITIONS: Record<RoleCode, RoleDefinition> = {
  R00: {
    code: "R00",
    label: "أدمن منصة مدى",
    identityKind: "staff",
    scopeLevel: "platform",
    defaultScopeLabel: "كل الأكاديميات · metadata فقط",
    homePath: "/platform-console",
    backPath: "/platform-console",
    navigation: [
      { path: "/platform-console", label: "إدارة الأكاديميات", purpose: "tenants, plans, support", permission: "platform.read" },
      { path: "/platform/academies/new", label: "إنشاء أكاديمية جديدة", purpose: "bootstrap new academy", permission: "platform.read" },
    ],
  },
  R01: {
    code: "R01",
    label: "مسؤول الأكاديمية",
    identityKind: "staff",
    scopeLevel: "tenant",
    defaultScopeLabel: "كل فروع الأكاديمية",
    homePath: "/executive-dashboard",
    backPath: "/executive-dashboard",
    navigation: [
      { path: "/executive-dashboard", label: "لوحة القيادة", purpose: "academy rollup and branch comparison", permission: "academy.read" },
      { path: "/academy-owner/pnl-retention", label: "الأرباح والتحليلات", purpose: "multi-unit pnl and student retention analytics", permission: "reports.read" },
      { path: "/academy/branches", label: "إدارة الفروع", purpose: "branch lifecycle and manager delegation", anyOfPermissions: ["branch.read", "branch.create"] },
      { path: "/academy/roles", label: "فريق العمل والصلاحيات", purpose: "members, roles, permissions", anyOfPermissions: ["roles.read", "roles.manage"] },
      { path: "/academy/audit-trail", label: "سجل العمليات والرقابة", purpose: "academy audit logs and event tracing", permission: "reports.read" },
      { path: "/nursery-desk", label: "الحضانة والطفولة المبكرة", purpose: "nursery desk and early childhood cohorts", permission: "academy.read", featureKey: "nursery_early_childhood" },
    ],
  },
  R02: {
    code: "R02",
    label: "مدير الفرع",
    identityKind: "staff",
    scopeLevel: "branch",
    defaultScopeLabel: "فرع واحد",
    homePath: "/",
    backPath: "/",
    navigation: [
      { path: "/", label: "الرئيسية", purpose: "daily branch decisions and operations", permission: "branch.read" },
      { path: "/classes", label: "المجموعات والكورسات", purpose: "branch groups, courses, rooms, kits readiness, and creating cohorts", permission: "sessions.read" },
      { path: "/schedule", label: "جدول الحصص والقاعات", purpose: "branch schedule and conflict resolution", permission: "sessions.read" },
      { path: "/students", label: "الطلاب والاشتراكات", purpose: "branch student records, freezes, and waitlists", anyOfPermissions: ["students.read", "students.create"] },
      { path: "/nursery-desk", label: "الحضانة والطفولة المبكرة", purpose: "nursery daily desk and cohorts", permission: "branch.read", featureKey: "nursery_early_childhood" },
      { path: "/team", label: "فريق العمل", purpose: "branch staff, instructors, and status", permission: "branch.read" },
      { path: "/competitions", label: "البطولات والمشاريع", purpose: "branch competitions, tracks, teams and kits", permission: "branch.read" },
      { path: "/approvals", label: "الموافقات والمصروفات", purpose: "substitutions, expenses, and freeze decisions", anyOfPermissions: ["sessions.create", "finance.expenses.approve"] },
    ],
  },
  R03: {
    code: "R03",
    label: "رئيس المدربين",
    identityKind: "staff",
    scopeLevel: "branch",
    defaultScopeLabel: "المجموعات المسندة للإشراف وحصص التدريب",
    homePath: "/head-instructors",
    backPath: "/head-instructors",
    navigation: [
      { path: "/head-instructors", label: "الإشراف والتقييمات", purpose: "evaluation review and supervised groups", permission: "branch.read" },
      { path: "/instructor-desk", label: "حصصي المباشرة", purpose: "instructor teaching desk, attendance, and student evaluations", permission: "sessions.assigned.read" },
      { path: "/academic-programs", label: "المناهج والحقائب", purpose: "curriculum and progress review", permission: "branch.read" },
      { path: "/schedule", label: "جداول المدربين", purpose: "sessions in supervision scope", permission: "sessions.read" },
    ],
  },
  R04: {
    code: "R04",
    label: "المدرب",
    identityKind: "staff",
    scopeLevel: "assigned",
    defaultScopeLabel: "الجلسات والطلاب المسندون",
    homePath: "/instructor-desk",
    backPath: "/instructor-desk",
    navigation: [
      { path: "/instructor-desk", label: "حصصي والتقييم", purpose: "today, attendance, evaluation", anyOfPermissions: ["sessions.assigned.read", "attendance.write", "evaluations.write"] },
      { path: "/schedule", label: "جدول الحصص", purpose: "assigned session schedule", permission: "sessions.assigned.read" },
    ],
  },
  R05: {
    code: "R05",
    label: "السكرتارية",
    identityKind: "staff",
    scopeLevel: "branch",
    defaultScopeLabel: "التسجيلات والـleads داخل الفرع",
    homePath: "/secretary-desk",
    backPath: "/secretary-desk",
    navigation: [
      { path: "/secretary-desk", label: "الاستقبال والعملاء", purpose: "lead to enrollment", permission: "branch.read" },
      { path: "/classes", label: "المجموعات والشواغر", purpose: "view active groups, enroll students, and create cohorts", anyOfPermissions: ["sessions.read", "branch.read"] },
      { path: "/finance-desk", label: "التحصيل والخزينة", purpose: "branch-scoped collections and payments", anyOfPermissions: ["invoices.read", "invoices.create", "payments.create", "payments.evidence.read"] },
      { path: "/students", label: "الطلاب وأولياء الأمور", purpose: "branch operational records", anyOfPermissions: ["students.read", "students.create"] },
      { path: "/schedule", label: "جدول القاعات", purpose: "enrollment availability", permission: "sessions.read" },
    ],
  },
  R06: {
    code: "R06",
    label: "المحاسب",
    identityKind: "staff",
    scopeLevel: "branch",
    defaultScopeLabel: "المالية داخل الفروع المصرح بها",
    homePath: "/finance-desk",
    backPath: "/finance-desk",
    navigation: [
      { path: "/finance-desk", label: "المركز المالي", purpose: "collections, expenses, reports", anyOfPermissions: ["finance.read", "invoices.read", "payments.create", "finance.expenses.read"] },
      { path: "/finance-desk#collections", label: "الفواتير وسندات القبض", purpose: "invoices and collections", anyOfPermissions: ["invoices.read", "payments.create"] },
      { path: "/finance-desk#expenses", label: "المصروفات", purpose: "manage expenses", anyOfPermissions: ["finance.expenses.read", "finance.expenses.create"] },
      { path: "/finance-desk#shifts", label: "ورديات الكاش", purpose: "shifts cash handover", permission: "finance.read" },
      { path: "/finance-desk#payroll", label: "أجور المدربين", purpose: "trainer payroll calculation", permission: "finance.read" },
      { path: "/reports", label: "التقارير المالية", purpose: "finance and operational read-only reports", permission: "reports.read" },
    ],
  },
  R07: {
    code: "R07",
    label: "مسؤول التسويق",
    identityKind: "staff",
    scopeLevel: "branch",
    defaultScopeLabel: "فرع واحد · المحتوى والحملات والـmarketing leads",
    homePath: "/marketing-desk",
    backPath: "/marketing-desk",
    navigation: [
      { path: "/marketing-desk", label: "التسويق والعملاء المحتملين", purpose: "campaigns, content, leads", permission: "marketing.read" },
    ],
  },
  R08: {
    code: "R08",
    label: "ولي الأمر",
    identityKind: "consumer",
    scopeLevel: "family",
    defaultScopeLabel: "الأطفال المرتبطون فقط",
    homePath: "/family-portal",
    backPath: "/family-portal",
    navigation: [
      { path: "/family-portal", label: "الرئيسية", purpose: "children, overview", permission: "consumer.students.read" },
      { path: "/family-portal#attendance", label: "سجل الحضور", purpose: "attendance records", permission: "consumer.students.read" },
      { path: "/family-portal#evaluations", label: "التقييمات والتقارير", purpose: "evaluations", permission: "consumer.students.read" },
      { path: "/family-portal#invoices", label: "الاشتراكات والمدفوعات", purpose: "invoices, payments", permission: "consumer.students.read" },
      { path: "/family-portal#freeze", label: "الطلبات والتعويضات", purpose: "freeze, makeup credits", permission: "consumer.students.read" },
    ],
  },
  R09: {
    code: "R09",
    label: "الطالب",
    identityKind: "consumer",
    scopeLevel: "self",
    defaultScopeLabel: "حساب الطالب فقط",
    homePath: "/student-portal",
    backPath: "/student-portal",
    navigation: [
      { path: "/student-portal", label: "الرئيسية", purpose: "learning path, overview", permission: "consumer.self.read" },
      { path: "/student-portal#sessions", label: "حصصي وجدولي", purpose: "sessions schedule", permission: "consumer.self.read" },
      { path: "/student-portal#progress", label: "إنجازاتي وشهاداتي", purpose: "progress, achievements", permission: "consumer.self.read" },
    ],
  },
};

export function isNavigationItemAllowed(
  item: RoleNavigationItem,
  permissions?: readonly string[] | string[]
): boolean {
  if (item.featureKey && !featureFlags.isFeatureEnabled(item.featureKey)) {
    return false;
  }
  if (!permissions) return true;
  if (item.permission && !permissions.includes(item.permission)) {
    return false;
  }
  if (item.anyOfPermissions && item.anyOfPermissions.length > 0) {
    const hasAny = item.anyOfPermissions.some((p) => permissions.includes(p));
    if (!hasAny) return false;
  }
  return true;
}

export function getAuthorizedNavigation(
  roleCode: RoleCode,
  permissions?: readonly string[] | string[]
): RoleNavigationItem[] {
  const def = ROLE_DEFINITIONS[roleCode];
  if (!def) return [];
  if (!permissions) return [...def.navigation];
  return def.navigation.filter((item) => isNavigationItemAllowed(item, permissions));
}

export function getRoleDefinition(roleCode: RoleCode) {
  return ROLE_DEFINITIONS[roleCode];
}

export function getRoleHomePath(roleCode: RoleCode) {
  return ROLE_DEFINITIONS[roleCode].homePath;
}

export function getRoleBackPath(roleCode: RoleCode) {
  return ROLE_DEFINITIONS[roleCode].backPath;
}
