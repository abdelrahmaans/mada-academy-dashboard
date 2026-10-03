import { describe, expect, it } from "vitest";
import {
  canAccessFinanceView,
  financeCapabilitiesForRole,
} from "./financeAccess";

describe("finance role capabilities", () => {
  it("limits R05 secretary to invoice and collection workflows", () => {
    const access = financeCapabilitiesForRole("R05_SECRETARY");

    expect(access.allowed).toBe(true);
    expect(access.initialView).toBe("collections");
    expect(access.canViewOverview).toBe(false);
    expect(access.canReadInvoices).toBe(true);
    expect(access.canCreateInvoices).toBe(true);
    expect(access.canRecordPayments).toBe(true);
    expect(access.canReadExpenses).toBe(false);
    expect(access.canManageExpenses).toBe(false);
    expect(access.canReadReports).toBe(false);
    expect(canAccessFinanceView(access, "collections")).toBe(true);
    expect(canAccessFinanceView(access, "overview")).toBe(false);
    expect(canAccessFinanceView(access, "expenses")).toBe(false);
    expect(canAccessFinanceView(access, "reports")).toBe(false);
  });

  it("allows R06 accountant to use the full branch finance workspace", () => {
    const access = financeCapabilitiesForRole("R06_ACCOUNTANT");

    expect(access.allowed).toBe(true);
    expect(access.initialView).toBe("overview");
    expect(access.canViewOverview).toBe(true);
    expect(access.canReadExpenses).toBe(true);
    expect(access.canManageExpenses).toBe(true);
    expect(access.canReadReports).toBe(true);
    expect(canAccessFinanceView(access, "overview")).toBe(true);
    expect(canAccessFinanceView(access, "expenses")).toBe(true);
    expect(canAccessFinanceView(access, "reports")).toBe(true);
  });

  it.each([
    undefined,
    "R03_HEAD_INSTRUCTORS",
    "R04_INSTRUCTOR",
    "R01_ACADEMY_OWNER",
  ])("denies non-finance role %s from the FinanceDesk", role => {
    const access = financeCapabilitiesForRole(role);

    expect(access.allowed).toBe(false);
    expect(access.canReadInvoices).toBe(false);
    expect(access.canReadExpenses).toBe(false);
    expect(access.canReadReports).toBe(false);
    expect(canAccessFinanceView(access, "collections")).toBe(false);
  });
});
