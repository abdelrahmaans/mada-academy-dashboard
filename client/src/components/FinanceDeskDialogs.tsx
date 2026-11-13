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
  invoiceSubmitting: boolean;
  createInvoice: (event: FormEvent) => void;
  rejecting: string | null;
  setRejecting: Setter<string | null>;
  rejectReason: string;
  setRejectReason: Setter<string>;
  rejectSubmitting: boolean;
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
  invoiceSubmitting,
  createInvoice,
  rejecting,
  setRejecting,
  rejectReason,
  setRejectReason,
  rejectSubmitting,
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
            style={{
              maxWidth: "480px",
              width: "100%",
              background: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(15, 23, 42, 0.18)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <button
              type="button"
              className="finance-modal-close"
              aria-label="إغلاق نافذة إنشاء الفاتورة"
              disabled={invoiceSubmitting}
              onClick={() => setInvoiceDialogOpen(false)}
              style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "grid",
                placeItems: "center",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              <X size={16} aria-hidden="true" />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
              <span
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#fef2f2",
                  color: "#e11d48",
                  display: "grid",
                  placeItems: "center",
                }}
                aria-hidden="true"
              >
                <FileText size={22} />
              </span>
              <div>
                <h2 id="create-invoice-title" style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                  إصدار فاتورة جديدة
                </h2>
                <p id="create-invoice-description" style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                  الفاتورة الجديدة ستظهر مباشرة في سجل التحصيل وFamily Portal.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                الطالب المستحق عليه <span style={{ color: "#e11d48" }}>*</span>
              </label>
              <select
                required
                value={invoiceStudentId}
                disabled={invoiceSubmitting}
                onChange={event => setInvoiceStudentId(event.target.value)}
                style={{
                  height: "42px",
                  padding: "0 12px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  color: "#0f172a",
                  background: "#f8fafc",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              >
                <option value="">اختر طالبًا من القائمة</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                وصف البند / الاشتراك <span style={{ color: "#e11d48" }}>*</span>
              </label>
              <input
                required
                value={invoiceDescription}
                disabled={invoiceSubmitting}
                onChange={event => setInvoiceDescription(event.target.value)}
                placeholder="مثال: رسوم شهر أكتوبر - دبلومة الذكاء الاصطناعي"
                style={{
                  height: "42px",
                  padding: "0 12px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  color: "#0f172a",
                  background: "#ffffff",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                  المبلغ (ج.م) <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <input
                  required
                  value={invoiceAmount}
                  disabled={invoiceSubmitting}
                  onChange={event => setInvoiceAmount(event.target.value)}
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="مثال: 2500"
                  style={{
                    height: "42px",
                    padding: "0 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#0f172a",
                    background: "#ffffff",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                  تاريخ الاستحقاق <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <input
                  required
                  value={invoiceDueDate}
                  disabled={invoiceSubmitting}
                  onChange={event => setInvoiceDueDate(event.target.value)}
                  type="date"
                  style={{
                    height: "42px",
                    padding: "0 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    color: "#0f172a",
                    background: "#ffffff",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            <button
              className="button button-primary"
              type="submit"
              disabled={!students.length || invoiceSubmitting}
              aria-busy={invoiceSubmitting}
              style={{
                marginTop: "8px",
                height: "44px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 700,
                background: "#0d9488",
                color: "#ffffff",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(13, 148, 136, 0.25)",
              }}
            >
              <Plus size={16} />{" "}
              {invoiceSubmitting
                ? "جارٍ إنشاء الفاتورة…"
                : students.length
                  ? "إصدار الفاتورة الآن"
                  : "لا يوجد طلاب متاحون"}
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
              disabled={rejectSubmitting}
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
              disabled={rejectSubmitting}
              onChange={event => setRejectReason(event.target.value)}
              placeholder="اكتب سببًا واضحًا للرفض..."
              rows={4}
              required
            />
            <button
              className="finance-desk-primary"
              type="submit"
              disabled={!rejectReason.trim() || rejectSubmitting}
              aria-busy={rejectSubmitting}
            >
              <Check size={15} /> {rejectSubmitting ? "جارٍ حفظ الرفض…" : "حفظ الرفض"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
