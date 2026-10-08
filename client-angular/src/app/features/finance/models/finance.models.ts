export interface FinancePayment {
  readonly id: string;
  readonly invoiceId: string;
  readonly amountPiastres: number;
  readonly method: string;
  readonly receivedOn: string;
  readonly externalReference?: string | null;
  readonly note?: string | null;
  readonly createdAt: string;
  readonly evidenceStatus: string;
  readonly evidenceFileName?: string | null;
}

export interface FinanceInvoice {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly tenantId: string;
  readonly branchId: string;
  readonly branchName?: string | null;
  readonly studentId: string;
  readonly studentName?: string | null;
  readonly enrollmentId?: string | null;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly totalPiastres: number;
  readonly paidPiastres: number;
  readonly remainingPiastres: number;
  readonly status: string;
  readonly lines: readonly { readonly description: string; readonly amountPiastres: number }[];
  readonly payments: readonly FinancePayment[];
}

export interface FinanceExpense {
  readonly id: string;
  readonly tenantId: string;
  readonly branchId: string;
  readonly branchName?: string | null;
  readonly description: string;
  readonly category: string;
  readonly amountPiastres: number;
  readonly spentOn: string;
  readonly createdAt: string;
  readonly status: string;
  readonly createdByUserId: string;
  readonly approvalRequestId?: string | null;
  readonly approvalReason?: string | null;
  readonly decidedAt?: string | null;
  readonly decidedByUserId?: string | null;
  readonly evidenceStatus: string;
  readonly evidenceFileName?: string | null;
}

export interface FinanceReportBranch {
  readonly branchId: string;
  readonly branchName: string;
  readonly invoiceCount: number;
  readonly collectedPiastres: number;
  readonly approvedExpensesPiastres: number;
  readonly netPiastres: number;
}

export interface FinanceReport {
  readonly from: string | null;
  readonly to: string | null;
  readonly totalBilledPiastres: number;
  readonly totalCollectedPiastres: number;
  readonly totalOutstandingPiastres: number;
  readonly approvedExpensesPiastres: number;
  readonly netPiastres: number;
  readonly branches: readonly FinanceReportBranch[];
}

export interface FinanceStudent {
  readonly id: string;
  readonly fullName: string;
  readonly branchId: string;
  readonly status: string;
}

export interface FinanceEvidenceResult {
  readonly paymentId: string;
  readonly status: 'ATTACHED';
  readonly fileName: string;
  readonly contentType: string;
  readonly sizeBytes: number;
}

export interface FinancePaymentResult {
  readonly payment: FinancePayment;
  readonly invoiceId: string;
}

export interface FinanceInvoiceInput {
  readonly studentId: string;
  readonly dueDate: string;
  readonly enrollmentId?: string;
  readonly lines: readonly { readonly description: string; readonly amountPiastres: number }[];
}

export interface FinancePaymentInput {
  readonly amountPiastres: number;
  readonly method: 'CASH' | 'VISA' | 'INSTAPAY' | 'VODAFONE_CASH';
  readonly receivedOn: string;
  readonly externalReference?: string;
  readonly note?: string;
}

export interface FinanceExpenseInput {
  readonly description: string;
  readonly category: string;
  readonly amountPiastres: number;
  readonly spentOn?: string;
  readonly note?: string;
}
