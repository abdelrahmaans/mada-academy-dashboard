import React, { useState, type FormEvent } from "react";
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
  const [closingDone, setClosingDone] = useState(false);
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

  const handleConfirmDailyClosing = () => {
    setClosingDone(true);
    setShowDailyClosing(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Daily Reconciliation Banner */}
      <div className="daily-closing-banner">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#dcfce7", color: "#15803d", display: "grid", placeItems: "center" }}>
            <Calculator size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <strong style={{ fontSize: "0.98rem", color: "#166534" }}>تقفيل اليوم المالي ومطابقة التحصيلات</strong>
              {closingDone ? (
                <span style={{ fontSize: "0.75rem", fontWeight: 700, background: "#15803d", color: "#fff", padding: "2px 8px", borderRadius: "12px" }}>
                  تم الإقفال بنجاح ✓
                </span>
              ) : (
                <span style={{ fontSize: "0.75rem", fontWeight: 600, background: "#fef08a", color: "#854d0e", padding: "2px 8px", borderRadius: "12px" }}>
                  بانتظار تأكيد المحاسب
                </span>
              )}
            </div>
            <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#374151" }}>
              {todayFormatted} · إجمالي التحصيلات النشطة: <strong>{money(totalCollectedSum)} ج.م</strong> · المتبقي قيد التحصيل: <strong>{money(totalRemainingSum)} ج.م</strong>
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
            background: closingDone ? "#15803d" : "#0d9488",
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
          <span>{closingDone ? "عرض محضر تقفيل اليوم" : "مراجعة وتأكيد تقفيل اليوم"}</span>
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

            {/* Totals Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "18px" }}>
              <div style={{ background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: "10px", padding: "12px" }}>
                <span style={{ fontSize: "0.75rem", color: "#0f766e", display: "block" }}>إجمالي تحصيل الفواتير:</span>
                <strong style={{ fontSize: "1.1rem", color: "#115e59" }}>{money(totalCollectedSum)} ج.م</strong>
              </div>
              <div style={{ background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: "10px", padding: "12px" }}>
                <span style={{ fontSize: "0.75rem", color: "#1e40af", display: "block" }}>ورديات الكاش الموردة:</span>
                <strong style={{ fontSize: "1.1rem", color: "#1e3a8a" }}>6,400 ج.م</strong>
              </div>
              <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "10px", padding: "12px" }}>
                <span style={{ fontSize: "0.75rem", color: "#991b1b", display: "block" }}>المصروفات اليومية:</span>
                <strong style={{ fontSize: "1.1rem", color: "#7f1d1d" }}>450 ج.م</strong>
              </div>
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

            {/* Confirm Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowDailyClosing(false)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: "0.85rem", cursor: "pointer" }}
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={handleConfirmDailyClosing}
                style={{ padding: "8px 18px", borderRadius: "8px", border: 0, background: "#0d9488", color: "#fff", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <CheckCircle size={15} />
                <span>تأكيد واعتماد إقفال اليومية</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
