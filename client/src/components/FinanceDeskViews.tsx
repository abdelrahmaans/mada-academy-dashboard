import type { FormEvent, ReactNode } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
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
  Wallet,
} from "lucide-react";
import type { FinanceReport } from "@/lib/apiClient";
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
  reports: "التقارير المالية",
};
export const VIEW_COPY: Record<View, string> = {
  overview:
    "تابع التحصيل والمستحقات والمصروفات المعتمدة قبل اتخاذ الخطوة التالية.",
  collections:
    "سجل الدفعات، راجع الأرصدة، وارفع طلب تصحيح بدل تعديل الفاتورة مباشرة.",
  expenses:
    "أنشئ مصروفًا، راجع حالته، وارفضه بسبب موثق قبل دخوله في الإجماليات.",
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
                  {invoice.payments.map(payment => (
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
                        <label className="finance-evidence-action">
                          رفع إثبات الدفع
                          <input
                            type="file"
                            accept="application/pdf,image/jpeg,image/png"
                            hidden
                            onChange={event => {
                              const file = event.target.files?.[0];
                              if (file) onUploadEvidence(payment.id, file);
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>
                      )}
                    </span>
                  ))}
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
              onChange={event => setAmount(event.target.value)}
              type="number"
              min="1"
              placeholder="مثال: 1200"
            />
          </label>
          <label>
            طريقة الدفع
            <select
              value={paymentMethod}
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
              onChange={event => setReceivedOn(event.target.value)}
            />
          </label>
          {(paymentMethod === "INSTAPAY" ||
            paymentMethod === "VODAFONE_CASH") && (
            <label>
              المرجع الخارجي
              <input
                value={externalReference}
                onChange={event => setExternalReference(event.target.value)}
                placeholder="رقم العملية أو المرجع"
                required
              />
            </label>
          )}
          <button className="finance-desk-primary" type="submit">
            <Check size={14} /> تسجيل التحصيل
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
            expenses.map(expense => (
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
                    >
                      اعتماد
                    </button>
                    <button
                      className="finance-reject-link"
                      onClick={() => onReject(expense.id)}
                    >
                      رفض بسبب
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
                  <label className="finance-evidence-action">
                    رفع الإثبات
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      hidden
                      onChange={event => {
                        const file = event.target.files?.[0];
                        if (file) onUploadEvidence(expense.id, file);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                )}
              </article>
            ))
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
              onChange={event => setDescription(event.target.value)}
              placeholder="مثال: صيانة معمل"
            />
          </label>
          <label>
            الفرع
            <select
              value={branch}
              disabled={liveMode}
              onChange={event => setBranch(event.target.value)}
            >
              <option>مدينة نصر</option>
              <option>المعادي</option>
              <option>الشيخ زايد</option>
            </select>
          </label>
          <label>
            التصنيف
            <select disabled={liveMode}>
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
              onChange={event => setAmount(event.target.value)}
              type="number"
              min="1"
              placeholder="مثال: 1500"
            />
          </label>
          <button className="finance-desk-primary" type="submit">
            <Plus size={14} /> رفع للمراجعة
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
