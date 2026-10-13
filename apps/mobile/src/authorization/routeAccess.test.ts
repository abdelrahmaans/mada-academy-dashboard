import { describe, expect, it } from "vitest";
import type { AuthIdentity } from "../auth/types";
import { canAccessMobileRoute, getVisibleMobileTabs } from "./routeAccess";

function identity(overrides: Partial<AuthIdentity> = {}): AuthIdentity {
  return {
    id: "user-1",
    accountType: "staff",
    role: "R04_INSTRUCTOR",
    tenantId: "tenant-1",
    branchId: "branch-1",
    scopeLevel: "BRANCH",
    permissions: [
      "sessions.assigned.read",
      "attendance.read",
      "attendance.write",
      "evaluations.write",
    ],
    ...overrides,
  };
}

describe("mobile route authorization", () => {
  it("shows only R04 tabs whose required capabilities are in /me", () => {
    expect(getVisibleMobileTabs(identity()).map(({ route }) => route)).toEqual([
      "home",
      "schedule",
      "tasks",
      "account",
    ]);
    expect(
      getVisibleMobileTabs(
        identity({ permissions: ["sessions.assigned.read"] })
      ).map(({ route }) => route)
    ).toEqual(["home", "schedule", "account"]);
  });

  it("denies attendance/evaluation task access when write permissions are absent", () => {
    expect(
      canAccessMobileRoute(
        identity({
          permissions: ["sessions.assigned.read", "attendance.read"],
        }),
        "tasks"
      )
    ).toBe(false);
    expect(
      canAccessMobileRoute(identity({ permissions: [] }), "schedule")
    ).toBe(false);
  });

  it("does not let R03 use the R04 mobile workflow even though R03 can read attendance", () => {
    const headInstructor = identity({
      role: "R03_HEAD_INSTRUCTORS",
      permissions: ["sessions.read", "attendance.read", "evaluations.review"],
    });
    expect(canAccessMobileRoute(headInstructor, "home")).toBe(false);
    expect(canAccessMobileRoute(headInstructor, "tasks")).toBe(false);
  });

  it("fails closed for consumer, unsupported, and accountType/role mismatches", () => {
    expect(
      canAccessMobileRoute(
        identity({ role: "R08_PARENT", accountType: "parent" }),
        "home"
      )
    ).toBe(false);
    expect(
      canAccessMobileRoute(
        identity({ role: "R04_INSTRUCTOR", accountType: "parent" }),
        "home"
      )
    ).toBe(false);
    expect(
      canAccessMobileRoute(identity({ role: "SOME_NEW_ROLE" }), "account")
    ).toBe(false);
  });
});
