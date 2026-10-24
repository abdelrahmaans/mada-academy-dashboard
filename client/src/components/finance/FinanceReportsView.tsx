import React from "react";
import { ArrowDownToLine, BarChart3, ShieldCheck } from "lucide-react";
import type { FinanceReport } from "@/lib/apiClient";
import type { Invoice, Expense } from "@/pages/FinanceDeskTypes";
import { PanelTitle, money } from "./FinanceShared";

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

