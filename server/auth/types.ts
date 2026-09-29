export type StaffRole =
  | "R00_PLATFORM_ADMIN"
  | "R01_ACADEMY_OWNER"
  | "R02_BRANCH_MANAGER"
  | "R03_HEAD_INSTRUCTORS"
  | "R04_INSTRUCTOR"
  | "R05_SECRETARY"
  | "R06_ACCOUNTANT"
  | "R07_MEDIA_MANAGER";

export type ConsumerAccountType = "parent" | "student";
export type AccountType = "staff" | ConsumerAccountType;
export type ScopeLevel = "platform" | "tenant" | "branch" | "team" | "assigned" | "family" | "self";

export type AuthPrincipal = {
  sub: string;
  accountType: AccountType;
  role?: StaffRole;
  tenantId?: string;
  branchId?: string;
  assignmentIds?: string[];
  childIds?: string[];
  scopeLevel: ScopeLevel;
  sessionId: string;
};
