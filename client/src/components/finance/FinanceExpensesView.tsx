import React, { type FormEvent } from "react";
import {
  Check,
  CheckCircle2,
  Eye,
  FileCheck2,
  FileDown,
  FileText,
  Plus,
  Search,
  ShieldCheck,
  TrendingDown,
  Upload,
  X,
} from "lucide-react";
import type { Expense } from "@/pages/FinanceDeskTypes";
import {
  PanelTitle,
  money,
  EXPENSE_LABEL,
} from "./FinanceShared";

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
