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
        <div className="finance-desk-modal-backdrop">
          <form className="finance-desk-modal" onSubmit={createInvoice}>
            <button
              type="button"
              className="finance-modal-close"
              onClick={() => setInvoiceDialogOpen(false)}
            >
              <X size={16} />
            </button>
            <span className="finance-modal-icon">
              <FileText size={19} />
            </span>
            <h2>إنشاء فاتورة</h2>
            <p>الفاتورة الجديدة ستظهر مباشرة في سجل التحصيل وFamily Portal.</p>
            <label>
              الطالب
              <select
                value={invoiceStudentId}
                onChange={event => setInvoiceStudentId(event.target.value)}
              >
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              وصف البند
              <input
                value={invoiceDescription}
                onChange={event => setInvoiceDescription(event.target.value)}
                placeholder="مثال: رسوم شهر أكتوبر"
              />
            </label>
            <label>
              المبلغ (ج.م)
              <input
                value={invoiceAmount}
                onChange={event => setInvoiceAmount(event.target.value)}
                type="number"
                min="1"
                placeholder="مثال: 2500"
              />
            </label>
            <label>
              تاريخ الاستحقاق
              <input
                value={invoiceDueDate}
                onChange={event => setInvoiceDueDate(event.target.value)}
                type="date"
              />
            </label>
            <button className="finance-desk-primary" type="submit">
              <Plus size={15} /> إنشاء الفاتورة
            </button>
          </form>
        </div>
      )}
      {rejecting && (!liveMode || workspaceState === "ready") && (
        <div className="finance-desk-modal-backdrop">
          <form className="finance-desk-modal" onSubmit={rejectExpense}>
            <button
              type="button"
              className="finance-modal-close"
              onClick={() => setRejecting(null)}
            >
              <X size={16} />
            </button>
            <span className="finance-modal-icon">
              <AlertCircle size={19} />
            </span>
            <h2>رفض المصروف</h2>
            <p>سبب الرفض إلزامي وسيظهر في سجل المصروف.</p>
            <textarea
              value={rejectReason}
              onChange={event => setRejectReason(event.target.value)}
              placeholder="اكتب سببًا واضحًا للرفض..."
              rows={4}
            />
            <button className="finance-desk-primary" type="submit">
              <Check size={15} /> حفظ الرفض
            </button>
          </form>
        </div>
      )}
    </>
  );
}
