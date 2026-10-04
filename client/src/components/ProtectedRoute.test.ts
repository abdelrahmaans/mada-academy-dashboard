import { describe, expect, it } from "vitest";
import { isRouteAllowed } from "../lib/routeAccess";

const staff = {
  id: "user-1",
  accountType: "staff",
  role: "R01_ACADEMY_OWNER",
  tenantId: "tenant-1",
  branchId: null,
  scopeLevel: "TENANT",
  permissions: ["reports.read"],
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
});
