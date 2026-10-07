export type ConsumerAttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | 'UNMARKED';
export type ConsumerSessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PENDING_APPROVAL';

export interface ConsumerStudent {
  readonly id: string;
  readonly name: string;
  readonly branchId: string;
  readonly branchName?: string | null;
  readonly relationship: 'SELF' | string;
}

export interface ConsumerSession {
  readonly sessionId: string;
  readonly studentId: string;
  readonly studentName?: string | null;
  readonly sessionNumber: number;
  readonly startAt: string;
  readonly endAt: string;
  readonly status: ConsumerSessionStatus;
  readonly courseName?: string | null;
  readonly branchName?: string | null;
  readonly classroomName?: string | null;
  readonly attendanceStatus: ConsumerAttendanceStatus;
  readonly score?: number | null;
  readonly notes?: string | null;
}

export interface StudentPortalData {
  readonly student: ConsumerStudent;
  readonly sessions: readonly ConsumerSession[];
}
