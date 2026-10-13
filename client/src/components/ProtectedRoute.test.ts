import { describe, expect, it } from "vitest";
import { isRouteAllowed } from "../lib/routeAccess";

const staff = {
  id: "user-1",
  accountType: "staff",
  role: "R01_ACADEMY_OWNER",
  tenantId: "tenant-1",
  branchId: null,
  scopeLevel: "TENANT",
  permissions: ["reports.read", "finance.expenses.read"],
};

describe("ProtectedRoute authorization predicate", () => {
  it("allows an explicitly listed role and permission", () => {
    expect(isRouteAllowed(staff, ["R01_ACADEMY_OWNER"], "reports.read")).toBe(true);
  });

  it("denies a role outside the route allowlist", () => {
    expect(isRouteAllowed(staff, ["R06_ACCOUNTANT"])).toBe(false);
  });

  it("denies a missing permission instead of treating undefined permissions as allowed", () => {
    expect(isRouteAllowed({ ...staff, permissions: undefined }, ["R01_ACADEMY_OWNER"], "reports.read")).toBe(false);
  });

  it("allows access when anyOfPermissions matches at least one active permission", () => {
    expect(isRouteAllowed(staff, undefined, undefined, ["finance.read", "finance.expenses.read"])).toBe(true);
  });

  it("denies access when user possesses none of the anyOfPermissions", () => {
    expect(isRouteAllowed(staff, undefined, undefined, ["marketing.read", "invoices.create"])).toBe(false);
  });

  it("allows normalized role matching e.g. R01 matching R01_ACADEMY_OWNER", () => {
    expect(isRouteAllowed(staff, ["R01"])).toBe(true);
  });
});
