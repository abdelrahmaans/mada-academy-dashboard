import React from "react";
import { FileSpreadsheet, Paperclip } from "lucide-react";
import type { FinanceExpense } from "@/lib/apiClient";

export interface ExpenseAnalytics {
  totalPiastres: number;
  approvedPiastres: number;
  pendingPiastres: number;
  rejectedPiastres: number;
  categories: {
    category: string;
    count: number;
    totalPiastres: number;
    percent: number;
  }[];
}

export interface ReportsExpensesTabProps {
  expenses: FinanceExpense[] | null;
  expenseAnalytics: ExpenseAnalytics;
  money: (piastres: number) => string;
  onExportCsv: () => void;
}

export function ReportsExpensesTab({
  expenses,
  expenseAnalytics,
  money,
  onExportCsv,
}: ReportsExpensesTabProps) {
  return (
    <section className="reports-live-expenses-section">
      {/* Summary Strip */}
      <div className="expenses-summary-strip">
        <div className="radar-pill">
          <span>إجمالي المصروفات المسجلة</span>
          <strong>{money(expenseAnalytics.totalPiastres)}</strong>
        </div>
        <div className="radar-pill radar-pill-low">
          <span>مصروفات معتمدة للصرف</span>
          <strong>{money(expenseAnalytics.approvedPiastres)}</strong>
        </div>
        <div className="radar-pill radar-pill-medium">
          <span>بانتظار المراجعة والاعتماد</span>
          <strong>{money(expenseAnalytics.pendingPiastres)}</strong>
        </div>
        <div className="radar-pill radar-pill-high">
          <span>مصروفات مرفوضة ومستبعدة</span>
          <strong>{money(expenseAnalytics.rejectedPiastres)}</strong>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="reports-live-table-panel" style={{ marginBottom: 16 }}>
        <div className="reports-live-table-heading">
          <div>
            <h2>توزيع المصروفات حسب التصنيف والبنود التشغيلية</h2>
            <p>
              بيان بحصص ومبالغ الصرف لكل بند ونسبتها المئوية من إجمالي المصروفات
            </p>
          </div>
          <span>{expenseAnalytics.categories.length} تصنيفات</span>
        </div>

        <div style={{ padding: 18 }}>
          <div className="expenses-category-grid">
            {expenseAnalytics.categories.map(cat => (
              <div key={cat.category} className="expenses-category-card">
                <div className="expenses-category-card-top">
                  <span className="expenses-category-name">{cat.category}</span>
                  <span className="expenses-category-count">{cat.count} بنود</span>
                </div>
                <div className="expenses-category-amount">
                  {money(cat.totalPiastres)}
                </div>
                <div className="expenses-category-bar-bg">
                  <div
                    className="expenses-category-bar-fill"
                    style={{
                      width: `${Math.min(100, Math.max(5, cat.percent))}%`,
                    }}
                  />
                </div>
                <div className="expenses-category-percent">
                  <span>حصة الصرف من الإجمالي</span>
                  <strong>{cat.percent}%</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses Detail Table */}
      <div className="reports-live-table-panel">
        <div className="reports-live-table-heading">
          <div>
            <h2>سجل بنود المصروفات وحالة الاعتماد وسندات الصرف</h2>
            <p>تفاصيل عمليات الصرف المسجلة ومستندات الإثبات وتاريخ الصرف</p>
          </div>
          <button
            className="button button-secondary button-sm"
            onClick={onExportCsv}
          >
            <FileSpreadsheet size={14} /> تصدير إكسيل المصروفات
          </button>
        </div>

        {!expenses || expenses.length === 0 ? (
          <div className="reports-live-empty">
            لا توجد بنود مصروفات مسجلة ضمن هذا النطاق.
          </div>
        ) : (
          <div className="reports-live-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>البند / الوصف</th>
                  <th>التصنيف</th>
                  <th>الفرع</th>
                  <th>التاريخ</th>
                  <th>المبلغ</th>
                  <th>حالة الاعتماد</th>
                  <th>إثبات الصرف</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => {
                  const st = exp.status?.toLowerCase();
                  return (
                    <tr key={exp.id}>
                      <td>
                        <strong>{exp.description}</strong>
                        {exp.approvalReason && (
                          <small
                            style={{
                              display: "block",
                              color: "#64748b",
                              marginTop: 2,
                            }}
                          >
                            ملاحظة: {exp.approvalReason}
                          </small>
                        )}
                      </td>
                      <td>
                        <span className="tag-pill">{exp.category || "عام"}</span>
                      </td>
                      <td>{exp.branchName || "الفرع المصرح"}</td>
                      <td>{exp.spentOn || exp.createdAt?.slice(0, 10) || "—"}</td>
                      <td>
                        <strong>{money(exp.amountPiastres)}</strong>
                      </td>
                      <td>
                        <span
                          className={`risk-tag ${
                            st === "approved"
                              ? "risk-tag-low"
                              : st === "rejected"
                              ? "risk-tag-high"
                              : "risk-tag-medium"
                          }`}
                        >
                          {st === "approved"
                            ? "معتمد للصرف ✅"
                            : st === "rejected"
                            ? "مرفوض ❌"
                            : "قيد المراجعة ⏳"}
                        </span>
                      </td>
                      <td>
                        {exp.evidenceStatus === "ATTACHED" ? (
                          <span
                            style={{
                              color: "#0f766e",
                              fontSize: 11,
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Paperclip size={12} /> مرفق سند
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: 11 }}>
                            بدون إثبات
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
