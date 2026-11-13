import React, { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Calculator,
  CalendarDays,
  Check,
  CheckCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  FileDown,
  FileText,
  Lock,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import type { Invoice, PaymentMethod } from "@/pages/FinanceDeskTypes";
import {
  money,
  invoiceStatus,
  PanelTitle,
  STATUS_LABEL,
  PAYMENT_METHOD_LABELS,
} from "./FinanceShared";

export function Collections({
  invoices,
  query,
  setQuery,
  paymentInvoice,
  setPaymentInvoice,
  amount,
  setAmount,
  submitting,
  evidenceUploadingIds,
  onSubmit,
  onCreateInvoice,
  onUploadEvidence,
  onDownloadEvidence,
  paymentMethod,
  setPaymentMethod,
  receivedOn,
  setReceivedOn,
  externalReference,
  setExternalReference,
  roleCode,
}: {
  invoices: Invoice[];
  query: string;
  setQuery: (v: string) => void;
  paymentInvoice: string;
  setPaymentInvoice: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  submitting: boolean;
  evidenceUploadingIds: ReadonlySet<string>;
  onSubmit: (e: FormEvent) => void;
  onCreateInvoice: () => void;
  onUploadEvidence: (paymentId: string, file: File) => void;
  onDownloadEvidence: (paymentId: string, fileName: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (v: PaymentMethod) => void;
  receivedOn: string;
  setReceivedOn: (v: string) => void;
  externalReference: string;
  setExternalReference: (v: string) => void;
  roleCode: string;
}) {
  const [showDailyClosing, setShowDailyClosing] = useState(false);
  const [closingStatus, setClosingStatus] = useState<"OPEN" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED">("OPEN");
  const [secretaryNotes, setSecretaryNotes] = useState("");
  const [accountantNotes, setAccountantNotes] = useState("يرجى مراجعة إيصال رقم #INV-102 حيث توجد فروق بقيمة 150 ج.م بين الكاش الفعلي والمسجل.");
  const [editingAccountantNotes, setEditingAccountantNotes] = useState("");
  const [showAccountantRejectInput, setShowAccountantRejectInput] = useState(false);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  const selectedInv = invoices.find(item => item.id === paymentInvoice);
  const selectedRemaining = selectedInv ? Math.max(0, selectedInv.total - selectedInv.collected) : 0;

  // Daily Closing calculations
  const totalInvoicesSum = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalCollectedSum = invoices.reduce((sum, inv) => sum + inv.collected, 0);
  const totalRemainingSum = Math.max(0, totalInvoicesSum - totalCollectedSum);

  const todayFormatted = new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const handleSecretarySubmitClosing = () => {
    setClosingStatus("SUBMITTED");
    setShowDailyClosing(false);
    toast.success("تم إرسال محضر تقفيل اليوم للمحاسب للمطابقة والاعتماد");
  };

  const handleAccountantApproveClosing = () => {
    setClosingStatus("APPROVED");
    setShowDailyClosing(false);
    toast.success("تم اعتماد محضر تقفيل اليوم المالي وتوريد العهدة للخزينة بنجاح");
  };

  const handleAccountantRequestRevision = () => {
    if (!editingAccountantNotes.trim()) {
      toast.error("يرجى كتابة سبب طلب التعديل للسكرتارية");
      return;
    }
    setAccountantNotes(editingAccountantNotes.trim());
    setClosingStatus("REVISION_REQUESTED");
    setShowAccountantRejectInput(false);
    setShowDailyClosing(false);
    toast.warning("تم إرسال طلب التعديل للسكرتارية لمراجعة الفروقات");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Daily Reconciliation Banner */}
      <div className="daily-closing-banner">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: closingStatus === "APPROVED" ? "#dcfce7" : closingStatus === "REVISION_REQUESTED" ? "#fee2e2" : closingStatus === "SUBMITTED" ? "#eff6ff" : "#f0fdfa", color: closingStatus === "APPROVED" ? "#15803d" : closingStatus === "REVISION_REQUESTED" ? "#b91c1c" : closingStatus === "SUBMITTED" ? "#1d4ed8" : "#0d9488", display: "grid", placeItems: "center" }}>
            <Calculator size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <strong style={{ fontSize: "0.98rem", color: closingStatus === "REVISION_REQUESTED" ? "#991b1b" : "#166534" }}>تقفيل اليوم المالي ومطابقة التحصيلات</strong>
              {closingStatus === "APPROVED" && (
                <span style={{ fontSize: "0.75rem", fontWeight: 700, background: "#15803d", color: "#fff", padding: "2px 8px", borderRadius: "12px" }}>
                  تم الإقفال بنجاح واعتماده من المحاسب ✓
                </span>
              )}
              {closingStatus === "SUBMITTED" && (
                <span style={{ fontSize: "0.75rem", fontWeight: 600, background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: "12px" }}>
                  بانتظار تأكيد واعتماد المحاسب ⏳
                </span>
              )}
              {closingStatus === "REVISION_REQUESTED" && (
                <span style={{ fontSize: "0.75rem", fontWeight: 700, background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: "12px" }}>
                  مطلوب تعديل من المحاسب ⚠️
                </span>
              )}
              {closingStatus === "OPEN" && (
                <span style={{ fontSize: "0.75rem", fontWeight: 600, background: "#ccfbf1", color: "#0f766e", padding: "2px 8px", borderRadius: "12px" }}>
                  قيد التحصيل اليومي (مفتوح للسكرتارية)
                </span>
              )}
            </div>
            <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#374151" }}>
              {todayFormatted} · إجمالي التحصيلات النشطة: <strong>{money(totalCollectedSum)} ج.م</strong> · المتبقي قيد التحصيل: <strong>{money(totalRemainingSum)} ج.م</strong>
              {closingStatus === "REVISION_REQUESTED" && (
                <span style={{ display: "block", color: "#b91c1c", fontWeight: 600, marginTop: "2px" }}>
                  ملاحظة المحاسب: {accountantNotes}
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowDailyClosing(true)}
          style={{
            padding: "8px 16px",
            borderRadius: "10px",
            fontSize: "0.85rem",
            fontWeight: 700,
            background: closingStatus === "APPROVED" ? "#15803d" : closingStatus === "REVISION_REQUESTED" ? "#dc2626" : closingStatus === "SUBMITTED" ? "#2563eb" : "#0d9488",
            color: "#ffffff",
            border: 0,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 8px rgba(13, 148, 136, 0.2)",
          }}
        >
          <CheckCircle size={16} />
          <span>
            {closingStatus === "APPROVED"
              ? "عرض محضر تقفيل اليوم المعتمد"
              : closingStatus === "REVISION_REQUESTED"
              ? "مراجعة وتعديل التقفيل المطلوب"
              : closingStatus === "SUBMITTED"
              ? "عرض تفاصيل المحضر بانتظار الاعتماد"
              : "تقفيل اليوم المالي وإرساله للمحاسب"}
          </span>
        </button>
      </div>

      <div className="finance-desk-two-col">
        {/* Left Column: Invoices & Balances */}
        <section className="finance-desk-panel">
          <PanelTitle
            icon={<CreditCard size={18} />}
            title="الفواتير والأرصدة المستحقة"
            action={
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <button
                  className="finance-desk-secondary"
                  type="button"
                  onClick={onCreateInvoice}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "32px", padding: "0 12px", borderRadius: "8px", fontSize: "0.82rem" }}
                >
                  <Plus size={15} /> إنشاء فاتورة
                </button>
                <label className="finance-desk-search" style={{ height: "32px" }}>
                  <Search size={14} />
                  <input
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="بحث برقم الفاتورة أو اسم الطالب..."
                    style={{ width: "170px", fontSize: "0.82rem" }}
                  />
                </label>
              </div>
            }
          />

          <div className="finance-invoices-container">
            {invoices.length === 0 ? (
              <p className="finance-desk-empty" style={{ padding: "30px 0", textAlign: "center", color: "#64748b" }}>
                لا توجد فواتير مطابقة للبحث أو الفرع المحدد.
              </p>
            ) : (
              invoices.map(invoice => {
                const status = invoiceStatus(invoice);
                const remaining = Math.max(0, invoice.total - invoice.collected);
                const percentPaid = Math.min(100, Math.round((invoice.collected / invoice.total) * 100));
                const isExpanded = expandedInvoiceId === invoice.id;

                return (
                  <article className="finance-invoice-card" key={invoice.id}>
                    <div className="finance-invoice-header">
                      <div className="finance-invoice-student">
                        <div className="finance-avatar-circle">
                          {invoice.student.slice(0, 1)}
                        </div>
                        <div>
                          <strong style={{ fontSize: "0.95rem", color: "#0f172a", display: "block" }}>
                            {invoice.student}
                          </strong>
                          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                            رقم الفاتورة: <bdi>{invoice.number}</bdi> · ولي الأمر: {invoice.parent}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "0.78rem", background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: "6px" }}>
                          {invoice.course} · {invoice.branch}
                        </span>
                        <span className={`finance-desk-status ${status}`}>
                          {STATUS_LABEL[status]}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="finance-invoice-progress-bar">
                      <div
                        className={`finance-invoice-progress-fill ${status}`}
                        style={{ width: `${percentPaid}%` }}
                      />
                    </div>

                    {/* Financial Numbers Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", fontSize: "0.85rem" }}>
                      <div>
                        <span style={{ color: "#64748b", fontSize: "0.78rem" }}>المبلغ الإجمالي: </span>
                        <strong style={{ color: "#0f172a" }}>{money(invoice.total)} ج.م</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b", fontSize: "0.78rem" }}>المحصل: </span>
                        <strong style={{ color: "#059669" }}>{money(invoice.collected)} ج.م ({percentPaid}%)</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b", fontSize: "0.78rem" }}>المتبقي: </span>
                        <strong style={{ color: remaining > 0 ? "#e11d48" : "#059669" }}>
                          {money(remaining)} ج.م
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b", fontSize: "0.78rem" }}>تاريخ الاستحقاق: </span>
                        <span style={{ color: "#334155" }}>{invoice.due}</span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="finance-invoice-footer">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        {remaining > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentInvoice(invoice.id);
                              setAmount(String(remaining));
                            }}
                            style={{
                              padding: "5px 12px",
                              borderRadius: "7px",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              background: "#0d9488",
                              color: "#fff",
                              border: 0,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <CreditCard size={13} /> سداد لهذه الفاتورة
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setExpandedInvoiceId(isExpanded ? null : invoice.id)}
                          style={{
                            padding: "5px 10px",
                            borderRadius: "7px",
                            fontSize: "0.78rem",
                            background: "#f8fafc",
                            color: "#475569",
                            border: "1px solid #e2e8f0",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Eye size={13} /> {isExpanded ? "إخفاء التفاصيل" : "تفاصيل الحصص والاشتراك"}
                        </button>
                      </div>

                      {/* Evidence Attachment Slots */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {invoice.payments.map(payment => {
                          const isUploading = evidenceUploadingIds.has(`payment:${payment.id}`);
                          return (
                            <span key={payment.id} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              {payment.evidenceStatus === "ATTACHED" ? (
                                <button
                                  type="button"
                                  className="btn-evidence-attached"
                                  onClick={() => onDownloadEvidence(payment.id, payment.evidenceFileName ?? `payment-${payment.id}`)}
                                >
                                  <FileDown size={13} /> إثبات مرفق · تنزيل
                                </button>
                              ) : (
                                <label className="finance-evidence-action btn-evidence-upload" aria-disabled={isUploading}>
                                  <Upload size={13} />
                                  <span>{isUploading ? "جارٍ رفع إثبات الدفع…" : "رفع إثبات الدفع"}</span>
                                  <input
                                    type="file"
                                    accept="application/pdf,image/jpeg,image/png"
                                    hidden
                                    disabled={isUploading}
                                    aria-busy={isUploading}
                                    onChange={e => {
                                      const f = e.target.files?.[0];
                                      if (f) onUploadEvidence(payment.id, f);
                                      e.currentTarget.value = "";
                                    }}
                                  />
                                </label>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Collapsible Session & Subscription Breakdown */}
                    {isExpanded && (
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 14px", marginTop: "4px", fontSize: "0.82rem" }}>
                        <div style={{ fontWeight: 700, color: "#334155", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <CalendarDays size={14} className="text-teal-600" />
                          <span>خطة الاشتراك والحصص المشمولة بالفاتورة:</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", color: "#475569" }}>
                          <div>الكورس المسجل: <strong>{invoice.course}</strong></div>
                          <div>الفرع المعتمد: <strong>{invoice.branch}</strong></div>
                          <div>عدد الحصص المشمولة: <strong>12 حصة معملية</strong></div>
                          <div>هاتف ولي الأمر: <strong>+20 100 000 0012</strong></div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column: Record Payment Card */}
        <section className="finance-desk-panel finance-payment-card">
          <PanelTitle
            icon={<Wallet size={18} />}
            title="تسجيل تحصيل جديد"
            action={
              <span className="finance-desk-context">
                <ShieldCheck size={14} /> {roleCode}
              </span>
            }
          />

          <form onSubmit={onSubmit} className="finance-payment-form-enhanced">
            {/* Selected Invoice Dropdown */}
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
              اختيار الفاتورة
              <select
                value={paymentInvoice}
                disabled={submitting}
                onChange={event => setPaymentInvoice(event.target.value)}
                style={{ height: "38px", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "0 10px", background: "#ffffff", fontSize: "0.85rem", outline: 0 }}
              >
                {invoices
                  .filter(item => item.collected < item.total)
                  .map(item => (
                    <option key={item.id} value={item.id}>
                      {item.number} · {item.student} (متبقي {money(item.total - item.collected)} ج.م)
                    </option>
                  ))}
              </select>
            </label>

            {/* Quick Context Callout */}
            {selectedInv && (
              <div className="finance-selected-invoice-callout">
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#0f766e", display: "block" }}>
                    رصيد الفاتورة المتبقي:
                  </span>
                  <strong style={{ fontSize: "1rem", color: "#115e59" }}>
                    {money(selectedRemaining)} ج.م
                  </strong>
                </div>
                {selectedRemaining > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(selectedRemaining))}
                    style={{
                      background: "#0d9488",
                      color: "#fff",
                      border: 0,
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    سداد المتبقي كاملاً
                  </button>
                )}
              </div>
            )}

            {/* Amount input */}
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
              المبلغ المحصل (ج.م)
              <input
                value={amount}
                disabled={submitting}
                onChange={event => setAmount(event.target.value)}
                type="number"
                min="1"
                step="0.01"
                placeholder="مثال: 1200"
                style={{ height: "38px", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "0.9rem", outline: 0 }}
                required
              />
            </label>

            {/* Payment Method */}
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
              طريقة الدفع
              <select
                value={paymentMethod}
                disabled={submitting}
                onChange={event => setPaymentMethod(event.target.value as PaymentMethod)}
                style={{ height: "38px", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "0 10px", background: "#ffffff", fontSize: "0.85rem", outline: 0 }}
              >
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(method => (
                  <option key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </option>
                ))}
              </select>
            </label>

            {/* Date Received */}
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
              تاريخ الاستلام
              <input
                type="date"
                value={receivedOn}
                disabled={submitting}
                onChange={event => setReceivedOn(event.target.value)}
                style={{ height: "38px", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "0.85rem", outline: 0 }}
                required
              />
            </label>

            {/* External Reference if Electronic */}
            {(paymentMethod === "INSTAPAY" || paymentMethod === "VODAFONE_CASH") && (
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
                المرجع الخارجي / رقم المعاملة
                <input
                  value={externalReference}
                  disabled={submitting}
                  onChange={event => setExternalReference(event.target.value)}
                  placeholder="مثال: IPN-984210 أو رقم التحويل"
                  style={{ height: "38px", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "0.85rem", outline: 0 }}
                  required
                />
              </label>
            )}

            <button
              className="finance-desk-primary"
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              style={{
                height: "42px",
                borderRadius: "10px",
                fontSize: "0.92rem",
                fontWeight: 700,
                background: "#0d9488",
                color: "#ffffff",
                border: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "6px",
              }}
            >
              <Check size={16} />
              <span>{submitting ? "جارٍ تسجيل التحصيل…" : "تسجيل التحصيل فوراً"}</span>
            </button>

            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertCircle size={13} className="text-teal-600" />
              <span>سيتم ترحيل المعاملة لسندات الخزينة مع توثيق اسم المحاسب.</span>
            </p>
          </form>
        </section>
      </div>

      {/* Daily Reconciliation / Closing Modal */}
      {showDailyClosing && (
        <div className="finance-modal-backdrop" onClick={() => setShowDailyClosing(false)}>
          <div className="finance-modal-content" onClick={e => e.stopPropagation()} dir="rtl">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#dcfce7", color: "#16a34a", display: "grid", placeItems: "center" }}>
                  <Calculator size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                    محضر تقفيل اليوم المالي والمطابقة
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{todayFormatted}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDailyClosing(false)}
                style={{ background: "transparent", border: 0, color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Status Feedback Banner inside Modal */}
            {closingStatus === "REVISION_REQUESTED" && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#b91c1c", fontWeight: 700, fontSize: "0.88rem", marginBottom: "4px" }}>
                  <AlertCircle size={17} />
                  <span>ملاحظة المحاسب المطلوب تعديلها:</span>
                </div>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#7f1d1d", lineHeight: 1.5 }}>
                  {accountantNotes}
                </p>
              </div>
            )}

            {closingStatus === "SUBMITTED" && (
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "12px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#1d4ed8", fontWeight: 700, fontSize: "0.88rem" }}>
                  <Clock3 size={17} />
                  <span>تم إرسال المحضر بنجاح، وبانتظار تدقيق واعتماد المحاسب المالي.</span>
                </div>
              </div>
            )}

            {/* Totals Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "18px" }}>
              <div style={{ background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: "10px", padding: "12px" }}>
                <span style={{ fontSize: "0.75rem", color: "#0f766e", display: "block" }}>إجمالي تحصيل الفواتير:</span>
                <strong style={{ fontSize: "1.1rem", color: "#115e59" }}>{money(totalCollectedSum)} ج.م</strong>
              </div>
              <div style={{ background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: "10px", padding: "12px" }}>
                <span style={{ fontSize: "0.75rem", color: "#1e40af", display: "block" }}>ورديات الكاش الموردة:</span>
                <strong style={{ fontSize: "1.1rem", color: "#1e3a8a" }}>{money(Math.round(totalCollectedSum * 0.65))} ج.م</strong>
              </div>
              <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "10px", padding: "12px" }}>
                <span style={{ fontSize: "0.75rem", color: "#991b1b", display: "block" }}>التحصيل الإلكتروني (بطاقة/تحويل):</span>
                <strong style={{ fontSize: "1.1rem", color: "#7f1d1d" }}>{money(Math.round(totalCollectedSum * 0.35))} ج.م</strong>
              </div>
            </div>

            {/* Secretary Notes Input */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                ملاحظات وتوضيحات مسؤولة الاستقبال / السكرتارية على اليومية:
              </label>
              <textarea
                value={secretaryNotes}
                onChange={e => setSecretaryNotes(e.target.value)}
                placeholder="أدخل أي ملاحظات على فروقات النقدية أو المعاملات المؤجلة هنا..."
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.82rem",
                  fontFamily: "inherit",
                  resize: "vertical",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            {/* Checklist */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", marginBottom: "18px" }}>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#334155", marginBottom: "10px" }}>
                قائمة تدقيق وضوابط الرقابة اليومية:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.82rem", color: "#475569" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" defaultChecked />
                  <span>تم مطابقة سندات القبض الإلكترونية والنقدية مع سجل فواتير الطلاب.</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" defaultChecked />
                  <span>تم استلام نقدية عهدة وردية الاستقبال ومطابقتها مع محتويات الخزينة.</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" defaultChecked />
                  <span>تم توثيق سندات الصرف النثري وفواتير المشتريات المعتمدة.</span>
                </label>
              </div>
            </div>

            {/* Accountant Reject Reason Form */}
            {showAccountantRejectInput && (
              <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "10px", padding: "14px", marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#9f1239", marginBottom: "6px" }}>
                  سبب طلب التعديل وإرجاع المحضر للسكرتارية:
                </label>
                <textarea
                  value={editingAccountantNotes}
                  onChange={e => setEditingAccountantNotes(e.target.value)}
                  placeholder="اكتب التوجيه المحاسبي المحدد (مثال: يوجد فرق في إيصال رقم...)"
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #f43f5e",
                    fontSize: "0.82rem",
                    fontFamily: "inherit",
                    resize: "vertical",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
                <div style={{ display: "flex", gap: "8px", marginTop: "8px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setShowAccountantRejectInput(false)}
                    style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", fontSize: "0.8rem", cursor: "pointer" }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleAccountantRequestRevision}
                    style={{ padding: "6px 14px", borderRadius: "6px", border: 0, background: "#e11d48", color: "#fff", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    إرسال طلب التعديل
                  </button>
                </div>
              </div>
            )}

            {/* Actions for Secretary and Accountant */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowDailyClosing(false)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: "0.85rem", cursor: "pointer" }}
              >
                إغلاق
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                {roleCode === "R06" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowAccountantRejectInput(v => !v)}
                      style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #fecaca", background: "#fff1f2", color: "#b91c1c", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
                    >
                      طلب تعديل
                    </button>
                    <button
                      type="button"
                      onClick={handleAccountantApproveClosing}
                      style={{ padding: "8px 18px", borderRadius: "8px", border: 0, background: "#15803d", color: "#fff", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <CheckCircle size={15} />
                      <span>اعتماد الإقفال وتوريد الخزينة</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleSecretarySubmitClosing}
                    style={{ padding: "8px 18px", borderRadius: "8px", border: 0, background: "#0d9488", color: "#fff", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <CheckCircle size={15} />
                    <span>
                      {closingStatus === "REVISION_REQUESTED"
                        ? "إعادة إرسال المحضر للمحاسب بعد التعديل"
                        : "تقفيل اليوم المالي وإرساله للمحاسب"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
