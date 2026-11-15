import React, { useRef } from "react";
import {
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  CalendarDays,
  MapPin,
  Building2,
  Wallet,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { tafqeet } from "@/lib/tafqeet";
import "./ShiftReconciliationPrintModal.css";

export interface PrintableShiftData {
  shiftId: string;
  shiftName: string;
  shiftDate: string;
  branchName: string;
  cashierName: string;
  cashAmount: number;
  electronicAmount: number;
  totalReceiptsCount: number;
  countedCash?: number;
  difference?: number;
  status: "SUBMITTED" | "ACCEPTED" | "DISCREPANCY";
  receivedByName?: string;
  receivedAt?: string;
  notes?: string;
}

export interface ShiftReconciliationSummary {
  totalCollected: number;
  counted: number;
  difference: number;
  differenceStatus: "BALANCED" | "SURPLUS" | "DEFICIT";
  cashTafqeet: string;
  totalTafqeet: string;
}

export function calculateShiftReconciliationSummary(shift: PrintableShiftData): ShiftReconciliationSummary {
  const totalCollected = shift.cashAmount + shift.electronicAmount;
  const counted = shift.countedCash ?? shift.cashAmount;
  const diff = shift.difference ?? (counted - shift.cashAmount);

  let differenceStatus: "BALANCED" | "SURPLUS" | "DEFICIT" = "BALANCED";
  if (diff > 0) differenceStatus = "SURPLUS";
  else if (diff < 0) differenceStatus = "DEFICIT";

  return {
    totalCollected,
    counted,
    difference: diff,
    differenceStatus,
    cashTafqeet: tafqeet(shift.cashAmount),
    totalTafqeet: tafqeet(totalCollected),
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shift: PrintableShiftData | null;
}

export function ShiftReconciliationPrintModal({ isOpen, onClose, shift }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !shift) return null;

  const totalCollected = shift.cashAmount + shift.electronicAmount;
  const isAccepted = shift.status === "ACCEPTED";
  const counted = shift.countedCash ?? shift.cashAmount;
  const diff = shift.difference ?? (counted - shift.cashAmount);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="dialog-backdrop shift-print-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="shift-print-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shift-print-title"
      >
        {/* Floating Action Bar (Hidden during print) */}
        <div className="shift-print-action-bar no-print">
          <div className="shift-print-meta-preview">
            <Wallet size={18} color="#0f766e" />
            <span>سند تقفيل الوردية وجرد الخزينة #{shift.shiftId.slice(-6).toUpperCase()}</span>
          </div>

          <div className="shift-print-actions">
            <button
              type="button"
              className="button button-primary shift-print-btn"
              onClick={handlePrint}
            >
              <Printer size={16} />
              <span>طباعة السند (A4)</span>
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
              aria-label="إغلاق"
            >
              <X size={16} />
              <span>إغلاق</span>
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="shift-printable-paper" ref={printRef} dir="rtl">
          {/* Header */}
          <header className="shift-paper-header">
            <div className="shift-header-right">
              <div className="shift-brand">
                <span className="shift-brand-icon">
                  <Building2 size={24} />
                </span>
                <div>
                  <h1 className="shift-academy-name">أكاديمية مـدى للـروبوتكس والتكنولوجيا</h1>
                  <span className="shift-subtitle">
                    سند إغلاق الوردية وجرد الخزينة النقدية اليومية (Daily Shift Closeout)
                  </span>
                </div>
              </div>
              <div className="shift-branch-badge">
                <MapPin size={12} />
                <span>فرع {shift.branchName} · الخزينة الفرعية</span>
              </div>
            </div>

            <div className="shift-header-left">
              <div className="shift-doc-badge">
                <span className="shift-doc-kind">سند تسليم عهدة وردية</span>
                <strong className="shift-doc-id">#{shift.shiftId.slice(-6).toUpperCase()}</strong>
              </div>
              <div className="shift-date-row">
                <CalendarDays size={12} />
                <span>تاريخ الوردية: {shift.shiftDate}</span>
              </div>
            </div>
          </header>

          <div className="shift-header-divider" />

          {/* Shift & Staff Info Grid */}
          <section className="shift-info-grid">
            <div className="shift-info-col">
              <div className="shift-info-row">
                <span className="shift-info-label">اسم الوردية:</span>
                <strong className="shift-info-value">
                  {shift.shiftName === "MORNING" || shift.shiftName.includes("صباح")
                    ? "الوردية الصباحية (Morning Shift)"
                    : "الوردية المسائية (Evening Shift)"}
                </strong>
              </div>
              <div className="shift-info-row">
                <span className="shift-info-label">مسؤول الوردية / الكاشير:</span>
                <strong className="shift-info-value">{shift.cashierName}</strong>
              </div>
              <div className="shift-info-row">
                <span className="shift-info-label">حالة الاعتماد:</span>
                <span className={`shift-status-pill ${isAccepted ? "accepted" : "pending"}`}>
                  {isAccepted ? "معتمد ومستلم من المحاسب ✓" : "قيد المراجعة والاستلام"}
                </span>
              </div>
            </div>

            <div className="shift-info-col">
              <div className="shift-info-row">
                <span className="shift-info-label">المحاسب المستلم:</span>
                <strong className="shift-info-value">
                  {shift.receivedByName || "بانتظار استلام المحاسب المالي"}
                </strong>
              </div>
              <div className="shift-info-row">
                <span className="shift-info-label">توقيت التسليم:</span>
                <span className="shift-info-value">
                  {shift.receivedAt
                    ? new Date(shift.receivedAt).toLocaleTimeString("ar-EG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "اليوم"}
                </span>
              </div>
              <div className="shift-info-row">
                <span className="shift-info-label">إجمالي إيصالات الوردية:</span>
                <strong className="shift-info-value" style={{ color: "#0f766e" }}>
                  {shift.totalReceiptsCount} إيصالات وسندات قبض
                </strong>
              </div>
            </div>
          </section>

          {/* Collections Table */}
          <section className="shift-table-section">
            <table className="shift-collections-table">
              <thead>
                <tr>
                  <th>بند التحصيل</th>
                  <th>طريقة الدفع / القناة</th>
                  <th>عدد العمليات</th>
                  <th style={{ textAlign: "left" }}>المبلغ المحصل (ج.م)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>النقدية السائلة بالدرج (Cash Collections)</strong>
                    <small style={{ display: "block", color: "#64748b" }}>
                      المبالغ النقدية المحصلة فعلياً من أولياء الأمور
                    </small>
                  </td>
                  <td>خزينة الكاش</td>
                  <td>—</td>
                  <td style={{ textAlign: "left", fontWeight: 700, fontSize: "1.05rem" }}>
                    {shift.cashAmount.toLocaleString("en-US")} ج.م
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>المدفوعات الإلكترونية (InstaPay / E-Wallets / Cards)</strong>
                    <small style={{ display: "block", color: "#64748b" }}>
                      تحويلات إنستاباي، فودافون كاش، وفيزا المودعة في حساب الأكاديمية
                    </small>
                  </td>
                  <td>حسابات بنكية ومحافظ</td>
                  <td>—</td>
                  <td style={{ textAlign: "left", fontWeight: 700, fontSize: "1.05rem" }}>
                    {shift.electronicAmount.toLocaleString("en-US")} ج.م
                  </td>
                </tr>
                <tr className="shift-total-row">
                  <td colSpan={3}>
                    <strong>إجمالي إيرادات الوردية (Total Shift Revenue)</strong>
                  </td>
                  <td
                    style={{
                      textAlign: "left",
                      fontWeight: 800,
                      fontSize: "1.2rem",
                      color: "#0f766e",
                    }}
                  >
                    {totalCollected.toLocaleString("en-US")} ج.م
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Cash Drawer Reconciliation Box */}
          <section className="shift-reconciliation-box">
            <div className="shift-box-title">
              <ShieldCheck size={18} color="#0f766e" />
              <h3>مطابقة وجرد الخزينة النقدية (Cash Reconciliation)</h3>
            </div>

            <div className="shift-reconciliation-grid">
              <div className="shift-reconcile-card">
                <span>الكاش المسجل بالنظام</span>
                <strong>{shift.cashAmount.toLocaleString("en-US")} ج.م</strong>
              </div>
              <div className="shift-reconcile-card">
                <span>العد الفعلي للنقدية بالدرج</span>
                <strong>{counted.toLocaleString("en-US")} ج.م</strong>
              </div>
              <div className={`shift-reconcile-card ${diff === 0 ? "match" : "variance"}`}>
                <span>فارق الجرد (العجز / الزيادة)</span>
                <strong>
                  {diff === 0 ? "مطابق تماماً (0 ج.م) ✓" : `${diff > 0 ? "+" : ""}${diff} ج.م`}
                </strong>
              </div>
            </div>

            {diff !== 0 && (
              <div className="shift-discrepancy-alert">
                <AlertCircle size={16} />
                <span>
                  <strong>تنبيه:</strong> يوجد فارق بين النقدية الفعلية وسجلات النظام بمقدار {Math.abs(diff)} ج.م.
                  {shift.notes ? ` أسباب الفارق: ${shift.notes}` : ""}
                </span>
              </div>
            )}

            {/* Arabic Tafqeet Box */}
            <div className="shift-tafqeet-box">
              <span className="shift-tafqeet-label">المبلغ النقدي المسلّم للخزينة كتابةً:</span>
              <strong className="shift-tafqeet-text">فقط {tafqeet(shift.cashAmount)} لا غير.</strong>
            </div>
          </section>

          {shift.notes && (
            <div className="shift-notes-box">
              <strong>ملاحظات الوردية:</strong> {shift.notes}
            </div>
          )}

          {/* Signatures & Approvals */}
          <footer className="shift-paper-footer">
            <div className="shift-signature-col">
              <span className="shift-sign-title">مسؤول الاستقبال والوردية (المسلّم)</span>
              <strong className="shift-sign-name">{shift.cashierName}</strong>
              <div className="shift-sign-line">التوقيع: .......................................</div>
            </div>

            <div className="shift-signature-col">
              <span className="shift-sign-title">المحاسب المالي المستلم</span>
              <strong className="shift-sign-name">
                {shift.receivedByName || "......................................."}
              </strong>
              <div className="shift-sign-line">التوقيع: .......................................</div>
            </div>

            <div className="shift-signature-col">
              <span className="shift-sign-title">اعتماد مدير الفرع</span>
              <strong className="shift-sign-name">إدارة فرع {shift.branchName}</strong>
              <div className="shift-sign-line">الختم والاعتماد: ..............................</div>
            </div>
          </footer>

          {/* Print Watermark Footnote */}
          <div className="shift-doc-footnote">
            <span>سند مالي رسمي صادر من منصة إدارة أكاديمية مدى للروبوتكس · يُحفظ بأرشيف الحسابات</span>
            <span>تاريخ الطباعة: {new Date().toLocaleDateString("ar-EG")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
