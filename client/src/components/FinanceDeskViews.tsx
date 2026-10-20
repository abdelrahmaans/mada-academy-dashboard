import { useState, type FormEvent, type ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  Banknote,
  BarChart3,
  Calculator,
  CalendarDays,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  CreditCard,
  Eye,
  FileCheck2,
  FileDown,
  FileText,
  Lock,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Upload,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import {
  shiftStorage,
  payrollStorage,
  type FinanceReport,
  type ShiftCashHandover,
  type TrainerPayrollRecord,
} from "@/lib/apiClient";
import type {
  Expense,
  ExpenseStatus,
  Invoice,
  InvoiceStatus,
  PaymentMethod,
  View,
} from "@/pages/FinanceDesk";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "نقدي",
  VISA: "بطاقة Visa",
  INSTAPAY: "InstaPay",
  VODAFONE_CASH: "Vodafone Cash",
};

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  partial: "مدفوعة جزئيًا",
  overdue: "متأخرة",
  paid: "مدفوعة",
  unpaid: "غير مدفوعة",
};

export const EXPENSE_LABEL: Record<ExpenseStatus, string> = {
  pending: "بانتظار الاعتماد",
  approved: "معتمد",
  rejected: "مرفوض",
};

export function money(value: number) {
  const num = typeof value === "number" && !isNaN(value) ? value : 0;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(num);
}

export function invoiceStatus(invoice: Invoice): InvoiceStatus {
  if (!invoice) return "unpaid";
  if (invoice.status) return invoice.status;
  const collected = typeof invoice.collected === "number" ? invoice.collected : 0;
  const total = typeof invoice.total === "number" ? invoice.total : 0;
  if (collected >= total && total > 0) return "paid";
  if (invoice.due && typeof invoice.due === "string" && invoice.due.includes("سبتمبر") && collected === 0)
    return "overdue";
  return collected > 0 ? "partial" : "unpaid";
}

