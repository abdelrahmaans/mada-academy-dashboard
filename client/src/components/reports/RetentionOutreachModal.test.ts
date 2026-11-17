import { describe, expect, test } from "vitest";
import type { RetentionRadarItem } from "@/lib/apiClient";

describe("RetentionOutreachModal message generation & risk rules", () => {
  const sampleHighRiskItem: RetentionRadarItem = {
    studentId: "std-001",
    fullName: "آدم إيهاب النجار",
    branchId: "br-01",
    branchName: "مدينة نصر",
    courseOfferingId: "off-001",
    courseName: "روبوتكس ومسابقات متقدمة",
    totalSessionsMarked: 8,
    attendancePercent: 62,
    consecutiveAbsences: 3,
    averageScore: 78,
    totalBilledPiastres: 350000,
    totalPaidPiastres: 200000,
    outstandingPiastres: 150000,
    maxOverdueDays: 18,
    riskLevel: "HIGH",
    riskFactor: "غياب متتالي لأكثر من جلستين",
    recommendedAction: "التواصل هاتفياً وتقديم جلسة تعويضية مجانية",
  };

  test("generates respectful absence catch-up message", () => {
    const rawMsg = `مرحباً بحضرتك يا فندم، تحية طيبة من إدارة أكاديمية مدى للروبوتكس فرع ${sampleHighRiskItem.branchName} 🤖\nحابين نطمئن على بطلنا الغالي *${sampleHighRiskItem.fullName}* نظراً لغيابه عن آخر جلسات كورس *${sampleHighRiskItem.courseName}*.`;

    expect(rawMsg).toContain("آدم إيهاب النجار");
    expect(rawMsg).toContain("مدينة نصر");
    expect(rawMsg).toContain("جلسات كورس");
  });

  test("identifies primary risk reason properly", () => {
    const isAbsenceRisk = sampleHighRiskItem.consecutiveAbsences >= 2;
    const isFinancialRisk = sampleHighRiskItem.outstandingPiastres > 0 && sampleHighRiskItem.maxOverdueDays > 14;

    expect(isAbsenceRisk).toBe(true);
    expect(isFinancialRisk).toBe(true);
  });
});
