import React, { useEffect, useRef } from "react";
import {
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  CalendarDays,
  MapPin,
  Building2,
  Receipt,
  FileText,
} from "lucide-react";
import { tafqeet } from "@/lib/tafqeet";
import { formatFinancialCode } from "@/lib/auditLabels";
import "./FinancialPrintModal.css";

export interface PrintableReceiptData {
  type: "RECEIPT";
  paymentId: string;
  invoiceId: string;
  studentName: string;
  parentName: string;
  phone: string;
  courseName: string;
  branchName: string;
  amount: number;
  paymentMethod: string;
  date: string;
  collectorName?: string;
  notes?: string;
  externalReference?: string;
  remainingAfterPayment?: number;
}

export interface PrintableInvoiceData {
  type: "INVOICE";
  invoiceId: string;
  studentName: string;
  parentName: string;
  phone: string;
  courseName: string;
  branchName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "PAID" | "PARTIAL" | "UNPAID" | "CANCELLED";
  dueDate?: string;
  issuedAt: string;
  payments: Array<{
    id: string;
    date: string;
    method: string;
    amount: number;
    reference?: string;
  }>;
  notes?: string;
}

export type FinancialPrintData = PrintableReceiptData | PrintableInvoiceData;

interface Props {
  data: FinancialPrintData | null;
  onClose: () => void;
}

