import {
  ArrowDownToLine,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  FileText,
  MapPin,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";

export type ApprovalKind = "discount" | "substitute" | "expense" | "session";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export type ApprovalItem = {
  id: string;
  kind: ApprovalKind;
  title: string;
  summary: string;
  branch: string;
  requestedBy: string;
  submittedAt: string;
  submittedAtSort: string;
  student?: string;
  course?: string;
  invoice?: string;
  discountType?: string;
  discountValue?: number;
  originalAmount?: number;
  finalAmount?: number;
  instructor?: string;
  substitute?: string;
  expenseDescription?: string;
  expenseAmount?: number;
  expenseCategory?: string;
  sessionDate?: string;
  sessionTime?: string;
  status: ApprovalStatus;
  decidedAt?: string;
  decidedAtSort?: number;
  decidedBy?: string;
  decisionNote?: string;
  requestType?: string;
  targetId?: string;
  proposedInstructorId?: string | null;
  live?: boolean;
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: "بانتظار القرار",
  approved: "تمت الموافقة",
  rejected: "مرفوض",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value
  );
}

function ApprovalTypeIcon({ kind }: { kind: ApprovalKind }) {
  return (
    <div
      className={`approval-type-icon ${kind === "discount" ? "approval-discount-icon" : kind === "expense" ? "approval-expense-icon" : kind === "session" ? "approval-session-icon" : "approval-substitute-icon"}`}
      aria-hidden="true"
    >
      {kind === "session" ? <CalendarDays size={18} /> : kind === "discount" ? (
        <FileText size={18} />
      ) : kind === "expense" ? (
        <Wallet size={18} />
      ) : (
        <UserCheck size={18} />
      )}
    </div>
  );
}

function ApprovalDetailStrip({ item }: { item: ApprovalItem }) {
  if (item.kind === "discount") {
    return (
      <div className="approval-detail-strip">
        <span>{item.student}</span>
        <i />
        <span>{item.course}</span>
        <i />
        <bdi dir="ltr">{item.invoice}</bdi>
      </div>
    );
  }

  if (item.kind === "expense") {
    return (
      <div className="approval-detail-strip">
        <span>{item.expenseDescription}</span>
        <i />
        <bdi dir="ltr">{formatMoney(item.expenseAmount ?? 0)} ج.م</bdi>
        <i />
        <span>{item.expenseCategory}</span>
      </div>
    );
  }

  if (item.kind === "session") {
    return <div className="approval-detail-strip"><span>{item.requestType ?? "طلب جلسة"}</span><i /><span>الجلسة المستهدفة</span><bdi dir="ltr">{item.targetId}</bdi></div>;
  }
  return (
    <div className="approval-detail-strip">
      <span>الأساسي: {item.instructor}</span>
      <ArrowDownToLine size={13} className="substitute-arrow" />
      <span>البديل: {item.substitute}</span>
      <i />
      <span>
        {item.sessionDate} · {item.sessionTime}
      </span>
    </div>
  );
}

function ApprovalSideSummary({ item }: { item: ApprovalItem }) {
  if (item.kind === "discount") {
    return (
      <>
        <small>
          {item.discountType} · {item.discountValue}%
        </small>
        <strong>
          {formatMoney(item.finalAmount ?? 0)} <bdi>ج.م</bdi>
        </strong>
        <span>بدلًا من {formatMoney(item.originalAmount ?? 0)} ج.م</span>
      </>
    );
  }

  if (item.kind === "expense") {
    return (
      <>
        <small>مصروف يحتاج تأكيدًا</small>
        <strong>
          {formatMoney(item.expenseAmount ?? 0)} <bdi>ج.م</bdi>
        </strong>
        <span>{item.expenseCategory}</span>
      </>
    );
  }

  if (item.kind === "session") {
    return <><small>طلب جلسة تشغيلية</small><strong>{item.sessionDate ?? "بانتظار المراجعة"}</strong><span>{item.sessionTime ?? item.requestType}</span></>;
  }
  return (
    <>
      <small>موعد الحصة</small>
      <strong className="approval-session-time">{item.sessionTime}</strong>
      <span>{item.sessionDate}</span>
    </>
  );
}

export type ApprovalCardProps = {
  item: ApprovalItem;
  onReview: (item: ApprovalItem) => void;
};

export default function ApprovalCard({ item, onReview }: ApprovalCardProps) {
  return (
    <article
      className={`approval-card ${item.status !== "pending" ? "approval-card-reviewed" : ""}`}
    >
      <ApprovalTypeIcon kind={item.kind} />
      <div className="approval-card-main">
        <div className="approval-card-top">
          <div>
            <span className="approval-id" dir="ltr">
              {item.id}
            </span>
            <span className={`approval-status approval-${item.status}`}>
              <i />
              {APPROVAL_STATUS_LABELS[item.status]}
            </span>
          </div>
          <small>{item.submittedAt}</small>
        </div>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
        <div className="approval-meta-row">
          <span>
            <MapPin size={13} /> {item.branch}
          </span>
          <span>
            <Users size={13} /> {item.requestedBy}
          </span>
        </div>
        <ApprovalDetailStrip item={item} />
        {item.status !== "pending" && (
          <div className="approval-history-inline">
            {item.status === "rejected" ? (
              <X size={13} />
            ) : (
              <CheckCircle2 size={13} />
            )}
            <span>{item.decidedBy ?? "أحمد محمود · مدير الفرع"}</span>
            <i />
            <span>{item.decidedAt ?? "قرار توضيحي سابق"}</span>
            {item.decisionNote && (
              <em>
                {item.kind === "expense" && item.status === "rejected" && (
                  <strong>سبب الرفض: </strong>
                )}
                {item.decisionNote}
              </em>
            )}
          </div>
        )}
      </div>
      <div className="approval-card-side">
        <ApprovalSideSummary item={item} />
        {item.status === "pending" ? (
          <button
            className="approval-review-button"
            onClick={() => onReview(item)}
          >
            مراجعة الطلب <ChevronLeft size={14} />
          </button>
        ) : (
          <span className="approval-review-result">
            {item.status === "approved" ? (
              <CheckCircle2 size={14} />
            ) : (
              <X size={14} />
            )}
            {APPROVAL_STATUS_LABELS[item.status]}
          </span>
        )}
      </div>
    </article>
  );
}
