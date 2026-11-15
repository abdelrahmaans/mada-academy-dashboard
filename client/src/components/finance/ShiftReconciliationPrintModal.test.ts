import { describe, expect, test } from "vitest";
import {
  calculateShiftReconciliationSummary,
  PrintableShiftData,
} from "./ShiftReconciliationPrintModal";

describe("ShiftReconciliationPrintModal logic", () => {
  const baseShift: PrintableShiftData = {
    shiftId: "shf-20261115-001",
    shiftName: "وردية الصباح",
    shiftDate: "2026-11-15 14:00",
    branchName: "فرع المعادي",
    cashierName: "سارة أحمد",
    cashAmount: 3500,
    electronicAmount: 1500,
    totalReceiptsCount: 8,
    status: "SUBMITTED",
  };

  test("calculates balanced shift correctly when counted cash matches", () => {
    const summary = calculateShiftReconciliationSummary({
      ...baseShift,
      countedCash: 3500,
      difference: 0,
    });

    expect(summary.totalCollected).toBe(5000);
    expect(summary.counted).toBe(3500);
    expect(summary.difference).toBe(0);
    expect(summary.differenceStatus).toBe("BALANCED");
    expect(summary.cashTafqeet).toContain("ثلاثة آلاف");
    expect(summary.totalTafqeet).toContain("خمسة آلاف");
  });

  test("detects deficit (عجز) when counted cash is less than expected", () => {
    const summary = calculateShiftReconciliationSummary({
      ...baseShift,
      countedCash: 3300,
      difference: -200,
    });

    expect(summary.totalCollected).toBe(5000);
    expect(summary.counted).toBe(3300);
    expect(summary.difference).toBe(-200);
    expect(summary.differenceStatus).toBe("DEFICIT");
  });

  test("detects surplus (فائض) when counted cash exceeds expected", () => {
    const summary = calculateShiftReconciliationSummary({
      ...baseShift,
      countedCash: 3600,
      difference: 100,
    });

    expect(summary.difference).toBe(100);
    expect(summary.differenceStatus).toBe("SURPLUS");
  });

  test("defaults counted cash to expected cashAmount when countedCash is omitted", () => {
    const summary = calculateShiftReconciliationSummary(baseShift);
    expect(summary.counted).toBe(3500);
    expect(summary.difference).toBe(0);
    expect(summary.differenceStatus).toBe("BALANCED");
  });
});
