import type { AccountType } from "../auth/types";

export const ROLE_DEFINITIONS = {
  R00_PLATFORM_ADMIN: {
    shortCode: "R00",
    label: "أدمن منصة مدى",
    accountType: "staff",
    scope: "platform",
    mobileEnabled: false,
  },
  R01_ACADEMY_OWNER: {
    shortCode: "R01",
    label: "مسؤول الأكاديمية",
    accountType: "staff",
    scope: "tenant",
    mobileEnabled: false,
  },
  R02_BRANCH_MANAGER: {
    shortCode: "R02",
    label: "مدير الفرع",
    accountType: "staff",
    scope: "branch",
    mobileEnabled: false,
  },
  R03_HEAD_INSTRUCTORS: {
    shortCode: "R03",
    label: "رئيس المدربين",
    accountType: "staff",
    scope: "branch/team",
    mobileEnabled: false,
  },
  R04_INSTRUCTOR: {
    shortCode: "R04",
    label: "المدرب",
    accountType: "staff",
    scope: "assigned sessions/students",
    mobileEnabled: true,
  },
  R05_SECRETARY: {
    shortCode: "R05",
    label: "السكرتارية",
    accountType: "staff",
    scope: "branch",
    mobileEnabled: false,
  },
  R06_ACCOUNTANT: {
    shortCode: "R06",
    label: "المحاسب",
    accountType: "staff",
    scope: "authorized branches",
    mobileEnabled: false,
  },
  R07_MEDIA_MANAGER: {
    shortCode: "R07",
    label: "مسؤول التسويق",
    accountType: "staff",
    scope: "branch",
    mobileEnabled: false,
  },
  R08_PARENT: {
    shortCode: "R08",
    label: "ولي الأمر",
    accountType: "parent",
    scope: "linked children only",
    mobileEnabled: false,
  },
  R09_STUDENT: {
    shortCode: "R09",
    label: "الطالب",
    accountType: "student",
    scope: "self only",
    mobileEnabled: false,
  },
} as const satisfies Record<
  string,
  {
    shortCode: string;
    label: string;
    accountType: AccountType;
    scope: string;
    mobileEnabled: boolean;
  }
>;

export type RoleCode = keyof typeof ROLE_DEFINITIONS;
export const INSTRUCTOR_ROLE: RoleCode = "R04_INSTRUCTOR";

export function getRoleDefinition(role: string) {
  return Object.hasOwn(ROLE_DEFINITIONS, role)
    ? ROLE_DEFINITIONS[role as RoleCode]
    : undefined;
}

export function isAccountTypeCompatible(
  role: string,
  accountType: AccountType
) {
  const definition = getRoleDefinition(role);
  return Boolean(definition && definition.accountType === accountType);
}
