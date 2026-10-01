import type {
  RoleCode,
  RoleIdentityKind,
  RoleScopeLevel,
} from "@/contexts/RoleScopeContext";

export type RoleNavigationItem = {
  path: string;
  label: string;
  purpose: string;
};

export type RoleDefinition = {
  code: RoleCode;
  label: string;
  identityKind: RoleIdentityKind;
  scopeLevel: RoleScopeLevel;
  defaultScopeLabel: string;
  homePath: string;
  navigation: readonly RoleNavigationItem[];
};

/**
 * Shared UX registry for navigation and display only; it is not API authorization.
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
    navigation: [
      { path: "/platform-console", label: "مركز المنصة", purpose: "tenants, plans, support" },
    ],
  },
  R01: {
    code: "R01",
    label: "مسؤول الأكاديمية",
    identityKind: "staff",
    scopeLevel: "tenant",
    defaultScopeLabel: "كل فروع الأكاديمية",
    homePath: "/executive-dashboard",
    navigation: [
      { path: "/executive-dashboard", label: "اللوحة التنفيذية", purpose: "academy rollup and decisions" },
      { path: "/academy-owner", label: "إدارة الأكاديمية", purpose: "branches, team, tickets" },
      { path: "/academy/branches", label: "إدارة الفروع", purpose: "branch lifecycle and assignment" },
      { path: "/academy/classrooms", label: "القاعات الدراسية", purpose: "classrooms, capacity and readiness" },
      { path: "/academy/roles", label: "المستخدمون والصلاحيات", purpose: "members, roles, permissions" },
      { path: "/reports", label: "التقارير", purpose: "scoped reports and export" },
    ],
  },
  R02: {
    code: "R02",
    label: "مدير الفرع",
    identityKind: "staff",
    scopeLevel: "branch",
    defaultScopeLabel: "فرع واحد",
    homePath: "/",
    navigation: [
      { path: "/", label: "ملخص التشغيل", purpose: "daily branch decisions" },
      { path: "/branch-operations", label: "تشغيل الفرع", purpose: "teams, schedule, conflicts" },
      { path: "/classes", label: "الحصص والكورسات", purpose: "branch learning operations" },
      { path: "/approvals", label: "الموافقات", purpose: "branch decisions" },
      { path: "/reports", label: "التقارير", purpose: "branch reports" },
    ],
  },
  R03: {
    code: "R03",
    label: "رئيس المدربين",
    identityKind: "staff",
    scopeLevel: "branch",
    defaultScopeLabel: "فرع واحد · فريق المدربين والجلسات التابعة",
    homePath: "/head-instructors",
    navigation: [
      { path: "/head-instructors", label: "ملخص الفريق", purpose: "branch-scoped evaluation review and team overview" },
      { path: "/academic-programs", label: "البرامج الأكاديمية", purpose: "curriculum and progress review" },
      { path: "/schedule", label: "جدول الفريق", purpose: "sessions in supervision scope" },
    ],
  },
  R04: {
    code: "R04",
    label: "المدرب",
    identityKind: "staff",
    scopeLevel: "assigned",
    defaultScopeLabel: "الجلسات والطلاب المسندون",
    homePath: "/instructor-desk",
    navigation: [
      { path: "/instructor-desk", label: "مكتب المدرب", purpose: "today, attendance, evaluation" },
      { path: "/instructor", label: "مساحتي الأكاديمية", purpose: "assigned students and progress" },
    ],
  },
  R05: {
    code: "R05",
    label: "السكرتارية",
    identityKind: "staff",
    scopeLevel: "branch",
    defaultScopeLabel: "التسجيلات والـleads داخل الفرع",
    homePath: "/secretary-desk",
    navigation: [
      { path: "/secretary-desk", label: "مكتب الخدمة", purpose: "lead to enrollment" },
      { path: "/students", label: "الطلاب", purpose: "branch operational records" },
      { path: "/schedule", label: "المجموعات والمواعيد", purpose: "enrollment availability" },
    ],
  },
  R06: {
    code: "R06",
    label: "المحاسب",
    identityKind: "staff",
    scopeLevel: "branch",
    defaultScopeLabel: "المالية داخل الفروع المصرح بها",
    homePath: "/finance-desk",
    navigation: [
      { path: "/finance-desk", label: "المكتب المالي", purpose: "collections, expenses, reports" },
      { path: "/finance", label: "الماليات", purpose: "invoice and correction workflows" },
      { path: "/approvals", label: "الموافقات", purpose: "finance decisions" },
    ],
  },
  R07: {
    code: "R07",
    label: "مسؤول التسويق",
    identityKind: "staff",
    scopeLevel: "branch",
    defaultScopeLabel: "فرع واحد · المحتوى والحملات والـmarketing leads",
    homePath: "/marketing-desk",
    navigation: [
      { path: "/marketing-desk", label: "مكتب التسويق", purpose: "campaigns, content, leads" },
    ],
  },
  R08: {
    code: "R08",
    label: "ولي الأمر",
    identityKind: "consumer",
    scopeLevel: "family",
    defaultScopeLabel: "الأطفال المرتبطون فقط",
    homePath: "/family-portal",
    navigation: [
      { path: "/family-portal", label: "بوابة الأسرة", purpose: "children, attendance, evaluations, invoices" },
    ],
  },
  R09: {
    code: "R09",
    label: "الطالب",
    identityKind: "consumer",
    scopeLevel: "self",
    defaultScopeLabel: "حساب الطالب فقط",
    homePath: "/student-portal",
    navigation: [
      { path: "/student-portal", label: "مساحة الطالب", purpose: "learning, sessions, achievements" },
    ],
  },
};

export function getRoleDefinition(roleCode: RoleCode) {
  return ROLE_DEFINITIONS[roleCode];
}
