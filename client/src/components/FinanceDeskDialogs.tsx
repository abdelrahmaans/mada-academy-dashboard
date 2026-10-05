import type { FormEvent, Dispatch, SetStateAction } from "react";
import { AlertCircle, Check, FileText, Plus, X } from "lucide-react";
import type { StudentRecord } from "@/lib/apiClient";

type Setter<T> = Dispatch<SetStateAction<T>>;

export type FinanceDeskDialogsProps = {
  invoiceDialogOpen: boolean;
  setInvoiceDialogOpen: Setter<boolean>;
  invoiceStudentId: string;
  setInvoiceStudentId: Setter<string>;
  students: StudentRecord[];
  invoiceDescription: string;
  setInvoiceDescription: Setter<string>;
  invoiceAmount: string;
  setInvoiceAmount: Setter<string>;
  invoiceDueDate: string;
  setInvoiceDueDate: Setter<string>;
  createInvoice: (event: FormEvent) => void;
  rejecting: string | null;
  setRejecting: Setter<string | null>;
  rejectReason: string;
  setRejectReason: Setter<string>;
  rejectExpense: (event: FormEvent) => void;
  liveMode: boolean;
  workspaceState: "loading" | "ready" | "error" | "forbidden";
};

export function FinanceDeskDialogs({
  invoiceDialogOpen,
  setInvoiceDialogOpen,
  invoiceStudentId,
  setInvoiceStudentId,
  students,
  invoiceDescription,
  setInvoiceDescription,
  invoiceAmount,
  setInvoiceAmount,
  invoiceDueDate,
  setInvoiceDueDate,
  createInvoice,
  rejecting,
  setRejecting,
  rejectReason,
  setRejectReason,
  rejectExpense,
  liveMode,
  workspaceState,
}: FinanceDeskDialogsProps) {
  return (
    <>
      {invoiceDialogOpen && (!liveMode || workspaceState === "ready") && (
        <div className="finance-desk-modal-backdrop" role="presentation">
          <form
            className="finance-desk-modal"
            onSubmit={createInvoice}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-invoice-title"
            aria-describedby="create-invoice-description"
          >
            <button
              type="button"
              className="finance-modal-close"
              aria-label="إغلاق نافذة إنشاء الفاتورة"
              onClick={() => setInvoiceDialogOpen(false)}
            >
              <X size={16} aria-hidden="true" />
            </button>
            <span className="finance-modal-icon" aria-hidden="true">
              <FileText size={19} />
            </span>
            <h2 id="create-invoice-title">إنشاء فاتورة</h2>
            <p id="create-invoice-description">الفاتورة الجديدة ستظهر مباشرة في سجل التحصيل وFamily Portal.</p>
            <label>
              الطالب
              <select required value={invoiceStudentId} onChange={event => setInvoiceStudentId(event.target.value)}>
                <option value="">اختر طالبًا</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>{student.fullName}</option>
                ))}
              </select>
            </label>
            <label>
              وصف البند
              <input required value={invoiceDescription} onChange={event => setInvoiceDescription(event.target.value)} placeholder="مثال: رسوم شهر أكتوبر" />
            </label>
            <label>
              المبلغ (ج.م)
              <input required value={invoiceAmount} onChange={event => setInvoiceAmount(event.target.value)} type="number" min="1" placeholder="مثال: 2500" />
            </label>
            <label>
              تاريخ الاستحقاق
              <input required value={invoiceDueDate} onChange={event => setInvoiceDueDate(event.target.value)} type="date" />
            </label>
            <button className="finance-desk-primary" type="submit" disabled={!students.length}>
              <Plus size={15} /> {students.length ? "إنشاء الفاتورة" : "لا يوجد طلاب متاحون"}
            </button>
          </form>
        </div>
      )}
      {rejecting && (!liveMode || workspaceState === "ready") && (
        <div className="finance-desk-modal-backdrop" role="presentation">
          <form
            className="finance-desk-modal"
            onSubmit={rejectExpense}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-expense-title"
            aria-describedby="reject-expense-description"
          >
            <button
              type="button"
              className="finance-modal-close"
              aria-label="إغلاق نافذة رفض المصروف"
              onClick={() => setRejecting(null)}
            >
              <X size={16} aria-hidden="true" />
            </button>
            <span className="finance-modal-icon" aria-hidden="true">
              <AlertCircle size={19} />
            </span>
            <h2 id="reject-expense-title">رفض المصروف</h2>
            <p id="reject-expense-description">سبب الرفض إلزامي وسيظهر في سجل المصروف.</p>
            <label htmlFor="reject-expense-reason" className="sr-only">سبب رفض المصروف</label>
            <textarea
              id="reject-expense-reason"
              value={rejectReason}
              onChange={event => setRejectReason(event.target.value)}
              placeholder="اكتب سببًا واضحًا للرفض..."
              rows={4}
              required
            />
            <button className="finance-desk-primary" type="submit" disabled={!rejectReason.trim()}>
              <Check size={15} /> حفظ الرفض
            </button>
          </form>
        </div>
      )}
    </>
  );
}
