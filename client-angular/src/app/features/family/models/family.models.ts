export type ConsumerAttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | 'UNMARKED' | string;
export type ConsumerSessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PENDING_APPROVAL' | string;

export interface FamilyChild {
  readonly id: string;
  readonly name: string;
  readonly branchId: string;
  readonly branchName?: string | null;
  readonly relationship: string;
}

export interface FamilySession {
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

export interface FamilyPayment {
  readonly id: string;
  readonly amountPiastres: number;
  readonly method: string;
  readonly receivedOn: string;
  readonly evidenceStatus: string;
  readonly evidenceFileName?: string | null;
}

export interface FamilyInvoice {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly studentId: string;
  readonly studentName?: string | null;
  readonly branchName?: string | null;
  readonly dueDate: string;
  readonly totalPiastres: number;
  readonly paidPiastres: number;
  readonly remainingPiastres: number;
  readonly status: string;
  readonly lines: readonly { description: string; amountPiastres: number }[];
  readonly payments: readonly FamilyPayment[];
}