export function FinancialPrintModal({ data, onClose }: Props) {
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Body scroll lock
  useEffect(() => {
    if (!data) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [data]);

  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const isReceipt = data.type === "RECEIPT";

  return (
    <div
      className="dialog-backdrop financial-print-backdrop"
      role="presentation"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="financial-print-modal-card"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Modal Top Actions (Hidden in print) */}
        <div className="financial-print-controls no-print">
          <div className="print-controls-meta">
            <span className="print-mode-badge">
              {isReceipt ? <Receipt size={16} /> : <FileText size={16} />}
              <span>{isReceipt ? "سند استلام وقبض مالي" : "فاتورة اشتراك أكاديمية"}</span>
            </span>
            <span className="print-hint-text">
              جاهز للطباعة المباشرة على ورق A4 أو الحفظ كـ PDF
            </span>
          </div>

          <div className="print-controls-actions">
            <button
              type="button"
              className="button button-primary print-trigger-btn"
              onClick={handlePrint}
            >
              <Printer size={16} />
              <span>طباعة المستند الرسمي</span>
            </button>
            <button
              type="button"
              className="icon-button close-print-btn"
              aria-label="إغلاق"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Paper */}
        <div className="financial-paper" ref={printContainerRef}>
          {/* Header */}
          <header className="paper-header">
            <div className="paper-branding">
              <div className="paper-logo-badge">MADA</div>
              <div className="paper-academy-info">
                <h1>أكاديمية مَدى للتعليم التقني والابتكار</h1>
                <p>Mada Academy for Technology & Robotics Education</p>
                <div className="paper-branch-meta">
                  <span>
                    <MapPin size={12} /> فرع: {data.branchName || "الفرع الرئيسي"}
                  </span>
                  <span>سجل مهني وتدريبي معتمد</span>
                </div>
              </div>
            </div>

            <div className="paper-doc-badge">
              <div className="doc-type-title">
                {isReceipt ? "سند قبض مالي معتمد" : "فاتورة ضريبية رسمية"}
              </div>
              <div className="doc-serial-code">
                رقم:{" "}
                <span className="code-mono">
                  {isReceipt
                    ? formatFinancialCode(data.paymentId, "payment")
                    : formatFinancialCode(data.invoiceId, "invoice")}
                </span>
              </div>
              <div className="doc-date-sub">
                التاريخ: {isReceipt ? data.date : data.issuedAt}
              </div>
            </div>
          </header>

          <div className="paper-divider" />

          {/* Customer / Student Info Box */}
          <section className="paper-parties-grid">
            <div className="party-box">
              <span className="party-label">بيانات الطالب والمشترك:</span>
              <strong className="party-name">{data.studentName}</strong>
              <div className="party-sub">الكورس / البرنامج: <span>{data.courseName}</span></div>
              <div className="party-sub">الفرع التعليمي: <span>{data.branchName}</span></div>
            </div>

            <div className="party-box">
              <span className="party-label">بيانات ولي الأمر / المستلم:</span>
              <strong className="party-name">{data.parentName}</strong>
              <div className="party-sub">
                رقم الهاتف / واتساب: <span dir="ltr">{data.phone}</span>
              </div>
              <div className="party-sub">
                كود الفاتورة المرجعي:{" "}
                <span className="code-mono">
                  {formatFinancialCode(data.invoiceId, "invoice")}
                </span>
              </div>
            </div>
          </section>

          {/* Statement / Receipt Specific Body */}
          {isReceipt ? (
            <section className="paper-body-section">
              <div className="receipt-amount-banner">
                <div className="amount-digit-box">
                  <span className="currency-label">المبلغ المستلم</span>
                  <strong className="amount-number">
                    {data.amount.toLocaleString("ar-EG")} <small>ج.م</small>
                  </strong>
                </div>

                <div className="amount-words-box">
                  <span className="tafqeet-label">المبلغ بالحروف (تفقيط):</span>
                  <div className="tafqeet-text">{tafqeet(data.amount)}</div>
                </div>
              </div>

              <div className="receipt-ledger-table-wrap">
                <table className="paper-table">
                  <thead>
                    <tr>
                      <th>البيان والتفاصيل</th>
                      <th>طريقة السداد</th>
                      <th>المرجع البنكي / الإيصال</th>
                      <th>المبلغ المدفوع</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>سداد اشتراك كورس {data.courseName}</strong>
                        <div className="item-sub-desc">
                          {data.notes || "دفعة معتمدة ومسجلة في حساب الطالب بالفرع"}
                        </div>
                      </td>
                      <td>
                        <span className="payment-method-pill">
                          {data.paymentMethod === "CASH"
                            ? "نقداً (خزينة الفرع)"
                            : data.paymentMethod === "CARD"
                            ? "بطاقة دفع إلكتروني (POS)"
                            : data.paymentMethod === "TRANSFER"
                            ? "تحويل بنكي / إنستاباي"
                            : data.paymentMethod === "WALLET"
                            ? "محفظة إلكترونية (Vodafone Cash / أخرى)"
                            : data.paymentMethod}
                        </span>
                      </td>
                      <td className="code-mono">{data.externalReference || "خزينة الفرع"}</td>
                      <td className="amount-cell">
                        {data.amount.toLocaleString("ar-EG")} ج.م
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {typeof data.remainingAfterPayment === "number" && (
                <div className="receipt-balance-reminder">
                  <span>المتبقي على الفاتورة بعد هذا السند:</span>
                  <strong>{data.remainingAfterPayment.toLocaleString("ar-EG")} ج.م</strong>
                </div>
              )}
            </section>
          ) : (
            /* Invoice Specific Body */
            <section className="paper-body-section">
              <div className="invoice-status-banner">
                <div className="invoice-status-tag">
                  حالة الفاتورة:{" "}
                  <strong>
                    {data.status === "PAID"
                      ? "مسددة بالكامل ✅"
                      : data.status === "PARTIAL"
                      ? "مسددة جزئياً ⏳"
                      : "غير مسددة ⚠️"}
                  </strong>
                </div>
                {data.dueDate && (
                  <div className="invoice-due-tag">
                    تاريخ الاستحقاق: {data.dueDate}
                  </div>
                )}
              </div>

              <div className="receipt-ledger-table-wrap">
                <table className="paper-table">
                  <thead>
                    <tr>
                      <th>البند والخدمة</th>
                      <th>إجمالي المطلوب</th>
                      <th>المسدد</th>
                      <th>المتبقي</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>اشتراك كورس {data.courseName}</strong>
                        <div className="item-sub-desc">
                          يشمل المنهج التدريبي، المعامل العملية، والمتابعة التقييمية الشهرية.
                        </div>
                      </td>
                      <td>{data.totalAmount.toLocaleString("ar-EG")} ج.م</td>
                      <td style={{ color: "#0d9488", fontWeight: 700 }}>
                        {data.paidAmount.toLocaleString("ar-EG")} ج.م
                      </td>
                      <td style={{ color: data.remainingAmount > 0 ? "#dc2626" : "#16a34a", fontWeight: 800 }}>
                        {data.remainingAmount.toLocaleString("ar-EG")} ج.م
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {data.payments.length > 0 && (
                <div className="invoice-history-box">
                  <h4>سجل الدفعات وسندات القبض الصادرة:</h4>
                  <table className="paper-table mini">
                    <thead>
                      <tr>
                        <th>رقم السند</th>
                        <th>تاريخ السداد</th>
                        <th>الطريقة</th>
                        <th>المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.payments.map((p, i) => (
                        <tr key={p.id || i}>
                          <td className="code-mono">{formatFinancialCode(p.id, "payment")}</td>
                          <td>{p.date}</td>
                          <td>{p.method}</td>
                          <td className="amount-cell">{p.amount.toLocaleString("ar-EG")} ج.م</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Footer & Signatures */}
          <footer className="paper-footer">
            <div className="footer-signatures">
              <div className="sig-block">
                <span className="sig-title">توقيع المستلم / الخزينة:</span>
                <span className="sig-name">
                  {isReceipt ? data.collectorName || "شؤون الحسابات والفرع" : "شؤون الحسابات والفرع"}
                </span>
                <div className="sig-line" />
              </div>

              <div className="sig-block stamp-block">
                <span className="sig-title">خاتم الأكاديمية والفرع:</span>
                <div className="paper-stamp-circle">
                  <span>أكاديمية مدى</span>
                  <small>معتمد ماليًا</small>
                </div>
              </div>

              <div className="sig-block">
                <span className="sig-title">توقيع ولي الأمر / الطالب:</span>
                <span className="sig-name">{data.parentName}</span>
                <div className="sig-line" />
              </div>
            </div>

            <div className="paper-policy-note">
              <span>* يُعد هذا المستند إشعاراً رسمياً معتمداً من أكاديمية مدى. يرجى الاحتفاظ به كإثبات سداد لتقديمه عند المراجعة.</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
