import type { FormEvent, ReactNode } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  Banknote,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  CreditCard,
  FileCheck2,
  FileText,
  Plus,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Wallet,
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
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function invoiceStatus(invoice: Invoice): InvoiceStatus {
  if (invoice.status) return invoice.status;
  if (invoice.collected >= invoice.total) return "paid";
  if (invoice.collected === 0 && invoice.due.includes("سبتمبر"))
    return "overdue";
  return invoice.collected > 0 ? "partial" : "unpaid";
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
  shifts: "تقفيل ورديات الاستقبال (الكاش)",
  payroll: "مستحقات ورواتب المدربين بالحصة",
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
  onCollections,
  onExpenses,
  onReports,
  scopeHint,
}: {
  collected: number;
  outstanding: number;
  expenses: number;
  net: number;
  pending: number;
  onCollections: () => void;
  onExpenses: () => void;
  onReports: () => void;
  scopeHint: string;
}) {
  return (
    <>
      <section className="finance-desk-kpis">
        <Kpi
          icon={<TrendingUp size={16} />}
          label="إجمالي التحصيل"
          value={`${money(collected)} ج.م`}
          hint={scopeHint}
          tone="teal"
        />
        <Kpi
          icon={<Clock3 size={16} />}
          label="المستحقات"
          value={`${money(outstanding)} ج.م`}
          hint="فواتير لم تكتمل"
          tone="amber"
        />
        <Kpi
          icon={<TrendingDown size={16} />}
          label="مصروفات معتمدة"
          value={`${money(expenses)} ج.م`}
          hint="لا تشمل pending/rejected"
          tone="blue"
        />
        <Kpi
          icon={<Wallet size={16} />}
          label="صافي الحركة"
          value={`${money(net)} ج.م`}
          hint={`${pending} مصروفات تنتظر القرار`}
          tone="violet"
        />
      </section>
      <div className="finance-desk-grid">
        <section className="finance-desk-panel">
          <PanelTitle icon={<FileCheck2 size={16} />} title="الخطوة التالية" />
          <div className="finance-next-list">
            <button onClick={onCollections}>
              <span className="finance-next-icon amber">
                <CreditCard size={15} />
              </span>
              <span>
                <strong>راجع الفواتير غير المكتملة</strong>
                <small>سجل التحصيل أو ارفع طلب التصحيح</small>
              </span>
              <ChevronLeft size={14} />
            </button>
            <button onClick={onExpenses}>
              <span className="finance-next-icon violet">
                <TrendingDown size={15} />
              </span>
              <span>
                <strong>راجع المصروفات المعلقة</strong>
                <small>اعتماد أو رفض بسبب موثق</small>
              </span>
              <ChevronLeft size={14} />
            </button>
            <button onClick={onReports}>
              <span className="finance-next-icon teal">
                <BarChart3 size={15} />
              </span>
              <span>
                <strong>افتح تقرير الفروع</strong>
                <small>تحصيل · مستحق · مصروف · صافي</small>
              </span>
              <ChevronLeft size={14} />
            </button>
          </div>
        </section>
        <section className="finance-desk-panel">
          <PanelTitle icon={<ShieldCheck size={16} />} title="ضوابط الإقفال" />
          <div className="finance-control-list">
            <span>
              <CheckCircle2 size={15} /> المحصل يدخل في سجل التحصيل فقط
            </span>
            <span>
              <CheckCircle2 size={15} /> المصروف pending لا يدخل صافي الحركة
            </span>
            <span>
              <CheckCircle2 size={15} /> التعديل بعد التحصيل يمر بطلب تصحيح
            </span>
            <span>
              <CheckCircle2 size={15} /> الرفض يحتاج سببًا إلزاميًا
            </span>
          </div>
        </section>
      </div>
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
  return (
    <div className="finance-desk-two-col">
      <section className="finance-desk-panel">
        <PanelTitle
          icon={<CreditCard size={16} />}
          title="الفواتير والأرصدة"
          action={
            <>
              <button
                className="finance-desk-secondary"
                type="button"
                onClick={onCreateInvoice}
              >
                <Plus size={14} /> إنشاء فاتورة
              </button>
              <label className="finance-desk-search">
                <Search size={13} />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="فاتورة أو طالب..."
                />
              </label>
            </>
          }
        />
        <div className="finance-invoice-list">
          {invoices.length === 0 ? (
            <p className="finance-desk-empty">
              لا توجد فواتير مطابقة للبحث أو الفرع المحدد.
            </p>
          ) : (
            invoices.map(invoice => {
              const status = invoiceStatus(invoice);
              return (
                <article className="finance-invoice-row" key={invoice.id}>
                  <div className="finance-invoice-person">
                    <span>{invoice.student.slice(0, 1)}</span>
                    <div>
                      <strong>{invoice.student}</strong>
                      <small>
                        {invoice.number} · {invoice.parent}
                      </small>
                    </div>
                  </div>
                  <div className="finance-invoice-meta">
                    <span>
                      {invoice.course} · {invoice.branch}
                    </span>
                    <small>استحقاق {invoice.due}</small>
                  </div>
                  <div className="finance-invoice-money">
                    <strong>{money(invoice.total)} ج.م</strong>
                    <small>
                      محصل {money(invoice.collected)} · متبقي{" "}
                      {money(invoice.total - invoice.collected)}
                    </small>
                  </div>
                  <span className={`finance-desk-status ${status}`}>
                    {STATUS_LABEL[status]}
                  </span>
                  {invoice.payments.map(payment => {
                    const isUploadingEvidence = evidenceUploadingIds.has(
                      `payment:${payment.id}`
                    );
                    return (
                      <span key={payment.id}>
                        <small className="finance-reason">العملية مسجلة</small>
                        {payment.evidenceStatus === "ATTACHED" ? (
                          <button
                            type="button"
                            className="finance-evidence-action"
                            onClick={() =>
                              onDownloadEvidence(
                                payment.id,
                                payment.evidenceFileName ??
                                  `payment-${payment.id}-evidence`
                              )
                            }
                          >
                            إثبات مرفق · تنزيل
                          </button>
                        ) : (
                          <label
                            className="finance-evidence-action"
                            aria-disabled={isUploadingEvidence}
                          >
                            {isUploadingEvidence
                              ? "جارٍ رفع إثبات الدفع…"
                              : "رفع إثبات الدفع"}
                            <input
                              type="file"
                              accept="application/pdf,image/jpeg,image/png"
                              hidden
                              disabled={isUploadingEvidence}
                              aria-busy={isUploadingEvidence}
                              onChange={event => {
                                const file = event.target.files?.[0];
                                if (file) onUploadEvidence(payment.id, file);
                                event.currentTarget.value = "";
                              }}
                            />
                          </label>
                        )}
                      </span>
                    );
                  })}
                </article>
              );
            })
          )}
        </div>
      </section>
      <section className="finance-desk-panel finance-payment-card">
        <PanelTitle
          icon={<Wallet size={16} />}
          title="تسجيل تحصيل"
          action={
            <span className="finance-desk-context">
              <ShieldCheck size={13} /> {roleCode}
            </span>
          }
        />
        <form onSubmit={onSubmit} className="finance-desk-form">
          <label>
            الفاتورة
            <select
              value={paymentInvoice}
              disabled={submitting}
              onChange={event => setPaymentInvoice(event.target.value)}
            >
              {invoices
                .filter(item => item.collected < item.total)
                .map(item => (
                  <option key={item.id} value={item.id}>
                    {item.number} · {item.student}
                  </option>
                ))}
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
              placeholder="مثال: 1200"
            />
          </label>
          <label>
            طريقة الدفع
            <select
              value={paymentMethod}
              disabled={submitting}
              onChange={event =>
                setPaymentMethod(event.target.value as PaymentMethod)
              }
            >
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
                method => (
                  <option key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </option>
                )
              )}
            </select>
          </label>
          <label>
            تاريخ الاستلام
            <input
              type="date"
              value={receivedOn}
              disabled={submitting}
              onChange={event => setReceivedOn(event.target.value)}
            />
          </label>
          {(paymentMethod === "INSTAPAY" ||
            paymentMethod === "VODAFONE_CASH") && (
            <label>
              المرجع الخارجي
              <input
                value={externalReference}
                disabled={submitting}
                onChange={event => setExternalReference(event.target.value)}
                placeholder="رقم العملية أو المرجع"
                required
              />
            </label>
          )}
          <button
            className="finance-desk-primary"
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
          >
            <Check size={14} />{" "}
            {submitting ? "جارٍ تسجيل التحصيل…" : "تسجيل التحصيل"}
          </button>
          <p>
            <AlertCircle size={13} /> سيتم حفظ الطريقة والتاريخ في سجل العملية.
          </p>
        </form>
      </section>
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
                <article className="finance-expense-row" key={expense.id}>
                  <span className={`finance-expense-icon ${expense.status}`}>
                    <FileText size={15} />
                  </span>
                  <div>
                    <strong>{expense.description}</strong>
                    <small>
                      {expense.id} · {expense.category} · {expense.branch} ·{" "}
                      {expense.date}
                    </small>
                  </div>
                  <strong>{money(expense.amount)} ج.م</strong>
                  <span className={`finance-desk-status ${expense.status}`}>
                    {EXPENSE_LABEL[expense.status]}
                  </span>
                  {expense.status === "pending" && (
                    <>
                      <button
                        className="finance-reject-link"
                        onClick={() => onApprove(expense.id)}
                        disabled={decisionSubmitting !== null}
                        aria-busy={
                          isDecisionPending &&
                          decisionSubmitting?.action === "approve"
                        }
                      >
                        {isDecisionPending &&
                        decisionSubmitting?.action === "approve"
                          ? "جارٍ الاعتماد…"
                          : "اعتماد"}
                      </button>
                      <button
                        className="finance-reject-link"
                        onClick={() => onReject(expense.id)}
                        disabled={decisionSubmitting !== null}
                        aria-busy={
                          isDecisionPending &&
                          decisionSubmitting?.action === "reject"
                        }
                      >
                        {isDecisionPending &&
                        decisionSubmitting?.action === "reject"
                          ? "جارٍ الرفض…"
                          : "رفض بسبب"}
                      </button>
                    </>
                  )}
                  {expense.reason && (
                    <small className="finance-reason">{expense.reason}</small>
                  )}
                  {expense.evidenceStatus === "ATTACHED" ? (
                    <button
                      type="button"
                      className="finance-evidence-action"
                      onClick={() =>
                        onDownloadEvidence(
                          expense.id,
                          expense.evidenceFileName ??
                            `expense-${expense.id}-evidence`
                        )
                      }
                    >
                      إثبات مرفق · تنزيل
                    </button>
                  ) : (
                    <label
                      className="finance-evidence-action"
                      aria-disabled={isUploadingEvidence}
                    >
                      {isUploadingEvidence
                        ? "جارٍ رفع الإثبات…"
                        : "رفع الإثبات"}
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
  const pendingTotalCash = handovers
    .filter(h => h.status === "SUBMITTED")
    .reduce((sum, h) => sum + h.cashAmount, 0);

  const pendingCount = handovers.filter(h => h.status === "SUBMITTED").length;

  return (
    <section className="finance-desk-panel">
      <PanelTitle
        icon={<Banknote size={17} />}
        title="استلام عهدة ورديات الاستقبال (الكاش)"
        action={
          <span className="finance-count-badge">
            {pendingCount} ورديات بانتظار الاستلام
          </span>
        }
      />

      <div className="finance-desk-kpi-grid" style={{ marginTop: "1rem", marginBottom: "1.2rem" }}>
        <Kpi
          icon={<Banknote size={19} />}
          label="إجمالي كاش بانتظار التوريد للخزينة"
          value={<>{money(pendingTotalCash)} <bdi>ج.م</bdi></>}
          hint="نقدية في شباك الاستقبال"
          tone="amber"
        />
        <Kpi
          icon={<CheckCircle2 size={19} />}
          label="ورديات معتمدة بالكامل"
          value={handovers.filter(h => h.status === "ACCEPTED").length}
          hint="تم توريدها لحساب الخزينة"
          tone="teal"
        />
        <Kpi
          icon={<AlertCircle size={19} />}
          label="ورديات بها فروقات / عجز"
          value={handovers.filter(h => h.status === "DISCREPANCY").length}
          hint="تحتاج تسوية فورية"
          tone="blue"
        />
      </div>

      <div className="finance-report-note" style={{ marginBottom: "1rem" }}>
        <ShieldCheck size={14} /> <strong>ضابط الرقابة والـ Audit:</strong> يمنع خروج موظف الاستقبال من الفرع قبل اعتماد المحاسب استلام الكاش الفعلي ومطابقته مع إجمالي سندات القبض المسجلة بالسيستم.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {handovers.map(shift => {
          const isPending = shift.status === "SUBMITTED";
          const isAccepted = shift.status === "ACCEPTED";

          return (
            <article
              key={shift.id}
              style={{
                border: "1px solid var(--border, #e2e8f0)",
                borderRadius: "10px",
                padding: "16px 20px",
                background: "var(--card, #ffffff)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontWeight: 700, fontSize: "1rem" }}>{shift.id}</span>
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
                    {isAccepted ? "تم الاستلام والمطابقة" : isPending ? "بانتظار استلام المحاسب" : "يوجد فرق / عجز"}
                  </span>
                </div>
                {isPending && (
                  <button
                    type="button"
                    className="button button-primary"
                    style={{ padding: "6px 14px", fontSize: "0.84rem" }}
                    onClick={() => {
                      const note = window.prompt("ملاحظة الاستلام (اختياري):", "تم استلام النقدية بالكامل ومطابقة السندات");
                      onAccept(shift.id, note || undefined);
                    }}
                  >
                    <Check size={14} /> استلام وتوريد للخزينة
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", background: "rgba(248, 250, 252, 0.8)", padding: "12px", borderRadius: "8px" }}>
                <div>
                  <small style={{ display: "block", color: "#64748b", fontSize: "0.78rem" }}>النقدية في الخزينة (الكاش)</small>
                  <strong style={{ fontSize: "1.05rem", color: "#0f172a" }}>{money(shift.cashAmount)} ج.م</strong>
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
                <div style={{ fontSize: "0.78rem", color: "#059669", borderTop: "1px dashed #e2e8f0", paddingTop: "6px" }}>
                  تم الاستلام والاعتماد بواسطة: <b>{shift.receivedByName}</b> في {new Date(shift.receivedAt!).toLocaleString("ar-EG")}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function PayrollView({
  payrolls,
  onApprove,
  onPay,
}: {
  payrolls: TrainerPayrollRecord[];
  onApprove: (id: string) => void;
  onPay: (id: string, method: string, reference?: string) => void;
}) {
  const totalNetPayable = payrolls
    .filter(p => p.status !== "PAID")
    .reduce((sum, p) => sum + p.netPayable, 0);

  const totalSessionsCompleted = payrolls.reduce((sum, p) => sum + p.completedSessionsCount, 0);

  return (
    <section className="finance-desk-panel">
      <PanelTitle
        icon={<UserCheck size={17} />}
        title="مسيرات أتعاب ورواتب المدربين بالحصة"
        action={
          <span className="finance-count-badge">
            شهر أكتوبر 2026
          </span>
        }
      />

      <div className="finance-desk-kpi-grid" style={{ marginTop: "1rem", marginBottom: "1.2rem" }}>
        <Kpi
          icon={<Wallet size={19} />}
          label="إجمالي مستحقات بانتظار الصرف"
          value={<>{money(totalNetPayable)} <bdi>ج.م</bdi></>}
          hint="صافي مستحقات المدربين"
          tone="amber"
        />
        <Kpi
          icon={<Clock3 size={19} />}
          label="إجمالي الحصص المنفذة المعتمدة"
          value={`${totalSessionsCompleted} حصة`}
          hint="مرصودة من سجلات الحضور"
          tone="teal"
        />
        <Kpi
          icon={<CheckCircle2 size={19} />}
          label="الرواتب المسددة"
          value={payrolls.filter(p => p.status === "PAID").length}
          hint="تم تسليمها للمدربين"
          tone="blue"
        />
      </div>

      <div className="finance-report-note" style={{ marginBottom: "1rem" }}>
        <ShieldCheck size={14} /> <strong>لوجيك الاحتساب المالي:</strong> يُحسب المستحق آلياً كـ (عدد الحصص المنفذة بالفعل × سعر الحصة المتفق عليه) + الراتب الأساسي + المكافآت - الخصومات، بعد اعتماد رئيس المدربين لاكتمال الحصص.
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="finance-desk-table" style={{ width: "100%", textAlign: "right" }}>
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
              <th>الإجراء</th>
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
                  <td><b>{item.id}</b></td>
                  <td><strong>{item.instructorName}</strong></td>
                  <td><b>{item.completedSessionsCount}</b> حصة</td>
                  <td>{money(item.ratePerSession)} ج.م</td>
                  <td>{money(item.baseSalary + item.bonusAmount)} ج.م</td>
                  <td style={{ color: item.deductionAmount > 0 ? "#dc2626" : "inherit" }}>
                    {item.deductionAmount > 0 ? `-${money(item.deductionAmount)}` : "—"}
                  </td>
                  <td><strong style={{ color: "#059669", fontSize: "0.98rem" }}>{money(item.netPayable)} ج.م</strong></td>
                  <td>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background: statusBadge.bg,
                        color: statusBadge.color,
                      }}
                    >
                      {statusBadge.label}
                    </span>
                  </td>
                  <td>
                    {item.status === "SUBMITTED" && (
                      <button
                        type="button"
                        className="button button-secondary"
                        style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                        onClick={() => onApprove(item.id)}
                      >
                        اعتماد المسير
                      </button>
                    )}
                    {item.status === "APPROVED" && (
                      <button
                        type="button"
                        className="button button-primary"
                        style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                        onClick={() => {
                          const ref = window.prompt("رقم الإيصال أو مرجع التحويل البنكي (InstaPay/Cash):", "IPN-10294");
                          if (ref) onPay(item.id, "INSTAPAY", ref);
                        }}
                      >
                        صرف الراتب
                      </button>
                    )}
                    {item.status === "PAID" && (
                      <small style={{ color: "#64748b" }}>
                        سدد عبر {item.paymentMethod} ({item.paymentReference})
                      </small>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
