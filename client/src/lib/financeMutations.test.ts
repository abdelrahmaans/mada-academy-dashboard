import { describe, expect, it } from "vitest";
import {
  buildExpenseMutation,
  buildInvoiceMutation,
  buildPaymentMutation,
} from "./financeMutations";

describe("finance mutation builders", () => {
  it("builds a cash payment in piastres and trims optional references", () => {
    expect(
      buildPaymentMutation({
        amount: "125.5",
        remaining: 200,
        method: "CASH",
        receivedOn: "2026-10-05",
        externalReference: "  ",
      })
    ).toEqual({
      ok: true,
      input: {
        amountPiastres: 12550,
        method: "CASH",
        receivedOn: "2026-10-05",
      },
    });
  });

  it("requires a reference for InstaPay and Vodafone Cash and rejects over-collection", () => {
    expect(
      buildPaymentMutation({
        amount: "50",
        remaining: 100,
        method: "INSTAPAY",
        receivedOn: "2026-10-05",
        externalReference: "",
      })
    ).toEqual({ ok: false, code: "MISSING_REFERENCE" });
    expect(
      buildPaymentMutation({
        amount: "101",
        remaining: 100,
        method: "VISA",
        receivedOn: "2026-10-05",
        externalReference: "",
      })
    ).toEqual({ ok: false, code: "OVER_COLLECTION" });
  });

  it("builds trimmed expense and invoice API payloads and rejects invalid amounts", () => {
    expect(buildExpenseMutation("  أدوات  ", "350")).toEqual({
      description: "أدوات",
      category: "OPERATIONS",
      amountPiastres: 35000,
    });
    expect(
      buildInvoiceMutation("student-1", "  رسوم شهرية ", "1200", "2026-10-12")
    ).toEqual({
      studentId: "student-1",
      dueDate: "2026-10-12",
      lines: [{ description: "رسوم شهرية", amountPiastres: 120000 }],
    });
    expect(buildExpenseMutation("", "350")).toBeNull();
    expect(
      buildInvoiceMutation("student-1", "رسوم", "0", "2026-10-12")
    ).toBeNull();
  });
});
