export type R03EvaluationStatus = 'DRAFT' | 'SUBMITTED' | 'CHANGES_REQUESTED' | 'PUBLISHED';

export interface R03Group {
  readonly id: string;
  readonly courseName: string;
  readonly track: string;
  readonly branchId: string;
  readonly branchName: string;
  readonly instructorId: string;
  readonly instructorName: string | null;
  readonly classroomName: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly status: string;
  readonly maxStudents: number;
  readonly enrolledStudents: number;
}

export interface R03Instructor {
  readonly id: string;
  readonly name: string | null;
  readonly roleCode: 'R03_HEAD_INSTRUCTORS' | 'R04_INSTRUCTOR' | string;
  readonly branchId: string | null;
}

export interface R03Session {
  readonly id: string;
  readonly branchId: string;
  readonly sessionNumber: number;
  readonly startAt: string;
  readonly endAt: string;
  readonly instructorId: string;
  readonly classroomId: string;
  readonly status: string;
  readonly instructorName?: string | null;
  readonly classroomName?: string | null;
  readonly courseName?: string | null;
}

export interface R03EvaluationSummary {
  readonly branchId: string;
  readonly counts: Readonly<Record<R03EvaluationStatus, number>>;
}

export interface R03EvaluationReview {
  readonly id: string;
  readonly sessionId: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly courseName: string;
  readonly instructorName: string | null;
  readonly score: number | null;
  readonly notes: string | null;
  readonly submittedAt: string | null;
  readonly sessionDate: string;
}

export type R03ReviewDecision = 'PUBLISH' | 'REQUEST_CHANGES';

export interface R03ReviewDecisionResult {
  readonly evaluationId: string;
  readonly sessionId: string;
  readonly status: R03EvaluationStatus;
  readonly reviewedAt: string;
  readonly publishedAt: string | null;
}

export interface R03Notification {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly createdAt: string;
  readonly isRead: boolean;
}

export interface R03OverviewData {
  readonly groups: readonly R03Group[];
  readonly instructors: readonly R03Instructor[];
  readonly sessions: readonly R03Session[];
  readonly evaluations: R03EvaluationSummary;
  readonly notifications: readonly R03Notification[];
}

export interface R03LoadWarning {
  readonly source: 'evaluations' | 'notifications';
  readonly message: string;
}

export interface R03OverviewResult {
  readonly data: R03OverviewData;
  readonly warnings: readonly R03LoadWarning[];
}
