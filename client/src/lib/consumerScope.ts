import type { ConsumerSessionRecord, ConsumerStudentRecord } from "./apiClient";

export function sessionsForStudent(
  records: ConsumerSessionRecord[],
  studentId: string
) {
  return records.filter(record => record.studentId === studentId);
}

export function firstLinkedStudent(students: ConsumerStudentRecord[]) {
  return students[0] ?? null;
}

export function linkedStudentsWithSessions(
  students: ConsumerStudentRecord[],
  records: ConsumerSessionRecord[]
) {
  return students.map(student => ({
    student,
    sessions: sessionsForStudent(records, student.id),
  }));
}
