import type { ConsumerSessionRecord } from "./apiClient";

/**
 * Keeps Student Portal records scoped to the student account's linked record.
 * Backend authorization remains authoritative; this protects the frontend
 * presentation boundary when a response contains records for other students.
 */
export function studentSessionsForPortal(
  records: ConsumerSessionRecord[],
  linkedStudentId: string
) {
  return records.filter(record => record.studentId === linkedStudentId);
}
