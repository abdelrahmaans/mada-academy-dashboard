// auditLabels.test.ts – Vitest unit tests for auditLabels utilities
import { describe, expect, test } from "vitest";
import {
  AUDIT_ACTION_MAP,
  formatAuditAction,
  formatAuditTargetType,
  formatAuditTargetId,
  parseAuditMetadata,
  formatFinancialCode,
} from "./auditLabels";

describe("formatAuditAction", () => {
  test("returns mapped label and tone", () => {
    const result = formatAuditAction("STUDENT_CREATED");
    expect(result).toEqual({ label: "إضافة ملف طالب جديد", tone: "students" });
  });

  test("returns mapped label for newly added actions", () => {
    expect(formatAuditAction("PROJECT_ARCHIVED")).toEqual({
      label: "أرشفة وتوثيق مشروع مسابقة",
      tone: "system",
    });
    expect(formatAuditAction("SHIFT_RECONCILED")).toEqual({
      label: "جرد ومطابقة نقدية الوردية",
      tone: "finance",
    });
    expect(formatAuditAction("WHATSAPP_BROADCAST_SENT")).toEqual({
      label: "إرسال رسائل جماعية للطلاب عبر واتساب",
      tone: "marketing",
    });
  });

  test("fallback for unknown action", () => {
    const result = formatAuditAction("UNKNOWN_ACTION");
    expect(result.label).toContain("إجراء:");
    expect(result.tone).toBe("system");
  });
});

describe("formatAuditTargetType", () => {
  test("maps known target type", () => {
    expect(formatAuditTargetType("STUDENT")).toBe("ملف الطالب");
  });
  test("fallback to raw string", () => {
    expect(formatAuditTargetType("NON_EXISTENT")).toBe("NON_EXISTENT");
  });
});

describe("formatAuditTargetId", () => {
  test("shortens long UUID", () => {
    const uuid = "123e4567-e89b-12d3-a456-426614174000";
    expect(formatAuditTargetId(uuid)).toBe("#1740");
  });
  test("returns dash for empty", () => {
    expect(formatAuditTargetId("")).toBe("—");
  });
});

describe("parseAuditMetadata", () => {
  test("parses simple JSON", () => {
    const json = JSON.stringify({ status: "completed", amount: 12345, notes: ["a", "b"] });
    const entries = parseAuditMetadata(json);
    expect(entries).toContainEqual({ keyLabel: "الحالة الناتجة", valueDisplay: "مكتمل بنجاح" });
    expect(entries).toContainEqual({ keyLabel: "المبلغ", valueDisplay: "123.45 ج.م" });
    expect(entries).toContainEqual({ keyLabel: "ملاحظات", valueDisplay: "a، b" });
  });
});

describe("formatFinancialCode", () => {
  test("human readable code unchanged", () => {
    expect(formatFinancialCode("SHF-01")).toBe("SHF-01");
  });
  test("composite YYYYMMDD-uuid", () => {
    const id = "20261110-abcdef12-3456-7890-abcd-ef1234567890"; // uuid part ends with 7890
    expect(formatFinancialCode(id, "invoice")).toBe("فاتورة #20261110-7890");
  });
  test("standard UUID shortening per kind", () => {
    const uuid = "11111111-2222-3333-4444-555555555555";
    expect(formatFinancialCode(uuid, "payment")).toBe("سند #5555");
    expect(formatFinancialCode(uuid, "expense")).toBe("مصروف #5555");
    expect(formatFinancialCode(uuid, "shift")).toBe("وردية #5555");
  });
});
