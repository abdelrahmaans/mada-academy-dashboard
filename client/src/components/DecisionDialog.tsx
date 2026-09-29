import {
  AlertCircle,
  Check,
  FileText,
  ShieldCheck,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import type { ApprovalItem } from "./ApprovalCard";
import WorkflowStepper, { type WorkflowStep } from "./WorkflowStepper";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value
  );
}

function ApprovalTypeIcon({ kind }: { kind: ApprovalItem["kind"] }) {
  return (
    <div
      className={`approval-type-icon ${kind === "discount" ? "approval-discount-icon" : kind === "expense" ? "approval-expense-icon" : "approval-substitute-icon"}`}
      aria-hidden="true"
    >
      {kind === "discount" ? (
        <FileText size={18} />
      ) : kind === "expense" ? (
        <Wallet size={18} />
      ) : (
        <UserCheck size={18} />
      )}
    </div>
  );
}

function workflowSteps(item: ApprovalItem): WorkflowStep[] {
  const decisionLabel =
    item.status === "rejected"
      ? "مرفوض"
      : item.status === "approved"
        ? "تم الاعتماد"
        : "قرار الاعتماد";
  const decisionStatus: WorkflowStep["status"] =
    item.status === "rejected"
      ? "halted"
      : item.status === "approved"
        ? "complete"
        : "upcoming";
  return [
    {
      id: "submitted",
      label: "تم إرسال الطلب",
      caption: item.submittedAt,
      status: "complete",
    },
    {
      id: "review",
      label: "مراجعة مدير الفرع",
      caption: item.status === "pending" ? "بانتظار القرار" : "تمت المراجعة",
      status: item.status === "pending" ? "current" : "complete",
    },
    {
      id: "decision",
      label: decisionLabel,
      caption: item.decidedAt ?? "الخطوة التالية بعد المراجعة",
      status: decisionStatus,
    },
  ];
}

export type DecisionDialogProps = {
  item: ApprovalItem;
  canApprove: boolean;
  discountLimit: number;
  decisionNote: string;
  expenseRejectionMode: boolean;
  onDecisionNoteChange: (value: string) => void;
  onClose: () => void;
  onDecide: (status: "approved" | "rejected") => void;
  onStartExpenseRejection: () => void;
  onCancelExpenseRejection: () => void;
};

