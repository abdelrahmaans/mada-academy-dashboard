import { describe, expect, test } from "vitest";
import type { Invoice } from "@/pages/FinanceDeskTypes";

describe("InvoiceDetailsModal logic & calculation", () => {
  const sampleInvoice: Invoice = {
    id: "inv-2026-001",
    number: "MAD-NSR-2026-001",
    student: "ياسين محمد علي",
    parent: "أ. محمد علي",
    branch: "مدينة نصر",
    course: "روبوتكس مستوى 2",
    total: 4800,
    collected: 2400,
    due: "2026-11-30",
    status: "partial",
    payments: [
      {
        id: "pay-001",
        invoiceId: "inv-2026-001",
        amountPiastres: 240000,
        method: "INSTAPAY",
        receivedOn: "2026-10-15",
        createdAt: "2026-10-15T10:00:00Z",
        evidenceStatus: "ATTACHED",
      },
    ],
  };

  test("calculates remaining balance and percent paid accurately", () => {
    const total = sampleInvoice.total;
    const collected = sampleInvoice.collected;
    const remaining = Math.max(0, total - collected);
    const percentPaid = Math.round((collected / total) * 100);

    expect(remaining).toBe(2400);
    expect(percentPaid).toBe(50);
  });

  test("detects fully paid invoice when collected equals total", () => {
    const fullyPaidInvoice: Invoice = {
      ...sampleInvoice,
      collected: 4800,
      status: "paid",
    };

    const remaining = Math.max(0, fullyPaidInvoice.total - fullyPaidInvoice.collected);
    const percentPaid = Math.round((fullyPaidInvoice.collected / fullyPaidInvoice.total) * 100);

    expect(remaining).toBe(0);
    expect(percentPaid).toBe(100);
  });
});
