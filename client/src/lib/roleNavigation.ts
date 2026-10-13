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
      { path: "/platform-console", label: "مركز المنصة", purpose: "tenants, plans, support", permission: "platform.read" },
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
      { path: "/executive-dashboard", label: "اللوحة التنفيذية", purpose: "academy rollup and decisions", permission: "academy.read" },
      { path: "/academy-owner", label: "نظرة عامة", purpose: "academy overview", permission: "academy.read" },
      { path: "/academy-owner/branches", label: "الفروع والأداء", purpose: "academy branch rollup", permission: "branch.read" },
      { path: "/academy-owner/tickets", label: "مركز التذاكر", purpose: "academy tickets", permission: "academy.read" },
      { path: "/academy-owner/reports", label: "التقارير المجمعة", purpose: "academy rollup reports", permission: "reports.read" },
      { path: "/academy/branches", label: "إدارة الفروع", purpose: "branch lifecycle and assignment", anyOfPermissions: ["branch.read", "branch.create"] },
      { path: "/academy/classrooms", label: "القاعات الدراسية", purpose: "classrooms, capacity and readiness", permission: "classrooms.manage" },
      { path: "/academy/roles", label: "المستخدمون والصلاحيات", purpose: "members, roles, permissions", anyOfPermissions: ["roles.read", "roles.manage"] },
      { path: "/reports", label: "التقارير", purpose: "scoped reports and export", permission: "reports.read" },
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
      { path: "/", label: "ملخص التشغيل", purpose: "daily branch decisions", permission: "branch.read" },
      { path: "/students", label: "الطلاب", purpose: "branch student records", anyOfPermissions: ["students.read", "students.create"] },
      { path: "/schedule", label: "الجدول", purpose: "branch scheduling", permission: "sessions.read" },
      { path: "/classes", label: "الحصص والكورسات", purpose: "branch learning operations", permission: "sessions.read" },
      { path: "/branch-operations", label: "تشغيل الفرع", purpose: "teams, schedule, conflicts", permission: "branch.read" },
      { path: "/team", label: "الفريق والأدوار", purpose: "branch team", permission: "branch.read" },
      { path: "/supervision-assignments", label: "متابعة المجموعات", purpose: "manager-issued group supervision access", permission: "branch.read" },
      { path: "/approvals", label: "الموافقات", purpose: "branch decisions", anyOfPermissions: ["sessions.create", "finance.expenses.approve"] },
      { path: "/reports", label: "التقارير", purpose: "branch reports", anyOfPermissions: ["reports.read", "finance.summary.read"] },
    ],
  },
  R03: {
    code: "R03",
    label: "رئيس المدربين",
    identityKind: "staff",
    scopeLevel: "branch",
    defaultScopeLabel: "فرع واحد · فريق المدربين والجلسات التابعة",
    homePath: "/head-instructors",
    backPath: "/head-instructors",
    navigation: [
      { path: "/head-instructors", label: "ملخص الفريق", purpose: "branch-scoped evaluation review and team overview", permission: "branch.read" },
      { path: "/academic-programs", label: "البرامج الأكاديمية", purpose: "curriculum and progress review", permission: "branch.read" },
      { path: "/schedule", label: "جدول الفريق", purpose: "sessions in supervision scope", permission: "sessions.read" },
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
      { path: "/instructor-desk", label: "مكتب المدرب", purpose: "today, attendance, evaluation", anyOfPermissions: ["sessions.assigned.read", "attendance.write", "evaluations.write"] },
      { path: "/schedule", label: "جدول الجلسات", purpose: "assigned session schedule", permission: "sessions.assigned.read" },
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
      { path: "/secretary-desk", label: "مكتب الخدمة", purpose: "lead to enrollment", permission: "branch.read" },
      { path: "/finance-desk", label: "التحصيل والفواتير", purpose: "branch-scoped collections and payments", anyOfPermissions: ["invoices.read", "invoices.create", "payments.create", "payments.evidence.read"] },
      { path: "/students", label: "الطلاب", purpose: "branch operational records", anyOfPermissions: ["students.read", "students.create"] },
      { path: "/schedule", label: "المجموعات والمواعيد", purpose: "enrollment availability", permission: "sessions.read" },
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
      { path: "/finance-desk", label: "المكتب المالي", purpose: "collections, expenses, reports", anyOfPermissions: ["finance.read", "invoices.read", "payments.create", "finance.expenses.read"] },
      { path: "/approvals", label: "الموافقات", purpose: "finance decisions", permission: "finance.expenses.approve" },
      { path: "/reports", label: "التقارير", purpose: "finance and operational read-only reports", permission: "reports.read" },
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
      { path: "/marketing-desk", label: "مكتب التسويق", purpose: "campaigns, content, leads", permission: "marketing.read" },
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
      { path: "/family-portal", label: "بوابة الأسرة", purpose: "children, attendance, evaluations, invoices", permission: "consumer.students.read" },
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
      { path: "/student-portal", label: "مساحة الطالب", purpose: "learning, sessions, achievements", permission: "consumer.self.read" },
    ],
  },
};

export function isNavigationItemAllowed(
  item: RoleNavigationItem,
  permissions?: readonly string[] | string[]
): boolean {
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
