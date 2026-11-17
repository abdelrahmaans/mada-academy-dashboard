import React, { useState } from "react";
import {
  X,
  Printer,
  CreditCard,
  MessageCircle,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  MapPin,
  BookOpen,
  Calendar,
  Receipt,
  Download,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { tafqeet } from "@/lib/tafqeet";
import type { Invoice, PaymentMethod } from "@/pages/FinanceDeskTypes";
import "./InvoiceDetailsModal.css";

interface Props {
  isOpen: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onRecordPayment?: (invoiceId: string) => void;
  onPrintInvoice?: (invoice: Invoice) => void;
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  paid: { label: "مدفوعة بالكامل ✓", bg: "#dcfce7", color: "#15803d" },
  partial: { label: "سداد جزئي", bg: "#fef3c7", color: "#b45309" },
  overdue: { label: "متأخرة السداد ⚠️", bg: "#fee2e2", color: "#dc2626" },
  unpaid: { label: "غير مسددة", bg: "#f1f5f9", color: "#475569" },
};

const PAYMENT_METHOD_NAMES: Record<string, string> = {
  CASH: "نقدي (خزينة الفرع)",
  VISA: "بطاقة بنكية / فيزا",
  INSTAPAY: "إنستاباي (InstaPay)",
  VODAFONE_CASH: "محفظة إلكترونية (فودافون كاش)",
};

export function InvoiceDetailsModal({
  isOpen,
  invoice,
  onClose,
  onRecordPayment,
  onPrintInvoice,
}: Props) {
  if (!isOpen || !invoice) return null;

  const total = invoice.total;
  const collected = invoice.collected;
  const remaining = Math.max(0, total - collected);
  const percentPaid = total > 0 ? Math.min(100, Math.round((collected / total) * 100)) : 0;
  const statusMeta = STATUS_LABELS[invoice.status || "unpaid"] || STATUS_LABELS.unpaid;

  const handleSendWhatsAppReminder = () => {
    const parentPhone = (invoice as any).phone || (invoice as any).parentPhone || "+201011223344";
    let cleanPhone = parentPhone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "2" + cleanPhone;
    if (!cleanPhone.startsWith("20") && cleanPhone.length === 10) cleanPhone = "20" + cleanPhone;

    const message = encodeURIComponent(
      `مرحباً ${invoice.parent}،\nتحية طيبة من إدارة الحسابات بأكاديمية مدى للروبوتكس 🤖\nنود إحاطتكم علماً بتفاصيل فاتورة الطالب البطل *${invoice.student}* لدورة (${invoice.course}) بفرع ${invoice.branch}:\n• رقم الفاتورة: ${invoice.number}\n• إجمالي الرسوم: ${total.toLocaleString()} ج.م\n• المسدد: ${collected.toLocaleString()} ج.م\n• المتبقي: ${remaining.toLocaleString()} ج.م\nتاريخ الاستحقاق: ${invoice.due}\nيمكن السداد نقداً في الفرع أو عبر إنستاباي والمحافظ الإلكترونية.\nشكراً لتعاونكم وثقتكم بنا 🌟`
    );

    window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}&text=${message}`, "_blank");
    toast.success("تم تجهيز رسالة التذكير وفتح الواتساب بنجاح!");
  };

  return (
    <div
      className="invoice-details-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="invoice-details-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-details-title"
      >
        {/* Header */}
        <div className="invoice-details-header">
          <div className="invoice-header-meta">
            <div className="invoice-icon-badge">
              <Receipt size={22} />
            </div>
            <div>
              <div className="invoice-title-row">
                <h3 id="invoice-details-title">فاتورة اشتراك {invoice.number}</h3>
                <span
                  className="invoice-status-chip"
                  style={{ background: statusMeta.bg, color: statusMeta.color }}
                >
                  {statusMeta.label}
                </span>
              </div>
              <p className="invoice-subtitle">
                للطالب: <strong>{invoice.student}</strong> · ولي الأمر: {invoice.parent}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="invoice-close-btn"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Bar (العمليات أولاً بشكل سهل وواضح) */}
        <div className="invoice-quick-actions-bar">
          <div className="invoice-actions-left">
            {remaining > 0 && onRecordPayment && (
              <button
                type="button"
                className="invoice-action-btn primary"
                onClick={() => {
                  onClose();
                  onRecordPayment(invoice.id);
                }}
              >
                <CreditCard size={15} />
                <span>تحصيل دفعة وسند قبض 💳</span>
              </button>
            )}

            <button
              type="button"
              className="invoice-action-btn whatsapp"
              onClick={handleSendWhatsAppReminder}
            >
              <MessageCircle size={15} />
              <span>إرسال تذكير سداد واتساب</span>
            </button>

            {onPrintInvoice && (
              <button
                type="button"
                className="invoice-action-btn secondary"
                onClick={() => onPrintInvoice(invoice)}
              >
                <Printer size={15} />
                <span>طباعة الفاتورة والسندات (A4)</span>
              </button>
            )}
          </div>
        </div>

        {/* Body Content */}
        <div className="invoice-details-body">
          {/* Progress & Summary Cards */}
          <div className="invoice-financial-cards">
            <div className="invoice-stat-box">
              <span className="invoice-stat-label">إجمالي الفاتورة المطلوب</span>
              <strong className="invoice-stat-value total">
                {total.toLocaleString()} <em>ج.م</em>
              </strong>
              <small className="invoice-tafqeet">{tafqeet(total)}</small>
            </div>

            <div className="invoice-stat-box">
              <span className="invoice-stat-label">المبلغ المسدد بالفعل</span>
              <strong className="invoice-stat-value paid">
                {collected.toLocaleString()} <em>ج.م</em>
              </strong>
              <small style={{ color: "#16a34a" }}>{percentPaid}% تم تحصيله</small>
            </div>

            <div className="invoice-stat-box">
              <span className="invoice-stat-label">المتبقي المستحق</span>
              <strong className="invoice-stat-value remaining">
                {remaining.toLocaleString()} <em>ج.م</em>
              </strong>
              <small style={{ color: remaining > 0 ? "#dc2626" : "#16a34a" }}>
                {remaining > 0 ? `استحقاق: ${invoice.due}` : "تم السداد كاملاً ✓"}
              </small>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="invoice-progress-container">
            <div className="invoice-progress-meta">
              <span>نسبة اكتمال سداد الفاتورة:</span>
              <strong>{percentPaid}%</strong>
            </div>
            <div className="invoice-progress-track">
              <div
                className="invoice-progress-bar"
                style={{
                  width: `${percentPaid}%`,
                  background:
                    percentPaid === 100
                      ? "linear-gradient(90deg, #10b981, #059669)"
                      : "linear-gradient(90deg, #0d9488, #0f766e)",
                }}
              />
            </div>
          </div>

          {/* Details & Specs Grid (مكان للديتيلز) */}
          <div className="invoice-specs-grid">
            <div className="invoice-spec-item">
              <span className="spec-label">
                <BookOpen size={13} /> البرنامج التدريبي والكورس:
              </span>
              <strong>{invoice.course}</strong>
            </div>
            <div className="invoice-spec-item">
              <span className="spec-label">
                <MapPin size={13} /> فرع الأكاديمية:
              </span>
              <strong>{invoice.branch}</strong>
            </div>
            <div className="invoice-spec-item">
              <span className="spec-label">
                <Clock size={13} /> موعد الاستحقاق النهائي:
              </span>
              <strong>{invoice.due}</strong>
            </div>
            <div className="invoice-spec-item">
              <span className="spec-label">
                <User size={13} /> اسم ولي الأمر المسجل:
              </span>
              <strong>{invoice.parent}</strong>
            </div>
          </div>

          {/* Ledger of Payments and Receipts */}
          <div className="invoice-ledger-section">
            <div className="invoice-ledger-header">
              <Receipt size={16} color="#0d9488" />
              <span>سجل سندات القبض والدفعات المسجلة ({invoice.payments?.length ?? 0})</span>
            </div>

            {(!invoice.payments || invoice.payments.length === 0) ? (
              <div className="invoice-empty-ledger">
                <AlertCircle size={28} color="#94a3b8" />
                <p>لم يتم تسجيل أي دفعات أو سندات قبض لهذه الفاتورة بعد.</p>
              </div>
            ) : (
              <div className="invoice-ledger-table-wrap">
                <table className="invoice-ledger-table">
                  <thead>
                    <tr>
                      <th>رقم السند</th>
                      <th>تاريخ التحصيل</th>
                      <th>طريقة الدفع</th>
                      <th>المبلغ المحصل</th>
                      <th>المرجع / الملاحظات</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.payments.map((p, idx) => {
                      const amountEgp = p.amountPiastres ? p.amountPiastres / 100 : (p as any).amount || 0;
                      return (
                        <tr key={p.id || idx}>
                          <td>
                            <strong dir="ltr">REC-#{p.id ? p.id.slice(-4).toUpperCase() : `0${idx + 1}`}</strong>
                          </td>
                          <td dir="ltr">{p.receivedOn || p.createdAt?.slice(0, 10) || "اليوم"}</td>
                          <td>
                            <span className="payment-method-chip">
                              {PAYMENT_METHOD_NAMES[p.method] || p.method}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: "#166534" }}>{amountEgp.toLocaleString()} ج.م</strong>
                          </td>
                          <td>{p.externalReference || p.note || "تحصيل قسط تدريبي معتمد"}</td>
                          <td>
                            <span className="payment-verified-badge">
                              <CheckCircle2 size={12} /> معتمد بالخزينة
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="invoice-details-footer">
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            تم توثيق الفاتورة بالحسابات المركزية لأكاديمية مدى
          </span>
          <button
            type="button"
            className="invoice-footer-close-btn"
            onClick={onClose}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