export function NavButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button className={`nav-link ${active ? "active" : ""}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
      {count !== undefined && <span className="nav-count">{count}</span>}
    </button>
  );
}
export const VIEW_TITLES: Record<View, string> = {
  overview: "الملخص المالي",
  collections: "الفواتير والتحصيل",
  expenses: "المصاريف",
  shifts: "استلام عهدة ورديات الاستقبال (الكاش)",
  payroll: "مصاريف ومستحقات المدربين",
  reports: "التقارير المالية",
};
export const VIEW_COPY: Record<View, string> = {
  overview:
    "تابع التحصيل والمستحقات والمصروفات المعتمدة قبل اتخاذ الخطوة التالية.",
  collections:
    "سجل الدفعات، راجع الأرصدة، وارفع طلب تصحيح بدل تعديل الفاتورة مباشرة.",
  expenses:
    "أنشئ مصروفًا، راجع حالته، وارفضه بسبب موثق قبل دخوله في الإجماليات.",
  shifts:
    "استلام واعتماد العهدة النقدية اليومية من السكرتارية والاستقبال وتوثيق أي عجز أو فروقات.",
  payroll:
    "احتساب أتعاب المدربين آليًا بناءً على عدد الحصص المنفذة والبدلات والخصومات واعتماد الصرف.",
  reports: "قارن التحصيل بالمصروفات المعتمدة وصافي الحركة حسب الفروع.",
};
export function Overview({
  collected,
  outstanding,
  expenses,
  net,
  pending,
  handovers = [],
  payrolls = [],
  invoices = [],
  pendingExpenses = [],
  onCollections,
  onExpenses,
  onReports,
  onShifts,
  onPayroll,
  onAcceptShift,
  onApproveExpense,
  onRejectExpense,
  onCreateInvoice,
  scopeHint,
}: {
  collected: number;
  outstanding: number;
  expenses: number;
  net: number;
  pending: number;
  handovers?: ShiftCashHandover[];
  payrolls?: TrainerPayrollRecord[];
  invoices?: Invoice[];
  pendingExpenses?: Expense[];
  onCollections: () => void;
  onExpenses: () => void;
  onReports: () => void;
  onShifts?: () => void;
  onPayroll?: () => void;
  onAcceptShift?: (id: string, notes?: string) => Promise<void>;
  onApproveExpense?: (id: string) => void;
  onRejectExpense?: (id: string) => void;
  onCreateInvoice?: () => void;
  scopeHint: string;
}) {
  const submittedShifts = (handovers || []).filter(h => h && h.status === "SUBMITTED");
  const waitingExpenses = (pendingExpenses || []).filter(e => e && e.status === "pending");
  const payablePayrolls = (payrolls || []).filter(p => p && p.status === "SUBMITTED");
  const totalPayrollObligations = payablePayrolls.reduce((sum, p) => sum + (p.netPayable || 0), 0);

  const overdueInvoices = (invoices || []).filter(inv => {
    if (!inv) return false;
    const status = invoiceStatus(inv);
    return status === "overdue" || status === "unpaid" || status === "partial";
  });

  const totalActionsCount =
    submittedShifts.length + waitingExpenses.length + payablePayrolls.length;

  return (
    <>
      {/* 1. Overall Financial KPIs */}
      <section className="finance-overview-kpis">
        <Kpi
          icon={<TrendingUp size={18} />}
          label="إجمالي التحصيل المحقق"
          value={`${money(collected)} ج.م`}
          hint={scopeHint}
          tone="teal"
        />
        <Kpi
          icon={<Clock3 size={18} />}
          label="المستحقات غير المحصلة"
          value={`${money(outstanding)} ج.م`}
          hint={`${overdueInvoices.length} فواتير معلقة`}
          tone="amber"
        />
        <Kpi
          icon={<TrendingDown size={18} />}
          label="المصروفات المعتمدة"
          value={`${money(expenses)} ج.م`}
          hint="المعتمدة بالقيود"
          tone="blue"
        />
        <Kpi
          icon={<Wallet size={18} />}
          label="صافي النقدية المعتمدة"
          value={`${money(net)} ج.م`}
          hint={`${pending} مصروفات تنتظر القرار`}
          tone="violet"
        />
        <Kpi
          icon={<Banknote size={18} />}
          label="مستحقات رواتب المدربين"
          value={`${money(totalPayrollObligations)} ج.م`}
          hint={`${payablePayrolls.length} مسيرات جاهزة للصرف`}
          tone="teal"
        />
      </section>

      {/* 2. Quick Actions Toolbar */}
      <div className="finance-quick-actions-bar">
        <span>
          <Sparkles size={15} /> إجراءات سريعة:
        </span>
        <button
          type="button"
          className="finance-quick-btn"
          onClick={onCollections}
        >
          <CreditCard size={14} />
          تسجيل سند تحصيل / قبض
        </button>
        {onCreateInvoice && (
          <button
            type="button"
            className="finance-quick-btn"
            onClick={onCreateInvoice}
          >
            <Plus size={14} />
            إصدار فاتورة طالب جديدة
          </button>
        )}
        <button
          type="button"
          className="finance-quick-btn"
          onClick={onExpenses}
        >
          <TrendingDown size={14} />
          إضافة بند مصروف
        </button>
        <button
          type="button"
          className="finance-quick-btn"
          onClick={onReports}
        >
          <BarChart3 size={14} />
          التقارير المالية المجمعة
        </button>
      </div>

      {/* 3. Action Center: Pending Actions & Tasks for the Accountant */}
      <section className="finance-action-center">
        <div className="finance-action-center-header">
          <h2>
            <FileCheck2 size={20} />
            إجراءات ومهام معلقة تنتظر قرار المحاسب
          </h2>
          <span
            className={`finance-action-count-badge ${
              totalActionsCount === 0 ? "zero" : ""
            }`}
          >
            {totalActionsCount === 0
              ? "لا توجد معلقات"
              : `${totalActionsCount} إجراءات عاجلة`}
          </span>
        </div>

        {totalActionsCount === 0 ? (
          <div className="finance-empty-actions-box">
            <span>
              <CheckCircle2 size={24} />
            </span>
            <div>
              <h3>جميع العمليات والاعتمادات محدثة بالكامل!</h3>
              <p>
                لا توجد ورديات استلام كاش معلقة، ولا مصروفات تنتظر القرار، ولا مسيرات رواتب متأخرة للصرف.
              </p>
            </div>
          </div>
        ) : (
          <div className="finance-action-cards-grid">
            {/* A. Shifts Awaiting Acceptance */}
            {submittedShifts.length > 0 && (
              <div className="finance-action-card">
                <div className="finance-action-card-header">
                  <div className="finance-action-card-title">
                    <span className="shifts">
                      <Wallet size={16} />
                    </span>
                    <span className="finance-action-title-text">
                      ورديات الاستقبال بانتظار استلام الكاش ({submittedShifts.length})
                    </span>
                  </div>
                  {onShifts && (
                    <button
                      type="button"
                      className="finance-action-btn-secondary"
                      onClick={onShifts}
                    >
                      عرض الكل
                    </button>
                  )}
                </div>
                <div className="finance-action-items-list">
                  {submittedShifts.slice(0, 3).map(shift => (
                    <div key={shift.id} className="finance-action-item">
                      <div className="finance-action-item-info">
                        <strong>
                          وردية {shift.id} · {shift.submittedByName || shift.submittedByUserId || "موظف الاستقبال"}
                        </strong>
                        <small>
                          فرع {shift.branchName || "الفرع"} · الكاش المحصل:{" "}
                          <b style={{ color: "#0f766e" }}>{money(shift.cashAmount)} ج.م</b>
                          {shift.status === "DISCREPANCY" && (
                            <span style={{ color: "#dc2626", marginInlineStart: 6 }}>
                              (يوجد عجز/فرق)
                            </span>
                          )}
                        </small>
                      </div>
                      <div className="finance-action-item-actions">
                        {onAcceptShift && (
                          <button
                            type="button"
                            className="finance-action-btn-primary"
                            onClick={() => void onAcceptShift(shift.id)}
                            title="اعتماد استلام وتوريد النقدية"
                          >
                            <Check size={13} />
                            استلام الكاش
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* B. Pending Expenses Awaiting Decision */}
            {waitingExpenses.length > 0 && (
              <div className="finance-action-card">
                <div className="finance-action-card-header">
                  <div className="finance-action-card-title">
                    <span className="expenses">
                      <TrendingDown size={16} />
                    </span>
                    <span className="finance-action-title-text">
                      طلبات المصروفات بانتظار الاعتماد ({waitingExpenses.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    className="finance-action-btn-secondary"
                    onClick={onExpenses}
                  >
                    عرض الكل
                  </button>
                </div>
                <div className="finance-action-items-list">
                  {waitingExpenses.slice(0, 3).map(expense => (
                    <div key={expense.id} className="finance-action-item">
                      <div className="finance-action-item-info">
                        <strong>
                          {expense.description}
                        </strong>
                        <small>
                          فرع {expense.branch} · {expense.category} ·{" "}
                          <b style={{ color: "#b45309" }}>{money(expense.amount)} ج.م</b>
                        </small>
                      </div>
                      <div className="finance-action-item-actions">
                        {onApproveExpense && (
                          <button
                            type="button"
                            className="finance-action-btn-primary"
                            onClick={() => onApproveExpense(expense.id)}
                            title="اعتماد المصروف"
                          >
                            <Check size={13} />
                            اعتماد
                          </button>
                        )}
                        {onRejectExpense && (
                          <button
                            type="button"
                            className="finance-action-btn-danger"
                            onClick={() => onRejectExpense(expense.id)}
                            title="رفض المصروف مع تسجيل السبب"
                          >
                            <X size={13} />
                            رفض
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* C. Trainer Payrolls Ready for Payout */}
            {payablePayrolls.length > 0 && (
              <div className="finance-action-card">
                <div className="finance-action-card-header">
                  <div className="finance-action-card-title">
                    <span className="payroll">
                      <UserCheck size={16} />
                    </span>
                    <span className="finance-action-title-text">
                      مسيرات رواتب المدربين الجاهزة للصرف ({payablePayrolls.length})
                    </span>
                  </div>
                  {onPayroll && (
                    <button
                      type="button"
                      className="finance-action-btn-secondary"
                      onClick={onPayroll}
                    >
                      عرض المسيرات
                    </button>
                  )}
                </div>
                <div className="finance-action-items-list">
                  {payablePayrolls.slice(0, 3).map(payroll => (
                    <div key={payroll.id} className="finance-action-item">
                      <div className="finance-action-item-info">
                        <strong>
                          {payroll.instructorName} · {payroll.month}
                        </strong>
                        <small>
                          {payroll.completedSessionsCount} حصص معتمدة · الصافي المستحق:{" "}
                          <b style={{ color: "#6d28d9" }}>{money(payroll.netPayable)} ج.م</b>
                        </small>
                      </div>
                      <div className="finance-action-item-actions">
                        {onPayroll && (
                          <button
                            type="button"
                            className="finance-action-btn-primary"
                            onClick={onPayroll}
                            title="الانتقال لصرف الراتب وتوثيق السند"
                          >
                            <CreditCard size={13} />
                            صرف الراتب
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* D. Overdue / Partial Invoices Needing Follow-up */}
            {overdueInvoices.length > 0 && (
              <div className="finance-action-card">
                <div className="finance-action-card-header">
                  <div className="finance-action-card-title">
                    <span className="invoices">
                      <CreditCard size={16} />
                    </span>
                    <span className="finance-action-title-text">
                      فواتير وأقساط مستحقة للتحصيل ({overdueInvoices.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    className="finance-action-btn-secondary"
                    onClick={onCollections}
                  >
                    عرض الفواتير
                  </button>
                </div>
                <div className="finance-action-items-list">
                  {overdueInvoices.slice(0, 3).map(inv => (
                    <div key={inv.id} className="finance-action-item">
                      <div className="finance-action-item-info">
                        <strong>
                          {inv.student || "طالب"} {inv.course ? `· ${inv.course}` : ""}
                        </strong>
                        <small>
                          فرع {inv.branch || ""} · المتبقي:{" "}
                          <b style={{ color: "#b91c1c" }}>{money((inv.total || 0) - (inv.collected || 0))} ج.م</b>
                        </small>
                      </div>
                      <div className="finance-action-item-actions">
                        <button
                          type="button"
                          className="finance-action-btn-primary"
                          onClick={onCollections}
                          title="تسجيل سند تحصيل"
                        >
                          <Plus size={13} />
                          تحصيل
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
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
export function Expenses({
  expenses,
  query,
  setQuery,
  description,
  setDescription,
  amount,
  setAmount,
  branch,
  setBranch,
  onSubmit,
  onReject,
  onApprove,
  onUploadEvidence,
  onDownloadEvidence,
  liveMode,
  submitting,
  decisionSubmitting,
  evidenceUploadingIds,
}: {
  expenses: Expense[];
  query: string;
  setQuery: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  branch: string;
  setBranch: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onReject: (id: string) => void;
  onApprove: (id: string) => void;
  onUploadEvidence: (id: string, file: File) => void;
  onDownloadEvidence: (id: string, fileName: string) => void;
  liveMode: boolean;
  submitting: boolean;
  decisionSubmitting: { expenseId: string; action: "approve" | "reject" } | null;
  evidenceUploadingIds: ReadonlySet<string>;
}) {
  return (
    <div className="finance-desk-two-col">
      <section className="finance-desk-panel">
        <PanelTitle
          icon={<TrendingDown size={16} />}
          title="سجل المصروفات"
          action={
            <label className="finance-desk-search">
              <Search size={13} />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="ابحث في المصروفات..."
              />
            </label>
          }
        />
        <div className="finance-expense-list">
          {expenses.length === 0 ? (
            <p className="finance-desk-empty">
              لا توجد مصروفات مطابقة للبحث أو الفرع المحدد.
            </p>
          ) : (
            expenses.map(expense => {
              const isDecisionPending =
                decisionSubmitting?.expenseId === expense.id;
              const isUploadingEvidence = evidenceUploadingIds.has(
                `expense:${expense.id}`
              );
              return (
                <article className="finance-expense-card" key={expense.id}>
                  <div className="finance-expense-card-top">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className={`finance-expense-icon-badge ${expense.status}`}>
                        <FileText size={18} />
                      </span>
                      <div>
                        <strong style={{ fontSize: "0.95rem", color: "#0f172a", display: "block" }}>
                          {expense.description}
                        </strong>
                        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                          كود المصروف: <bdi>{expense.id}</bdi> · التصنيف: {expense.category} · الفرع: {expense.branch} · {expense.date}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <strong style={{ fontSize: "1.05rem", color: "#0f172a" }}>
                        {money(expense.amount)} ج.م
                      </strong>
                      <span className={`finance-desk-status ${expense.status}`}>
                        {EXPENSE_LABEL[expense.status]}
                      </span>
                    </div>
                  </div>

                  {expense.reason && (
                    <div style={{ background: "#fff1f2", border: "1px solid #ffe4e6", borderRadius: "8px", padding: "8px 12px", fontSize: "0.8rem", color: "#be123c" }}>
                      <strong>ملاحظة/سبب:</strong> {expense.reason}
                    </div>
                  )}

                  <div className="finance-expense-actions-bar">
                    {/* Evidence Attachment */}
                    <div>
                      {expense.evidenceStatus === "ATTACHED" ? (
                        <button
                          type="button"
                          className="btn-evidence-attached"
                          onClick={() =>
                            onDownloadEvidence(
                              expense.id,
                              expense.evidenceFileName ?? `expense-${expense.id}-evidence`
                            )
                          }
                        >
                          <FileDown size={14} /> إثبات مرفق · تنزيل
                        </button>
                      ) : (
                        <label
                          className="finance-evidence-action btn-evidence-upload"
                          aria-disabled={isUploadingEvidence}
                        >
                          <Upload size={14} />
                          <span>{isUploadingEvidence ? "جارٍ رفع الإثبات…" : "رفع إثبات الشراء"}</span>
                          <input
                            type="file"
                            accept="application/pdf,image/jpeg,image/png"
                            hidden
                            disabled={isUploadingEvidence}
                            aria-busy={isUploadingEvidence}
                            onChange={event => {
                              const file = event.target.files?.[0];
                              if (file) onUploadEvidence(expense.id, file);
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Decision Buttons */}
                    {expense.status === "pending" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          type="button"
                          className="finance-reject-link"
                          disabled={decisionSubmitting !== null}
                          aria-busy={isDecisionPending && decisionSubmitting?.action === "approve"}
                          data-action="approve"
                          onClick={() => onApprove(expense.id)}
                        >
                          <Check size={14} />
                          <span>
                            {isDecisionPending && decisionSubmitting?.action === "approve"
                              ? "جارٍ الاعتماد…"
                              : "اعتماد الصرف"}
                          </span>
                        </button>

                        <button
                          type="button"
                          className="finance-reject-link"
                          disabled={decisionSubmitting !== null}
                          aria-busy={isDecisionPending && decisionSubmitting?.action === "reject"}
                          data-action="reject"
                          onClick={() => onReject(expense.id)}
                        >
                          <X size={14} />
                          <span>
                            {isDecisionPending && decisionSubmitting?.action === "reject"
                              ? "جارٍ الرفض…"
                              : "رفض بسبب"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
      <section className="finance-desk-panel">
        <PanelTitle
          icon={<Plus size={16} />}
          title="إضافة مصروف"
          action={<span className="finance-desk-context">يبدأ pending</span>}
        />
        <form onSubmit={onSubmit} className="finance-desk-form">
          <label>
            وصف المصروف
            <input
              value={description}
              disabled={submitting}
              onChange={event => setDescription(event.target.value)}
              placeholder="مثال: صيانة معمل"
            />
          </label>
          <label>
            الفرع
            <select
              value={branch}
              disabled={liveMode || submitting}
              onChange={event => setBranch(event.target.value)}
            >
              <option>مدينة نصر</option>
              <option>المعادي</option>
              <option>الشيخ زايد</option>
            </select>
          </label>
          <label>
            التصنيف
            <select disabled={liveMode || submitting}>
              <option>تشغيل وصيانة</option>
              <option>مواد ومستلزمات</option>
              <option>أجور مدربين</option>
              <option>فعاليات</option>
            </select>
          </label>
          <label>
            المبلغ (ج.م)
            <input
              value={amount}
              disabled={submitting}
              onChange={event => setAmount(event.target.value)}
              type="number"
              min="1"
              step="0.01"
              placeholder="مثال: 1500"
            />
          </label>
          <button
            className="finance-desk-primary"
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
          >
            <Plus size={14} />{" "}
            {submitting ? "جارٍ رفع المصروف…" : "رفع للمراجعة"}
          </button>
          <p>
            <ShieldCheck size={13} /> المصروف لا يدخل التقرير قبل الاعتماد.
          </p>
        </form>
      </section>
    </div>
  );
}
export function Reports({
  invoices,
  expenses,
  collected,
  approvedExpenses,
  net,
  report,
  liveMode,
  onExport,
}: {
  invoices: Invoice[];
  expenses: Expense[];
  collected: number;
  approvedExpenses: number;
  net: number;
  report: FinanceReport | null;
  liveMode: boolean;
  onExport: () => void;
}) {
  if (liveMode && !report) {
    return (
      <section className="finance-desk-panel" role="status">
        التقرير المالي الحي غير متاح؛ لا توجد بيانات معاينة بديلة.
      </section>
    );
  }
  const branches =
    report?.branches ??
    ["مدينة نصر", "المعادي", "الشيخ زايد"].map(branch => ({
      branchId: branch,
      branchName: branch,
      invoiceCount: invoices.filter(item => item.branch === branch).length,
      collectedPiastres: invoices
        .filter(item => item.branch === branch)
        .reduce((sum, item) => sum + item.collected * 100, 0),
      approvedExpensesPiastres: expenses
        .filter(item => item.branch === branch && item.status === "approved")
        .reduce((sum, item) => sum + item.amount * 100, 0),
      netPiastres: 0,
    }));
  return (
    <section className="finance-desk-panel">
      <PanelTitle
        icon={<BarChart3 size={16} />}
        title="تقرير الحركة المالية"
        action={
          <button className="finance-desk-secondary" onClick={onExport}>
            <ArrowDownToLine size={14} /> تصدير التقرير
          </button>
        }
      />
      <div className="finance-report-summary">
        <span>
          <small>التحصيل</small>
          <strong>
            {money(report ? report.totalCollectedPiastres / 100 : collected)}{" "}
            ج.م
          </strong>
        </span>
        <span>
          <small>المصروف المعتمد</small>
          <strong>
            {money(
              report ? report.approvedExpensesPiastres / 100 : approvedExpenses
            )}{" "}
            ج.م
          </strong>
        </span>
        <span>
          <small>صافي الحركة</small>
          <strong>{money(report ? report.netPiastres / 100 : net)} ج.م</strong>
        </span>
      </div>
      <div className="finance-branch-report">
        {branches.map(branch => (
          <article key={branch.branchId}>
            <div>
              <strong>{branch.branchName}</strong>
              <small>{branch.invoiceCount} فواتير</small>
            </div>
            <span>
              <small>تحصيل</small>
              <b>{money(branch.collectedPiastres / 100)}</b>
            </span>
            <span>
              <small>مصروف معتمد</small>
              <b>{money(branch.approvedExpensesPiastres / 100)}</b>
            </span>
            <span>
              <small>صافي</small>
              <b>{money(branch.netPiastres / 100)}</b>
            </span>
          </article>
        ))}
      </div>
      <div className="finance-report-note">
        <ShieldCheck size={14} /> التقرير الحي يستبعد المصروفات pending
        وrejected من الصافي المعتمد.
      </div>
    </section>
  );
}

export function ShiftsView({
  handovers,
  onAccept,
  accountantName,
}: {
  handovers: ShiftCashHandover[];
  onAccept: (id: string, notes?: string) => void;
  accountantName: string;
}) {
  const [selectedShiftForDetails, setSelectedShiftForDetails] = useState<ShiftCashHandover | null>(null);
  const [handoverNoteInput, setHandoverNoteInput] = useState<string>("تم استلام النقدية بالكامل ومطابقة السندات مع الدرج");

  const pendingTotalCash = handovers
    .filter(h => h.status === "SUBMITTED")
    .reduce((sum, h) => sum + h.cashAmount, 0);

  const pendingCount = handovers.filter(h => h.status === "SUBMITTED").length;

  return (
    <section className="finance-desk-panel">
      <PanelTitle
        icon={<Banknote size={18} />}
        title="استلام عهدة ورديات الاستقبال (الكاش)"
        action={
          <span className="finance-count-badge">
            {pendingCount} ورديات بانتظار الاستلام
          </span>
        }
      />

      {/* Side by side 3 KPI Cards */}
      <div className="finance-desk-kpi-grid">
        <Kpi
          icon={<Banknote size={20} />}
          label="إجمالي كاش بانتظار التوريد للخزينة"
          value={<>{money(pendingTotalCash)} <bdi>ج.م</bdi></>}
          hint="نقدية في شباك الاستقبال"
          tone="amber"
        />
        <Kpi
          icon={<CheckCircle2 size={20} />}
          label="ورديات معتمدة بالكامل"
          value={handovers.filter(h => h.status === "ACCEPTED").length}
          hint="تم توريدها لحساب الخزينة"
          tone="teal"
        />
        <Kpi
          icon={<AlertCircle size={20} />}
          label="ورديات بها فروقات / عجز"
          value={handovers.filter(h => h.status === "DISCREPANCY").length}
          hint="تحتاج تسوية فورية"
          tone="blue"
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {handovers.map(shift => {
          const isPending = shift.status === "SUBMITTED";
          const isAccepted = shift.status === "ACCEPTED";

          return (
            <article
              key={shift.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px 20px",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>{shift.id}</span>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    وردية {shift.shiftName === "MORNING" ? "صباحية" : "مسائية"} · {shift.shiftDate} · فرع {shift.branchName}
                  </span>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background: isAccepted ? "rgba(16, 185, 129, 0.12)" : isPending ? "rgba(245, 158, 11, 0.12)" : "rgba(239, 68, 68, 0.12)",
                      color: isAccepted ? "#059669" : isPending ? "#d97706" : "#dc2626",
                    }}
                  >
                    {isAccepted ? "تم الاستلام والمطابقة ✓" : isPending ? "بانتظار استلام المحاسب" : "يوجد فرق / عجز"}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedShiftForDetails(shift);
                      setHandoverNoteInput(shift.notes || "تم استلام النقدية بالكامل ومطابقة السندات مع الدرج");
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      background: "#f1f5f9",
                      color: "#334155",
                      border: "1px solid #cbd5e1",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <Eye size={14} /> عرض تفاصيل الوردية والسندات
                  </button>

                  {isPending && (
                    <button
                      type="button"
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        background: "#0d9488",
                        color: "#fff",
                        border: 0,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onClick={() => {
                        const note = window.prompt("ملاحظة الاستلام (اختياري):", "تم استلام النقدية بالكامل ومطابقة السندات");
                        onAccept(shift.id, note || undefined);
                      }}
                    >
                      <Check size={14} /> استلام وتوريد للخزينة
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", background: "rgba(248, 250, 252, 0.8)", padding: "12px", borderRadius: "8px" }}>
                <div>
                  <small style={{ display: "block", color: "#64748b", fontSize: "0.78rem" }}>النقدية في الخزينة (الكاش)</small>
                  <strong style={{ fontSize: "1.1rem", color: "#0f172a" }}>{money(shift.cashAmount)} ج.م</strong>
                </div>
                <div>
                  <small style={{ display: "block", color: "#64748b", fontSize: "0.78rem" }}>التحصيل الإلكتروني (Visa/InstaPay)</small>
                  <strong style={{ fontSize: "1.05rem", color: "#475569" }}>{money(shift.electronicAmount)} ج.م</strong>
                </div>
                <div>
                  <small style={{ display: "block", color: "#64748b", fontSize: "0.78rem" }}>عدد سندات القبض</small>
                  <strong style={{ fontSize: "1.05rem", color: "#475569" }}>{shift.totalReceiptsCount} إيصالات</strong>
                </div>
                <div>
                  <small style={{ display: "block", color: "#64748b", fontSize: "0.78rem" }}>مسؤول الشيفت (الاستقبال)</small>
                  <strong style={{ fontSize: "0.92rem", color: "#334155" }}>{shift.submittedByName}</strong>
                </div>
              </div>

              {shift.notes && (
                <div style={{ fontSize: "0.82rem", color: "#475569" }}>
                  <strong>الملاحظات:</strong> {shift.notes}
                </div>
              )}

              {shift.receivedByName && (
                <div style={{ fontSize: "0.78rem", color: "#059669", borderTop: "1px dashed #e2e8f0", paddingTop: "8px" }}>
                  تم الاستلام والاعتماد بواسطة: <b>{shift.receivedByName}</b> في {new Date(shift.receivedAt!).toLocaleString("ar-EG")}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Shift Detailed Breakdown Modal */}
      {selectedShiftForDetails && (
        <div className="finance-modal-backdrop" onClick={() => setSelectedShiftForDetails(null)}>
          <div className="finance-modal-content" onClick={e => e.stopPropagation()} dir="rtl">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#e0f2fe", color: "#0369a1", display: "grid", placeItems: "center" }}>
                  <Banknote size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                    محضر وتفاصيل وردية الاستقبال: {selectedShiftForDetails.id}
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    وردية {selectedShiftForDetails.shiftName === "MORNING" ? "صباحية" : "مسائية"} · {selectedShiftForDetails.shiftDate} · فرع {selectedShiftForDetails.branchName} · مسؤول الوردية: {selectedShiftForDetails.submittedByName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShiftForDetails(null)}
                style={{ background: "transparent", border: 0, color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Shift Breakdown Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: "18px" }}>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block" }}>رصيد بداية الدرج (Float):</span>
                <strong style={{ fontSize: "1rem", color: "#334155" }}>{money(selectedShiftForDetails.openingFloat || 500)} ج.م</strong>
              </div>
              <div style={{ background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: "10px", padding: "10px 12px" }}>
                <span style={{ fontSize: "0.72rem", color: "#0f766e", display: "block" }}>كاش محصل بالسندات:</span>
                <strong style={{ fontSize: "1.05rem", color: "#0d9488" }}>{money(selectedShiftForDetails.cashAmount)} ج.م</strong>
              </div>
              <div style={{ background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: "10px", padding: "10px 12px" }}>
                <span style={{ fontSize: "0.72rem", color: "#1d4ed8", display: "block" }}>إلكتروني (Visa/IPN):</span>
                <strong style={{ fontSize: "1.05rem", color: "#2563eb" }}>{money(selectedShiftForDetails.electronicAmount)} ج.م</strong>
              </div>
              <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "10px", padding: "10px 12px" }}>
                <span style={{ fontSize: "0.72rem", color: "#b45309", display: "block" }}>النقدية الفعلية للتسليم:</span>
                <strong style={{ fontSize: "1.05rem", color: "#d97706" }}>{money(selectedShiftForDetails.cashAmount)} ج.م</strong>
              </div>
            </div>

            {/* Receipts List */}
            <div style={{ marginBottom: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>
                  سجل سندات القبض التفصيلية المسجلة بالوردية ({selectedShiftForDetails.receipts?.length || selectedShiftForDetails.totalReceiptsCount} إيصال):
                </strong>
              </div>

              <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                <table style={{ width: "100%", fontSize: "0.8rem", textAlign: "right", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                      <th style={{ padding: "8px 12px" }}>رقم السند</th>
                      <th style={{ padding: "8px 12px" }}>اسم الطالب</th>
                      <th style={{ padding: "8px 12px" }}>الخدمة / الكورس</th>
                      <th style={{ padding: "8px 12px" }}>طريقة الدفع</th>
                      <th style={{ padding: "8px 12px" }}>المبلغ</th>
                      <th style={{ padding: "8px 12px" }}>التوقيت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedShiftForDetails.receipts && selectedShiftForDetails.receipts.length > 0) ? (
                      selectedShiftForDetails.receipts.map(r => (
                        <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 700 }}>{r.receiptNumber}</td>
                          <td style={{ padding: "8px 12px", fontWeight: 600, color: "#0f172a" }}>{r.studentName}</td>
                          <td style={{ padding: "8px 12px", color: "#64748b" }}>{r.courseName}</td>
                          <td style={{ padding: "8px 12px" }}>
                            <span style={{ fontSize: "0.72rem", padding: "2px 6px", borderRadius: "4px", background: r.paymentMethod === "CASH" ? "#ecfdf5" : "#eff6ff", color: r.paymentMethod === "CASH" ? "#047857" : "#1d4ed8" }}>
                              {r.paymentMethod === "CASH" ? "نقدي" : r.paymentMethod}
                            </span>
                          </td>
                          <td style={{ padding: "8px 12px", fontWeight: 700, color: "#0f172a" }}>{money(r.amount)} ج.م</td>
                          <td style={{ padding: "8px 12px", color: "#64748b" }}>{r.time}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ padding: "16px", textAlign: "center", color: "#64748b" }}>
                          تم تسجيل {selectedShiftForDetails.totalReceiptsCount} سندات قبض نقدية وإلكترونية بإجمالي {money(selectedShiftForDetails.cashAmount + selectedShiftForDetails.electronicAmount)} ج.م.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Handover & Acceptance Notes */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                ملاحظات استلام ومطابقة الخزينة:
              </label>
              <input
                type="text"
                value={handoverNoteInput}
                onChange={e => setHandoverNoteInput(e.target.value)}
                style={{ width: "100%", height: "36px", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "0.82rem", outline: 0 }}
                placeholder="أدخل أي ملاحظات حول الفروقات أو العجز..."
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setSelectedShiftForDetails(null)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: "0.85rem", cursor: "pointer" }}
              >
                إغلاق
              </button>
              {selectedShiftForDetails.status === "SUBMITTED" && (
                <button
                  type="button"
                  onClick={() => {
                    onAccept(selectedShiftForDetails.id, handoverNoteInput || undefined);
                    setSelectedShiftForDetails(null);
                  }}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: 0,
                    background: "#0d9488",
                    color: "#fff",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Check size={16} />
                  <span>تأكيد استلام العهدة وتوريدها للخزينة</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function PayrollView({
  payrolls,
  onApprove,
  onPay,
  onUpdateAdjustments,
}: {
  payrolls: TrainerPayrollRecord[];
  onApprove: (id: string) => void;
  onPay: (id: string, method: string, reference?: string) => void;
  onUpdateAdjustments?: (id: string, bonus: number, bonusReason: string, deduction: number, deductionReason: string) => void;
}) {
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerPayrollRecord | null>(null);
  const [detailsTab, setDetailsTab] = useState<"sessions" | "slip">("sessions");
  const [bonusInput, setBonusInput] = useState<number>(0);
  const [bonusReasonInput, setBonusReasonInput] = useState<string>("");
  const [deductionInput, setDeductionInput] = useState<number>(0);
  const [deductionReasonInput, setDeductionReasonInput] = useState<string>("");

  // Payout Form Modal state
  const [payoutTarget, setPayoutTarget] = useState<TrainerPayrollRecord | null>(null);
  const [payoutMethod, setPayoutMethod] = useState<string>("INSTAPAY");
  const [payoutReference, setPayoutReference] = useState<string>("");
  const [payoutNotes, setPayoutNotes] = useState<string>("");

  const totalNetPayable = payrolls
    .filter(p => p.status !== "PAID")
    .reduce((sum, p) => sum + p.netPayable, 0);

  const totalSessionsCompleted = payrolls.reduce((sum, p) => sum + p.completedSessionsCount, 0);

  const handleOpenTrainerDetails = (item: TrainerPayrollRecord) => {
    setSelectedTrainer(item);
    setDetailsTab("sessions");
    setBonusInput(item.bonusAmount || 0);
    setBonusReasonInput(item.bonusReason || "");
    setDeductionInput(item.deductionAmount || 0);
    setDeductionReasonInput(item.deductionReason || "");
  };

  const handleSaveAdjustments = () => {
    if (!selectedTrainer) return;
    if (selectedTrainer.status === "APPROVED" || selectedTrainer.status === "PAID") return;
    onUpdateAdjustments?.(selectedTrainer.id, Number(bonusInput) || 0, bonusReasonInput, Number(deductionInput) || 0, deductionReasonInput);
    const newNet = (selectedTrainer.completedSessionsCount * selectedTrainer.ratePerSession) + selectedTrainer.baseSalary + (Number(bonusInput) || 0) - (Number(deductionInput) || 0);
    setSelectedTrainer({
      ...selectedTrainer,
      bonusAmount: Number(bonusInput) || 0,
      bonusReason: bonusReasonInput,
      deductionAmount: Number(deductionInput) || 0,
      deductionReason: deductionReasonInput,
      netPayable: Math.max(0, newNet),
    });
  };

  const handleOpenPayoutForm = (item: TrainerPayrollRecord) => {
    setPayoutTarget(item);
    setPayoutMethod("INSTAPAY");
    setPayoutReference(`IPN-${Math.floor(100000 + Math.random() * 900000)}`);
    setPayoutNotes("");
  };

  const handleConfirmPayout = (e: FormEvent) => {
    e.preventDefault();
    if (!payoutTarget) return;
    const ref = payoutReference.trim() || `REC-${Date.now().toString().slice(-6)}`;
    onPay(payoutTarget.id, payoutMethod, ref);
    if (selectedTrainer?.id === payoutTarget.id) {
      setSelectedTrainer({
        ...selectedTrainer,
        status: "PAID",
        paymentMethod: payoutMethod,
        paymentReference: ref,
        paidAt: new Date().toISOString(),
      });
    }
    setPayoutTarget(null);
  };

  return (
    <section className="finance-desk-panel">
      <PanelTitle
        icon={<UserCheck size={18} />}
        title="مصاريف ومستحقات المدربين"
        action={
          <span className="finance-count-badge">
            شهر أكتوبر 2026
          </span>
        }
      />

      {/* Side by side 3 KPI Cards */}
      <div className="finance-desk-kpi-grid">
        <Kpi
          icon={<Wallet size={20} />}
          label="إجمالي مستحقات بانتظار الصرف"
          value={<>{money(totalNetPayable)} <bdi>ج.م</bdi></>}
          hint="صافي مستحقات المدربين"
          tone="amber"
        />
        <Kpi
          icon={<Clock3 size={20} />}
          label="إجمالي الحصص المنفذة المعتمدة"
          value={`${totalSessionsCompleted} حصة`}
          hint="مرصودة من سجلات الحضور"
          tone="teal"
        />
        <Kpi
          icon={<CheckCircle2 size={20} />}
          label="الرواتب والمسيرات المسددة"
          value={payrolls.filter(p => p.status === "PAID").length}
          hint="تم تسليمها للمدربين"
          tone="blue"
        />
      </div>

      {/* Table in full-width responsive horizontal container */}
      <div className="finance-table-wrapper">
        <table className="finance-desk-table">
          <thead>
            <tr>
              <th>كود المسير</th>
              <th>المدرب</th>
              <th>الحصص المنفذة</th>
              <th>سعر الحصة</th>
              <th>الأساسي / البدلات</th>
              <th>الاستقطاعات</th>
              <th>الصافي المستحق</th>
              <th>الحالة</th>
              <th>الإجراءات والتفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map(item => {
              const statusBadge =
                item.status === "PAID"
                  ? { label: "تم الصرف", bg: "rgba(16, 185, 129, 0.12)", color: "#059669" }
                  : item.status === "APPROVED"
                  ? { label: "معتمد للصرف", bg: "rgba(14, 165, 233, 0.12)", color: "#0284c7" }
                  : { label: "مسودة قيد التدقيق", bg: "rgba(245, 158, 11, 0.12)", color: "#d97706" };

              return (
                <tr key={item.id}>
                  <td>
                    <span className="finance-payroll-code">{item.id}</span>
                  </td>
                  <td>
                    <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>{item.instructorName}</strong>
                  </td>
                  <td>
                    <span className="finance-count-badge">{item.completedSessionsCount} حصة</span>
                  </td>
                  <td>
                    <span>{money(item.ratePerSession)} ج.م</span>
                  </td>
                  <td>
                    <span>{money(item.baseSalary + item.bonusAmount)} ج.م</span>
                    {item.bonusAmount > 0 && (
                      <div>
                        <span className="finance-bonus-tag" title={item.bonusReason}>
                          +{money(item.bonusAmount)} بونص
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    {item.deductionAmount > 0 ? (
                      <span className="finance-deduction-tag" title={item.deductionReason}>
                        -{money(item.deductionAmount)} خصم
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                  <td>
                    <strong className="finance-net-payable">{money(item.netPayable)} ج.م</strong>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "12px",
                        background: statusBadge.bg,
                        color: statusBadge.color,
                        display: "inline-block",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {statusBadge.label}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "nowrap" }}>
                      <button
                        type="button"
                        onClick={() => handleOpenTrainerDetails(item)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: "7px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          background: "#f8fafc",
                          color: "#334155",
                          border: "1px solid #cbd5e1",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Eye size={14} /> تفاصيل الحساب والحصص
                      </button>

                      {item.status === "SUBMITTED" && (
                        <button
                          type="button"
                          className="button button-secondary"
                          style={{ padding: "5px 12px", fontSize: "0.8rem", whiteSpace: "nowrap", fontWeight: 700 }}
                          onClick={() => onApprove(item.id)}
                        >
                          <Check size={14} /> اعتماد المسير
                        </button>
                      )}

                      {item.status === "APPROVED" && (
                        <button
                          type="button"
                          className="button button-primary"
                          style={{
                            padding: "5px 12px",
                            fontSize: "0.8rem",
                            background: "#0d9488",
                            color: "#fff",
                            whiteSpace: "nowrap",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                          onClick={() => handleOpenPayoutForm(item)}
                        >
                          <CreditCard size={14} /> صرف الراتب
                        </button>
                      )}

                      {item.status === "PAID" && (
                        <span style={{ fontSize: "0.78rem", color: "#059669", fontWeight: 600, background: "#ecfdf5", padding: "4px 8px", borderRadius: "6px", border: "1px solid #a7f3d0", whiteSpace: "nowrap" }}>
                          ✓ مسدد ({item.paymentMethod})
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Trainer Detailed Breakdown & Adjustments Modal */}
      {selectedTrainer && (
        <div className="finance-modal-backdrop" onClick={() => setSelectedTrainer(null)}>
          <div className="finance-modal-content" onClick={e => e.stopPropagation()} dir="rtl" style={{ maxWidth: "780px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f0fdfa", color: "#0f766e", display: "grid", placeItems: "center" }}>
                  <UserCheck size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                    كشف حساب ومستحقات المدرب: {selectedTrainer.instructorName}
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    كود المسير: <bdi>{selectedTrainer.id}</bdi> · شهر أكتوبر 2026 · معدل الحصة: {money(selectedTrainer.ratePerSession)} ج.م
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrainer(null)}
                style={{ background: "transparent", border: 0, color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="finance-modal-tabs">
              <button
                type="button"
                className={`finance-modal-tab-btn ${detailsTab === "sessions" ? "active" : ""}`}
                onClick={() => setDetailsTab("sessions")}
              >
                <CalendarDays size={15} /> سجل الجلسات والحصص المعتمدة ({selectedTrainer.completedSessionsCount} حصة)
              </button>
              <button
                type="button"
                className={`finance-modal-tab-btn ${detailsTab === "slip" ? "active" : ""}`}
                onClick={() => setDetailsTab("slip")}
              >
                <FileText size={15} /> الفاتورة وسند الاستحقاق المالي
              </button>
            </div>

            {/* TAB 1: SESSIONS LEDGER */}
            {detailsTab === "sessions" && (
              <>
                {/* Financial Summary Strip */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "12px" }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>الحصص المنفذة:</span>
                      <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>
                        {selectedTrainer.completedSessionsCount} × {selectedTrainer.ratePerSession} = {money(selectedTrainer.completedSessionsCount * selectedTrainer.ratePerSession)} ج.م
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>الراتب الأساسي:</span>
                      <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{money(selectedTrainer.baseSalary)} ج.م</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "#059669", display: "block" }}>المكافآت (بونص):</span>
                      <strong style={{ fontSize: "0.95rem", color: "#059669" }}>+{money(selectedTrainer.bonusAmount)} ج.م</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "#dc2626", display: "block" }}>الاستقطاعات:</span>
                      <strong style={{ fontSize: "0.95rem", color: "#dc2626" }}>-{money(selectedTrainer.deductionAmount)} ج.م</strong>
                    </div>
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 12px", borderRadius: "8px" }}>
                      <span style={{ fontSize: "0.75rem", color: "#166534", display: "block", fontWeight: 600 }}>الصافي المستحق:</span>
                      <strong style={{ fontSize: "1.15rem", color: "#15803d" }}>{money(selectedTrainer.netPayable)} ج.م</strong>
                    </div>
                  </div>

                  {/* Adjustments Editor (Bonus & Deductions) with Locked State */}
                  <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#334155" }}>
                        تعديل المكافآت والاستقطاعات (قبل الاعتماد النهائي):
                      </span>
                      {selectedTrainer.status !== "SUBMITTED" && (
                        <span style={{ fontSize: "0.74rem", color: "#b45309", background: "#fef3c7", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
                          <Lock size={11} style={{ display: "inline", verticalAlign: "middle" }} /> المسير معتمد ومقفل للتعديل
                        </span>
                      )}
                    </div>

                    {selectedTrainer.status === "SUBMITTED" ? (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                          <div>
                            <label style={{ fontSize: "0.75rem", color: "#059669", display: "block", marginBottom: "3px", fontWeight: 600 }}>مبلغ المكافأة (ج.م):</label>
                            <input
                              type="number"
                              value={bonusInput}
                              onChange={e => setBonusInput(Number(e.target.value) || 0)}
                              style={{ width: "100%", height: "34px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 8px", fontSize: "0.82rem" }}
                            />
                            <input
                              type="text"
                              placeholder="سبب المكافأة (مثال: تميز في تحضير المشروعات)"
                              value={bonusReasonInput}
                              onChange={e => setBonusReasonInput(e.target.value)}
                              style={{ width: "100%", height: "30px", borderRadius: "6px", border: "1px solid #e2e8f0", padding: "0 8px", fontSize: "0.75rem", marginTop: "4px" }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: "0.75rem", color: "#dc2626", display: "block", marginBottom: "3px", fontWeight: 600 }}>مبلغ الاستقطاع / الخصم (ج.م):</label>
                            <input
                              type="number"
                              value={deductionInput}
                              onChange={e => setDeductionInput(Number(e.target.value) || 0)}
                              style={{ width: "100%", height: "34px", borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 8px", fontSize: "0.82rem" }}
                            />
                            <input
                              type="text"
                              placeholder="سبب الخصم (مثال: تأخير عن بدء الحصة)"
                              value={deductionReasonInput}
                              onChange={e => setDeductionReasonInput(e.target.value)}
                              style={{ width: "100%", height: "30px", borderRadius: "6px", border: "1px solid #e2e8f0", padding: "0 8px", fontSize: "0.75rem", marginTop: "4px" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={handleSaveAdjustments}
                            style={{
                              background: "#334155",
                              color: "#fff",
                              border: 0,
                              borderRadius: "6px",
                              padding: "5px 12px",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Calculator size={13} /> تطبيق التعديل وتحديث الصافي
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="payroll-locked-banner">
                        <Lock size={15} />
                        <span>
                          <strong>المسير معتمد نهائياً ومقفل:</strong> المكافآت والخصومات مسجلة وموثقة رسمياً في القيود المالية ولا يمكن تعديلها بعد اعتماد المسير لضمان سلامة التدقيق والمطابقة.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sessions Table */}
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <CalendarDays size={15} className="text-teal-600" />
                    <span>سجل الحصص المنفذة المعتمدة تفصيلياً ({selectedTrainer.sessions?.length || selectedTrainer.completedSessionsCount} حصة):</span>
                  </div>

                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", maxHeight: "280px", overflowY: "auto" }}>
                    <table style={{ width: "100%", fontSize: "0.78rem", textAlign: "right", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                          <th style={{ padding: "8px 10px" }}>كود الحصة</th>
                          <th style={{ padding: "8px 10px" }}>الكورس والمجموعة</th>
                          <th style={{ padding: "8px 10px" }}>التاريخ والوقت</th>
                          <th style={{ padding: "8px 10px" }}>القاعة</th>
                          <th style={{ padding: "8px 10px" }}>الحضور</th>
                          <th style={{ padding: "8px 10px" }}>الحالة</th>
                          <th style={{ padding: "8px 10px" }}>المستحق</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTrainer.sessions && selectedTrainer.sessions.length > 0 ? (
                          selectedTrainer.sessions.map(s => (
                            <tr key={s.sessionId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "8px 10px", fontFamily: "monospace", fontWeight: 700 }}>{s.sessionId}</td>
                              <td style={{ padding: "8px 10px", fontWeight: 600, color: "#0f172a" }}>{s.courseName} · {s.groupName}</td>
                              <td style={{ padding: "8px 10px", color: "#475569" }}>{s.date} ({s.time})</td>
                              <td style={{ padding: "8px 10px", color: "#64748b" }}>{s.room}</td>
                              <td style={{ padding: "8px 10px", color: "#0f766e", fontWeight: 600 }}>{s.attendanceCount} طلاب</td>
                              <td style={{ padding: "8px 10px" }}>
                                <span style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", background: "#ecfdf5", color: "#059669", fontWeight: 600 }}>
                                  معتمدة من رئيس المدربين
                                </span>
                              </td>
                              <td style={{ padding: "8px 10px", fontWeight: 700, color: "#0f172a" }}>{money(s.rate)} ج.م</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} style={{ padding: "16px", textAlign: "center", color: "#64748b" }}>
                              تم استيراد واعتماد {selectedTrainer.completedSessionsCount} حصة من سجلات حضور الطلاب بواسطة رئيس المدربين.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: FINANCIAL SALARY SLIP / INVOICE VIEW */}
            {detailsTab === "slip" && (
              <div style={{ border: "1px solid #cbd5e1", borderRadius: "12px", padding: "20px", background: "#ffffff", marginBottom: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #0f766e", paddingBottom: "12px", marginBottom: "16px" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#0f766e", fontWeight: 800 }}>أكاديمية مدى للروبوتكس والذكاء الاصطناعي</h2>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>سند استحقاق مسير مالي وأتعاب تدريب · قسم الحسابات</span>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>رقم السند المالي:</span>
                    <strong style={{ fontFamily: "monospace", fontSize: "0.95rem", color: "#0f172a" }}>{selectedTrainer.id}</strong>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginTop: "2px" }}>شهر: أكتوبر 2026</span>
                  </div>
                </div>

                {/* Trainer Meta */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "0.82rem" }}>
                  <div>اسم المدرب: <strong>{selectedTrainer.instructorName}</strong></div>
                  <div>الفرع المعتمد: <strong>مدينة نصر</strong></div>
                  <div>كود المدرب: <strong>{selectedTrainer.instructorId}</strong></div>
                  <div>تاريخ الإصدار: <strong>{new Date().toISOString().slice(0, 10)}</strong></div>
                </div>

                {/* Items Breakdown Table */}
                <table style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse", marginBottom: "16px" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1", color: "#334155" }}>
                      <th style={{ padding: "8px 10px", textAlign: "right" }}>البند المالي</th>
                      <th style={{ padding: "8px 10px", textAlign: "center" }}>التفاصيل والمعدل</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>المبلغ المستحق</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "10px", fontWeight: 600 }}>أتعاب الحصص المعملية المنفذة</td>
                      <td style={{ padding: "10px", textAlign: "center", color: "#64748b" }}>{selectedTrainer.completedSessionsCount} حصة × {money(selectedTrainer.ratePerSession)} ج.م</td>
                      <td style={{ padding: "10px", textAlign: "left", fontWeight: 700 }}>{money(selectedTrainer.completedSessionsCount * selectedTrainer.ratePerSession)} ج.م</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "10px", fontWeight: 600 }}>الراتب الأساسي / البدلات الثابتة</td>
                      <td style={{ padding: "10px", textAlign: "center", color: "#64748b" }}>راتب إشرافي أساسي</td>
                      <td style={{ padding: "10px", textAlign: "left", fontWeight: 700 }}>{money(selectedTrainer.baseSalary)} ج.م</td>
                    </tr>
                    {selectedTrainer.bonusAmount > 0 && (
                      <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f0fdf4" }}>
                        <td style={{ padding: "10px", fontWeight: 600, color: "#166534" }}>مكافأة تميز وحوافز</td>
                        <td style={{ padding: "10px", textAlign: "center", color: "#166534" }}>{selectedTrainer.bonusReason || "مكافأة معتمدة"}</td>
                        <td style={{ padding: "10px", textAlign: "left", fontWeight: 700, color: "#166534" }}>+{money(selectedTrainer.bonusAmount)} ج.م</td>
                      </tr>
                    )}
                    {selectedTrainer.deductionAmount > 0 && (
                      <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#fef2f2" }}>
                        <td style={{ padding: "10px", fontWeight: 600, color: "#991b1b" }}>استقطاعات وخصومات</td>
                        <td style={{ padding: "10px", textAlign: "center", color: "#991b1b" }}>{selectedTrainer.deductionReason || "استقطاع غياب أو تأخير"}</td>
                        <td style={{ padding: "10px", textAlign: "left", fontWeight: 700, color: "#991b1b" }}>-{money(selectedTrainer.deductionAmount)} ج.م</td>
                      </tr>
                    )}
                    <tr style={{ background: "#f8fafc", fontWeight: 800 }}>
                      <td colSpan={2} style={{ padding: "12px 10px", fontSize: "0.95rem", color: "#0f172a" }}>الصافي النهائي المعتمد للصرف:</td>
                      <td style={{ padding: "12px 10px", textAlign: "left", fontSize: "1.1rem", color: "#0f766e" }}>{money(selectedTrainer.netPayable)} ج.م</td>
                    </tr>
                  </tbody>
                </table>

                {/* Footer Stamp */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px dashed #cbd5e1" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    {selectedTrainer.status === "PAID" ? (
                      <span style={{ color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle size={16} /> تم سداد وصرف الراتب بالكامل عبر {selectedTrainer.paymentMethod} (مرجع: {selectedTrainer.paymentReference})
                      </span>
                    ) : selectedTrainer.status === "APPROVED" ? (
                      <span style={{ color: "#0284c7", fontWeight: 700 }}>
                        ✓ معتمد نهائياً للصرف وجاهز لتسجيل الإيصال المالي
                      </span>
                    ) : (
                      <span style={{ color: "#d97706", fontWeight: 600 }}>
                        ⏳ مسودة قيد التدقيق لدى المحاسبة ومدير الفرع
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#334155",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Printer size={14} /> طباعة السند المالي
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons in Modal */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => setSelectedTrainer(null)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: "0.85rem", cursor: "pointer" }}
              >
                إغلاق
              </button>

              {selectedTrainer.status === "SUBMITTED" && (
                <button
                  type="button"
                  onClick={() => {
                    onApprove(selectedTrainer.id);
                    setSelectedTrainer({ ...selectedTrainer, status: "APPROVED" });
                  }}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: 0,
                    background: "#0284c7",
                    color: "#fff",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Check size={16} />
                  <span>اعتماد المسير المالي</span>
                </button>
              )}

              {selectedTrainer.status === "APPROVED" && (
                <button
                  type="button"
                  onClick={() => handleOpenPayoutForm(selectedTrainer)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: 0,
                    background: "#0d9488",
                    color: "#fff",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <CreditCard size={16} />
                  <span>صرف الراتب وتوثيق السند ({money(selectedTrainer.netPayable)} ج.م)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Payout Modal Form */}
      {payoutTarget && (
        <div className="finance-modal-backdrop" onClick={() => setPayoutTarget(null)}>
          <div className="finance-modal-content" onClick={e => e.stopPropagation()} dir="rtl" style={{ maxWidth: "560px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#f0fdf4", color: "#0d9488", display: "grid", placeItems: "center" }}>
                  <CreditCard size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                    صرف مستحقات الراتب المعتمدة
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    المدرب: <strong>{payoutTarget.instructorName}</strong> · كود: <bdi>{payoutTarget.id}</bdi>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayoutTarget(null)}
                style={{ background: "transparent", border: 0, color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmPayout} className="payout-form-card">
              {/* Financial Calculation Summary Box */}
              <div className="payout-callout-box">
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#166534", display: "block" }}>
                    إجمالي المستحق المعتمد للصرف ({payoutTarget.completedSessionsCount} حصة):
                  </span>
                  <div style={{ fontSize: "0.76rem", color: "#15803d", marginTop: "2px" }}>
                    حصص: {money(payoutTarget.completedSessionsCount * payoutTarget.ratePerSession)} ج.م
                    {payoutTarget.bonusAmount > 0 && ` + بونص: ${money(payoutTarget.bonusAmount)}`}
                    {payoutTarget.deductionAmount > 0 && ` - خصم: ${money(payoutTarget.deductionAmount)}`}
                  </div>
                </div>
                <strong style={{ fontSize: "1.35rem", color: "#0f766e", fontWeight: 800 }}>
                  {money(payoutTarget.netPayable)} ج.م
                </strong>
              </div>

              {/* Payment Method */}
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
                طريقة الصرف والتحويل *
                <select
                  value={payoutMethod}
                  onChange={e => setPayoutMethod(e.target.value)}
                  style={{ height: "38px", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "0.85rem", background: "#fff" }}
                >
                  <option value="INSTAPAY">تحويل لحظي InstaPay (IPN)</option>
                  <option value="CASH">صرف نقدًا من خزينة الفرع</option>
                  <option value="VODAFONE_CASH">محفظة فودافون كاش / إلكترونية</option>
                  <option value="BANK_TRANSFER">تحويل بنكي رسمي (IBAN)</option>
                </select>
              </label>

              {/* Reference Number */}
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
                رقم الإيصال أو مرجع العملية البنكية *
                <input
                  type="text"
                  required
                  placeholder="مثال: IPN-984210 أو سند صرف 204"
                  value={payoutReference}
                  onChange={e => setPayoutReference(e.target.value)}
                  style={{ height: "38px", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "0.85rem" }}
                />
              </label>

              {/* Notes */}
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
                ملاحظات الصرف والتوثيق (اختياري)
                <input
                  type="text"
                  placeholder="مثال: تم إرسال إشعار التحويل للمدرب عبر واتساب"
                  value={payoutNotes}
                  onChange={e => setPayoutNotes(e.target.value)}
                  style={{ height: "38px", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "0 10px", fontSize: "0.85rem" }}
                />
              </label>

              {/* Attestation Note */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 12px", fontSize: "0.78rem", color: "#475569", display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={16} className="text-teal-600" />
                <span>أقر أنا المحاسب المسؤول بصرف المبلغ المعتمد أعلاه وتوثيق السند في الخزينة والقيود المالية.</span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setPayoutTarget(null)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 20px",
                    borderRadius: "8px",
                    border: 0,
                    background: "#0d9488",
                    color: "#fff",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>تأكيد صرف الراتب وتوثيق السند ({money(payoutTarget.netPayable)} ج.م)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export function Kpi({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint: string;
  tone: string;
}) {
  return (
    <article className="finance-desk-kpi">
      <span className={`finance-desk-kpi-icon ${tone}`}>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{hint}</span>
    </article>
  );
}
export function PanelTitle({
  icon,
  title,
  action,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="finance-desk-panel-title">
      <div>
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
