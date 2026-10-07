export interface SecretaryStudent {
  readonly id: string;
  readonly branchId: string;
  readonly fullName: string;
  readonly dateOfBirth: string | null;
  readonly status: string;
  readonly activeEnrollmentCount: number;
}

export interface SecretaryGroup {
  readonly id: string;
  readonly courseName: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly status: string;
  readonly maxStudents: number;
  readonly enrolledStudents: number;
}

export interface SecretaryEnrollment {
  readonly id: string;
  readonly courseOfferingId: string;
  readonly courseName: string | null;
  readonly startDate: string;
  readonly endDate: string;
  readonly finalPricePiastres: number;
  readonly status: string;
  readonly maxStudents: number;
  readonly activeEnrollmentCount: number;
}

export interface ConsumerStudentAccount {
  readonly id: string;
  readonly name: string | null;
  readonly phone: string;
  readonly email: string | null;
}

export interface ConsumerGuardianLink {
  readonly id: string;
  readonly name: string | null;
  readonly phone: string;
  readonly email: string | null;
  readonly relationship: string;
  readonly status: string;
}

export interface SecretaryConsumerLinks {
  readonly studentId: string;
  readonly studentAccount: ConsumerStudentAccount | null;
  readonly guardians: readonly ConsumerGuardianLink[];
  readonly totalGuardians: number;
}

export type ConsumerAccountType = 'parent' | 'student';

export interface ConsumerAccountMatch {
  readonly id: string;
  readonly name: string | null;
  readonly accountType: ConsumerAccountType;
  readonly maskedPhone: string;
}

export interface ConsumerInvitationDelivery {
  readonly status?: string;
  readonly maskedPhone: string;
  readonly expiresAt?: string;
  readonly otpExpiresAt: string;
  readonly delivery: string;
}

export interface SecretaryPayment {
  readonly id: string;
  readonly invoiceId: string;
  readonly amountPiastres: number;
  readonly method: string;
  readonly receivedOn: string;
  readonly evidenceStatus: string;
  readonly evidenceFileName?: string | null;
}

export interface SecretaryInvoice {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly branchId: string;
  readonly branchName?: string | null;
  readonly studentId: string;
  readonly studentName?: string | null;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly totalPiastres: number;
  readonly paidPiastres: number;
  readonly remainingPiastres: number;
  readonly status: string;
  readonly lines: readonly { readonly description: string; readonly amountPiastres: number }[];
  readonly payments: readonly SecretaryPayment[];
}
