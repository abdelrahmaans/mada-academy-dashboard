export type InstructorSessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PENDING_APPROVAL';
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | 'UNMARKED';
export type EvaluationStatus = 'DRAFT' | 'SUBMITTED' | 'CHANGES_REQUESTED' | 'PUBLISHED';

export interface InstructorStudent { readonly id: string; readonly branchId: string; readonly fullName: string; readonly dateOfBirth: string | null; readonly status: string; readonly activeEnrollmentCount: number; }
export interface InstructorSession { readonly id: string; readonly branchId: string; readonly courseOfferingId: string | null; readonly sessionNumber: number; readonly startAt: string; readonly endAt: string; readonly instructorId: string; readonly classroomId: string; readonly classroomName?: string | null; readonly courseName?: string | null; readonly type: string; readonly status: InstructorSessionStatus; readonly notes?: string | null; readonly completedAt?: string | null; }
export interface AttendanceRecord { readonly studentId: string; readonly studentName: string; readonly status: AttendanceStatus; readonly lateMinutes: number | null; }
export interface InstructorAttendance { readonly sessionId: string; readonly sessionStatus: InstructorSessionStatus; readonly items: readonly AttendanceRecord[]; readonly total: number; }
export interface AttendanceInput { readonly studentId: string; readonly status: Exclude<AttendanceStatus, 'UNMARKED'>; readonly lateMinutes?: number | null; }
export interface SessionEvaluation { readonly studentId: string; readonly score: number | null; readonly notes: string | null; readonly status: EvaluationStatus; readonly reviewNote: string | null; readonly submittedAt?: string | null; readonly reviewedAt?: string | null; }
export interface EvaluationInput { readonly studentId: string; readonly score?: number | null; readonly notes?: string | null; }
export interface InstructorApprovalRequest { readonly approvalId: string; readonly sessionId: string; readonly state: string; readonly type?: string; }
export interface InstructorWorkspaceData { readonly sessions: readonly InstructorSession[]; readonly students: readonly InstructorStudent[]; readonly attendanceBySession: Readonly<Record<string, InstructorAttendance>>; }