export default function DecisionDialog({
  item,
  canApprove,
  discountLimit,
  decisionNote,
  expenseRejectionMode,
  onDecisionNoteChange,
  onClose,
  onDecide,
  onStartExpenseRejection,
  onCancelExpenseRejection,
}: DecisionDialogProps) {
  return (
    <div
      className="dialog-overlay"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="dialog-card approval-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="approval-dialog-title"
      >
        <button className="dialog-close" aria-label="إغلاق" onClick={onClose}>
          <X size={17} />
        </button>
        <ApprovalTypeIcon kind={item.kind} />
        <div className="team-dialog-heading">
          <span className="approval-id" dir="ltr">
            {item.id}
          </span>
          <h2 id="approval-dialog-title">{item.title}</h2>
          <p>{item.summary}</p>
        </div>
        <div className="approval-review-summary">
          <span>
            <small>الفرع</small>
            <strong>{item.branch}</strong>
          </span>
          <span>
            <small>مقدم الطلب</small>
            <strong>{item.requestedBy}</strong>
          </span>
          {item.kind === "discount" ? (
            <>
              <span>
                <small>قيمة الخصم</small>
                <strong>
                  {item.discountValue}% ·{" "}
                  {formatMoney(
                    (item.originalAmount ?? 0) - (item.finalAmount ?? 0)
                  )}{" "}
                  ج.م
                </strong>
              </span>
              <span>
                <small>الفاتورة</small>
                <strong dir="ltr">{item.invoice}</strong>
              </span>
            </>
          ) : item.kind === "expense" ? (
            <>
              <span>
                <small>المصروف</small>
                <strong>{item.expenseDescription}</strong>
              </span>
              <span>
                <small>القيمة</small>
                <strong>
                  <bdi dir="ltr">{formatMoney(item.expenseAmount ?? 0)}</bdi>{" "}
                  ج.م
                </strong>
              </span>
              <span>
                <small>التصنيف</small>
                <strong>{item.expenseCategory}</strong>
              </span>
            </>
          ) : (
            <>
              <span>
                <small>المدرب الأساسي</small>
                <strong>{item.instructor}</strong>
              </span>
              <span>
                <small>المدرب البديل</small>
                <strong>{item.substitute}</strong>
              </span>
              <span>
                <small>موعد الجلسة</small>
                <strong>
                  {item.sessionDate} · {item.sessionTime}
                </strong>
              </span>
            </>
          )}
        </div>
        <WorkflowStepper
          steps={workflowSteps(item)}
          title="مسار الموافقة"
          description="تتابع الحالة من الإرسال حتى قرار صاحب الصلاحية."
        />
        {item.kind === "discount" && (
          <div
            className={`approval-policy-check ${canApprove ? "is-allowed" : "is-escalated"}`}
          >
            <ShieldCheck size={15} />
            <span>
              {canApprove
                ? `ضمن صلاحية مدير الفرع · الحد ${discountLimit}%`
                : `يتطلب تصعيدًا للإدارة · الخصم ${item.discountValue}% يتجاوز الحد`}
            </span>
          </div>
        )}
        {item.kind === "expense" && expenseRejectionMode ? (
          <form
            className="approval-expense-rejection"
            onSubmit={event => {
              event.preventDefault();
              onDecide("rejected");
            }}
          >
            <div className="approval-expense-rejection-notice">
              <AlertCircle size={16} />
              <span>
                <strong>رفض المصروف يتطلب سببًا</strong>
                <small>
                  سيُسجّل السبب مع اسم مدير الفرع ووقت القرار في سجل القرارات.
                </small>
              </span>
            </div>
            <label className="approval-note-field approval-expense-rejection-note">
              سبب الرفض <b aria-hidden="true">*</b>
              <span>إلزامي · بحد أقصى 240 حرفًا</span>
              <textarea
                value={decisionNote}
                onChange={event => onDecisionNoteChange(event.target.value)}
                maxLength={240}
                rows={3}
                placeholder="اذكر سبب عدم اعتماد هذا المصروف..."
                required
                aria-required="true"
                aria-describedby="expense-rejection-counter"
              />
              <small id="expense-rejection-counter">
                {decisionNote.length}/240
              </small>
            </label>
            <div className="dialog-info">
              <AlertCircle size={15} />
              <span>
                هذا القرار تجريبي ومحلي؛ لا يؤثر على سجل المصروفات أو إجماليات
                الماليات ولا يُحفظ على خادم.
              </span>
            </div>
            <div className="approval-dialog-actions approval-expense-rejection-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={onCancelExpenseRejection}
              >
                رجوع للطلب
              </button>
              <button
                type="submit"
                className="button approval-reject-confirm"
                disabled={!decisionNote.trim()}
              >
                <X size={15} /> تأكيد رفض المصروف
              </button>
            </div>
          </form>
        ) : (
          <>
            <label className="approval-note-field">
              ملاحظة القرار{" "}
              <span>
                {item.kind === "expense"
                  ? "اختيارية للموافقة؛ الرفض يتطلب سببًا"
                  : "اختياري · بحد أقصى 240 حرفًا"}
              </span>
              <textarea
                value={decisionNote}
                onChange={event => onDecisionNoteChange(event.target.value)}
                maxLength={240}
                rows={3}
                placeholder={
                  item.kind === "expense"
                    ? "أضف ملاحظة اختيارية للموافقة..."
                    : "مثال: تمت مراجعة الطلب وفق سياسة الفرع."
                }
              />
              <small>{decisionNote.length}/240</small>
            </label>
            <div className="dialog-info">
              <AlertCircle size={15} />
              <span>
                هذا إجراء تجريبي محلي. المراجعة الحقيقية تحتاج تحقق الصلاحيات
                وتسجيل القرار في Audit Log.
              </span>
            </div>
            <div className="approval-dialog-actions">
              <button
                className="button button-secondary"
                onClick={() => {
                  if (item.kind === "expense") onStartExpenseRejection();
                  else onDecide("rejected");
                }}
              >
                <X size={15} /> رفض تجريبي
              </button>
              <button
                className="button button-primary"
                onClick={() => onDecide("approved")}
                disabled={!canApprove}
              >
                <Check size={15} />{" "}
                {canApprove ? "موافقة تجريبية" : "رفع للإدارة"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
