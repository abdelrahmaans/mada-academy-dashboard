import type { FinanceInvoice } from "./apiClient";

/**
 * Keeps Family Portal invoice data scoped to the selected backend-linked child.
 * The API remains the security boundary; this prevents unrelated response items
 * from being attached to a visible child card in the frontend.
 */
export function invoicesForStudent(
  invoices: FinanceInvoice[],
  studentId: string,
  branchId: string
) {
  return invoices.filter(
    invoice => invoice.studentId === studentId && invoice.branchId === branchId
  );
}
