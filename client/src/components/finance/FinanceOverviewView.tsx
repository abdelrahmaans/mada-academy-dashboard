import React from "react";
import {
  Banknote,
  BarChart3,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  FileCheck2,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import type { ShiftCashHandover, TrainerPayrollRecord } from "@/lib/apiClient";
import type { Invoice, Expense } from "@/pages/FinanceDeskTypes";
import {
  Kpi,
  PanelTitle,
  money,
  invoiceStatus,
  STATUS_LABEL,
  EXPENSE_LABEL,
  PAYMENT_METHOD_LABELS,
} from "./FinanceShared";

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
