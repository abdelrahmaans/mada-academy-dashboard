import { describe, expect, it } from "vitest";
import type { ConsumerSessionRecord } from "./apiClient";
import { studentSessionsForPortal } from "./studentScope";

const records: ConsumerSessionRecord[] = [
  {
    sessionId: "session-own-published",
    studentId: "student-own",
    studentName: "طالب الحساب",
    sessionNumber: 1,
    startAt: "2026-10-05T10:00:00Z",
    endAt: "2026-10-05T11:00:00Z",
    status: "COMPLETED",
    courseName: "روبوتكس",
    branchName: "فرع أ",
    classroomName: "قاعة 1",
    attendanceStatus: "PRESENT",
    score: 91,
    notes: "تقييم منشور",
  },
  {
    sessionId: "session-own-unpublished",
    studentId: "student-own",
    studentName: "طالب الحساب",
    sessionNumber: 2,
    startAt: "2026-10-06T10:00:00Z",
    endAt: "2026-10-06T11:00:00Z",
    status: "COMPLETED",
    courseName: "روبوتكس",
    branchName: "فرع أ",
    classroomName: "قاعة 1",
    attendanceStatus: "PRESENT",
    score: null,
    notes: null,
  },
  {
    sessionId: "session-other-student",
    studentId: "student-other",
    studentName: "طالب آخر",
    sessionNumber: 8,
    startAt: "2026-10-07T10:00:00Z",
    endAt: "2026-10-07T11:00:00Z",
    status: "COMPLETED",
    courseName: "بيانات غير مرتبطة",
    branchName: "فرع آخر",
    classroomName: "قاعة أخرى",
    attendanceStatus: "PRESENT",
    score: 100,
    notes: "لا يجب أن تظهر للطالب",
  },
];

describe("Student Portal record scope", () => {
  it("keeps only sessions belonging to the linked student", () => {
    const scoped = studentSessionsForPortal(records, "student-own");

    expect(scoped.map(item => item.sessionId)).toEqual([
      "session-own-published",
      "session-own-unpublished",
    ]);
    expect(scoped.every(item => item.studentId === "student-own")).toBe(true);
    expect(scoped.some(item => item.studentId === "student-other")).toBe(false);
  });

  it("preserves the backend publication boundary for the linked student", () => {
    const scoped = studentSessionsForPortal(records, "student-own");

    expect(scoped.find(item => item.sessionId === "session-own-published")).toMatchObject({
      score: 91,
      notes: "تقييم منشور",
    });
    expect(scoped.find(item => item.sessionId === "session-own-unpublished")).toMatchObject({
      score: null,
      notes: null,
    });
  });

  it("returns no records for an unlinked student ID", () => {
    expect(studentSessionsForPortal(records, "student-unlinked")).toEqual([]);
  });
});
