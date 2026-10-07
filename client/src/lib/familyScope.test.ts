import { describe, expect, it } from "vitest";
import type { FinanceInvoice } from "./apiClient";
import { invoicesForStudent } from "./familyScope";

function invoice(studentId: string, invoiceNumber: string, branchId = "branch-a"): FinanceInvoice {
  return {
    id: `invoice-${invoiceNumber}`,
    invoiceNumber,
    tenantId: "tenant-a",
    branchId,
    branchName: "فرع أ",
    studentId,
    studentName: studentId === "student-a" ? "طالب أ" : "طالب غير مرتبط",
    enrollmentId: null,
    issueDate: "2026-10-01",
    dueDate: "2026-10-15",
    totalPiastres: 10_000,
    paidPiastres: 2_000,
    remainingPiastres: 8_000,
    status: "PARTIALLY_PAID",
    lines: [{ description: "اشتراك شهري", amountPiastres: 10_000 }],
    payments: [],
  };
}

describe("Family Portal invoice scope", () => {
  it("returns invoices for the selected linked child only", () => {
    const linkedInvoice = invoice("student-a", "INV-A");
    const unrelatedInvoice = invoice("student-b", "INV-B");

    expect(invoicesForStudent([linkedInvoice, unrelatedInvoice], "student-a", "branch-a")).toEqual([
      linkedInvoice,
    ]);
  });

  it("excludes an invoice for the linked student when its branch is different", () => {
    const otherBranchInvoice = invoice("student-a", "INV-OTHER-BRANCH", "branch-b");

    expect(invoicesForStudent([otherBranchInvoice], "student-a", "branch-a")).toEqual([]);
  });

  it("does not associate an invoice by display name when its student ID is unrelated", () => {
    const invoiceWithMisleadingName = {
      ...invoice("student-b", "INV-B"),
      studentName: "طالب أ",
    };

    expect(invoicesForStudent([invoiceWithMisleadingName], "student-a", "branch-a")).toEqual([]);
  });

  it("returns no invoice data when the linked child has no invoices", () => {
    expect(invoicesForStudent([invoice("student-b", "INV-B")], "student-a", "branch-a")).toEqual([]);
  });
});
