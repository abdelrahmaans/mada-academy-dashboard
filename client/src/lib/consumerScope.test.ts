import { describe, expect, it } from "vitest";
import {
  firstLinkedStudent,
  linkedStudentsWithSessions,
  sessionsForStudent,
} from "./consumerScope";
import type { ConsumerSessionRecord, ConsumerStudentRecord } from "./apiClient";

const students: ConsumerStudentRecord[] = [
  {
    id: "student-a",
    name: "طالب أ",
    branchId: "branch-a",
    branchName: "فرع أ",
    relationship: "Child",
  },
  {
    id: "student-b",
    name: "طالب ب",
    branchId: "branch-a",
    branchName: "فرع أ",
    relationship: "Child",
  },
];
const sessions: ConsumerSessionRecord[] = [
  {
    sessionId: "session-a",
    studentId: "student-a",
    studentName: "طالب أ",
    sessionNumber: 1,
    startAt: "2026-10-05T10:00:00Z",
    endAt: "2026-10-05T11:00:00Z",
    status: "COMPLETED",
    courseName: "روبوتكس",
    branchName: "فرع أ",
    classroomName: "قاعة 1",
    attendanceStatus: "PRESENT",
    score: 90,
    notes: "جيد",
  },
  {
    sessionId: "session-b",
    studentId: "student-b",
    studentName: "طالب ب",
    sessionNumber: 1,
    startAt: "2026-10-05T10:00:00Z",
    endAt: "2026-10-05T11:00:00Z",
    status: "COMPLETED",
    courseName: "برمجة",
    branchName: "فرع أ",
    classroomName: "قاعة 2",
    attendanceStatus: "ABSENT",
    score: 40,
    notes: "",
  },
];

describe("consumer scope helpers", () => {
  it("keeps only sessions linked to the selected student", () => {
    expect(
      sessionsForStudent(sessions, "student-a").map(item => item.sessionId)
    ).toEqual(["session-a"]);
  });

  it("does not expose sessions when the selected student is not linked", () => {
    expect(sessionsForStudent(sessions, "unlinked-student")).toEqual([]);
  });

  it("maps family children with only their own sessions", () => {
    expect(
      linkedStudentsWithSessions(students, sessions).map(item => [
        item.student.id,
        item.sessions.map(session => session.studentId),
      ])
    ).toEqual([
      ["student-a", ["student-a"]],
      ["student-b", ["student-b"]],
    ]);
  });

  it("selects only the first backend-linked student for the student portal", () => {
    expect(firstLinkedStudent(students)?.id).toBe("student-a");
    expect(firstLinkedStudent([])).toBeNull();
  });

  it("keeps every family child paired only with its own records", () => {
    const scoped = linkedStudentsWithSessions(students, sessions);

    expect(scoped.find(item => item.student.id === "student-a")?.sessions).toEqual([sessions[0]]);
    expect(scoped.find(item => item.student.id === "student-b")?.sessions).toEqual([sessions[1]]);
    expect(scoped.flatMap(item => item.sessions).every(session =>
      scoped.some(item => item.student.id === session.studentId)
    )).toBe(true);
  });
});
