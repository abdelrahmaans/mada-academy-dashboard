import { describe, expect, test } from "vitest";
import {
  sanitizeBroadcastPhone,
  formatBroadcastMessage,
  BroadcastStudent,
} from "./WhatsAppBroadcastModal";

describe("WhatsAppBroadcastModal utilities", () => {
  const sampleStudent: BroadcastStudent = {
    id: "st-101",
    studentName: "سيف الدين أسامة",
    parentName: "أ. أسامة محمود",
    phone: "01012345678",
    groupName: "روبوتكس متقدم · السبت 10:00 ص",
    branchName: "فرع التجمع الخامس",
  };

  describe("sanitizeBroadcastPhone", () => {
    test("converts Egyptian local number starting with 0 to 20 format", () => {
      expect(sanitizeBroadcastPhone("01012345678")).toBe("201012345678");
    });

    test("keeps already formatted +20 numbers and strips non-digits", () => {
      expect(sanitizeBroadcastPhone("+20 10 1234 5678")).toBe("201012345678");
    });

    test("strips dashes and parentheses correctly", () => {
      expect(sanitizeBroadcastPhone("(+20) 10-1234-5678")).toBe("201012345678");
    });
  });

  describe("formatBroadcastMessage", () => {
    test("formats SESSION_REMINDER template with student and parent details", () => {
      const msg = formatBroadcastMessage("SESSION_REMINDER", sampleStudent);
      expect(msg).toContain("أ. أسامة محمود");
      expect(msg).toContain("سيف الدين أسامة");
      expect(msg).toContain("روبوتكس متقدم · السبت 10:00 ص");
      expect(msg).toContain("فرع التجمع الخامس");
    });

    test("formats ABSENCE template with student name and encouragement", () => {
      const msg = formatBroadcastMessage("ABSENCE", sampleStudent);
      expect(msg).toContain("سيف الدين أسامة");
      expect(msg).toContain("غياب الطالب المتميز");
      expect(msg).toContain("حصة التعويض المجانية");
    });

    test("formats INSTALLMENT template with accounting reminder", () => {
      const msg = formatBroadcastMessage("INSTALLMENT", sampleStudent);
      expect(msg).toContain("سيف الدين أسامة");
      expect(msg).toContain("حلول موعد سداد القسط الأكاديمي");
      expect(msg).toContain("إنستاباي أو المحافظ الإلكترونية");
    });

    test("substitutes dynamic tokens {student}, {parent}, {group}, {branch} in CUSTOM messages", () => {
      const customTemplate = "عزيزي {parent}، يسعدنا دعوتكم لحضور المعرض الختامي للطالب {student} لمجموعة {group} في {branch}.";
      const msg = formatBroadcastMessage("CUSTOM", sampleStudent, {
        customMessage: customTemplate,
      });
      expect(msg).toBe(
        "عزيزي أ. أسامة محمود، يسعدنا دعوتكم لحضور المعرض الختامي للطالب سيف الدين أسامة لمجموعة روبوتكس متقدم · السبت 10:00 ص في فرع التجمع الخامس."
      );
    });
  });
});
