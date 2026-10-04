import {
  Activity,
  CheckCircle2,
  Clock3,
  FileText,
  Search,
  ShieldCheck,
  UserCheck,
  Wallet,
} from "lucide-react";
import {
  type ApprovalItem,
  type ApprovalKind,
  type ApprovalStatus,
} from "@/components/ApprovalCard";
import ApprovalCard from "@/components/ApprovalCard";
import ApprovalQueueTabs from "@/components/ApprovalQueueTabs";
import AuditTimeline, { type AuditEvent } from "@/components/AuditTimeline";

type QueueTab = "all" | ApprovalKind;
type ApprovalSort = "priority" | "oldest" | "newest";

export function ApprovalSummaryStats({
  liveMode,
  pendingCount,
  pendingDiscounts,
  pendingSessionRequests,
  pendingSubstitutes,
  pendingExpenses,
  reviewedCount,
}: {
  liveMode: boolean;
  pendingCount: number;
  pendingDiscounts: number;
  pendingSessionRequests: number;
  pendingSubstitutes: number;
  pendingExpenses: number;
  reviewedCount: number;
}) {
  return (
    <section
      className="finance-stats-grid approval-stats"
      aria-label="ملخص الموافقات"
    >
      <article className="finance-stat">
        <span className="finance-stat-icon icon-amber">
          <Clock3 size={18} />
        </span>
        <span className="finance-stat-label">بانتظار قرارك</span>
        <div>
          <strong>{pendingCount}</strong>
          <small>{liveMode ? "طلب ضمن نطاقك" : "طلب داخل الفرع"}</small>
        </div>
        <small>ابدأ بالأقدم أو الأكثر تأثيرًا</small>
      </article>
      <article className="finance-stat">
        <span className="finance-stat-icon icon-blue">
          <FileText size={18} />
        </span>
        <span className="finance-stat-label">
          {liveMode ? "طلبات جلسة" : "طلبات الخصم"}
        </span>
        <div>
          <strong>
            {liveMode ? pendingSessionRequests : pendingDiscounts}
          </strong>
          <small>تحتاج مراجعة</small>
        </div>
        <small>
          {liveMode ? "إضافية أو تعويضية" : "خصم إخوة أو حملة توضيحية"}
        </small>
      </article>
      <article className="finance-stat">
        <span className="finance-stat-icon icon-violet">
          <UserCheck size={18} />
        </span>
        <span className="finance-stat-label">طلبات مدرب بديل</span>
        <div>
          <strong>{pendingSubstitutes}</strong>
          <small>تحتاج مراجعة</small>
        </div>
        <small>تبديل مؤقت لجلسة محددة</small>
      </article>
      <article className="finance-stat">
        <span className="finance-stat-icon icon-teal">
          <Wallet size={18} />
        </span>
        <span className="finance-stat-label">مصروفات تحتاج تأكيدًا</span>
        <div>
          <strong>{liveMode ? "—" : pendingExpenses}</strong>
          <small>{liveMode ? "غير مدعومة هنا" : "ترفعها المحاسبة"}</small>
        </div>
        <small>
          {liveMode
            ? "تحتاج endpoint مالي منفصل"
            : "تظهر في الماليات بعد اعتمادك"}
        </small>
      </article>
      <article className="finance-stat">
        <span className="finance-stat-icon icon-teal">
          <CheckCircle2 size={18} />
        </span>
        <span className="finance-stat-label">تمت مراجعتها</span>
        <div>
          <strong>{reviewedCount}</strong>
          <small>{liveMode ? "من الخادم" : "في هذه المعاينة"}</small>
        </div>
        <small>يمكن متابعة سجل القرار في كل بطاقة</small>
      </article>
    </section>
  );
}

export function ApprovalQueueAndHistory({
  liveMode,
  branch,
  visibleRequests,
  branchRequestCount,
  pendingCount,
  pendingSessionRequests,
  pendingSubstitutes,
  pendingCorrectionCount,
  discountCount,
  expenseCount,
  tab,
  setTab,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder,
  onReview,
  onClearFilters,
  auditEvents,
  reviewedCount,
}: {
  liveMode: boolean;
  branch: string;
  visibleRequests: ApprovalItem[];
  branchRequestCount: number;
  pendingCount: number;
  pendingSessionRequests: number;
  pendingSubstitutes: number;
  pendingCorrectionCount: number;
  discountCount: number;
  expenseCount: number;
  tab: QueueTab;
  setTab: (value: QueueTab) => void;
  query: string;
  setQuery: (value: string) => void;
  statusFilter: ApprovalStatus | "all";
  setStatusFilter: (value: ApprovalStatus | "all") => void;
  sortOrder: ApprovalSort;
  setSortOrder: (value: ApprovalSort) => void;
  onReview: (item: ApprovalItem) => void;
  onClearFilters: () => void;
  auditEvents: AuditEvent[];
  reviewedCount: number;
}) {
  return (
    <>
      <section className="panel approvals-panel">
        <div className="approval-toolbar-top">
          <div className="panel-title-group">
            <span className="panel-icon panel-icon-amber">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h2>قائمة المراجعة</h2>
              <p>الطلبات المرسلة إلى مدير الفرع</p>
            </div>
          </div>
          <span className="team-table-total">{visibleRequests.length} طلب</span>
        </div>
        <div className="approval-controls">
          <ApprovalQueueTabs
            activeTab={tab}
            onChange={setTab}
            tabs={
              liveMode
                ? [
                    {
                      id: "all",
                      label: "كل الطلبات",
                      count: branchRequestCount,
                    },
                    {
                      id: "session",
                      label: "طلبات الجلسات",
                      count: pendingSessionRequests,
                    },
                    {
                      id: "substitute",
                      label: "مدرب بديل",
                      count: pendingSubstitutes,
                    },
                    {
                      id: "correction",
                      label: "تصحيح فواتير",
                      count: pendingCorrectionCount,
                    },
                  ]
                : [
                    {
                      id: "all",
                      label: "كل الطلبات",
                      count: branchRequestCount,
                    },
                    {
                      id: "discount",
                      label: "خصومات",
                      count: discountCount,
                    },
                    {
                      id: "substitute",
                      label: "مدرب بديل",
                      count: pendingSubstitutes,
                    },
                    {
                      id: "expense",
                      label: "مصروفات",
                      count: expenseCount,
                    },
                  ]
            }
          />
          <label className="approval-search">
            <Search size={15} />
            <input
              aria-label="بحث في قائمة المراجعة"
              placeholder="بحث في الطلبات..."
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
          </label>
        </div>
        <div className="approval-filter-row">
          <label>
            حالة الطلب
            <select
              aria-label="تصفية حسب حالة الطلب"
              value={statusFilter}
              onChange={event =>
                setStatusFilter(event.target.value as ApprovalStatus | "all")
              }
            >
              <option value="all">كل الحالات</option>
              <option value="pending">بانتظار المراجعة</option>
              <option value="approved">تمت الموافقة</option>
              <option value="rejected">تم الرفض</option>
            </select>
          </label>
          <label>
            ترتيب القائمة
            <select
              aria-label="ترتيب قائمة الطلبات"
              value={sortOrder}
              onChange={event =>
                setSortOrder(event.target.value as ApprovalSort)
              }
            >
              <option value="priority">المعلّق أولًا · الأقدم</option>
              <option value="oldest">الأقدم إرسالًا</option>
              <option value="newest">الأحدث إرسالًا</option>
            </select>
          </label>
          <span className="approval-filter-summary">
            {visibleRequests.length} نتيجة · {pendingCount} معلّق
          </span>
        </div>
        {visibleRequests.length ? (
          <div className="approval-list">
            {visibleRequests.map(item => (
              <ApprovalCard key={item.id} item={item} onReview={onReview} />
            ))}
          </div>
        ) : (
          <div className="team-empty approval-empty">
            <Search size={20} />
            <strong>مفيش طلبات مطابقة</strong>
            <span>جرّب نوع طلب مختلف أو ابحث بكلمة أقصر.</span>
            <button className="text-link" onClick={onClearFilters}>
              مسح البحث والفلاتر
            </button>
          </div>
        )}
        <div className="team-table-footer">
          <span>
            {liveMode ? "طلبات الخادم" : "قائمة توضيحية"} ·{" "}
            {visibleRequests.length} من {branchRequestCount} طلب
          </span>
          <span>النطاق: {branch}</span>
        </div>
      </section>
      <section
        className="panel approval-history-panel"
        aria-labelledby="approval-history-title"
      >
        <div className="approval-history-heading">
          <div className="panel-title-group">
            <span className="panel-icon panel-icon-teal">
              <Activity size={18} />
            </span>
            <div>
              <h2 id="approval-history-title">سجل القرارات</h2>
              <p>آخر قرارات مدير الفرع · {branch}</p>
            </div>
          </div>
          <span className="team-table-total">{reviewedCount} قرار</span>
        </div>
        <AuditTimeline
          events={auditEvents}
          emptyLabel={
            liveMode
              ? "لا توجد قرارات محفوظة في هذا النطاق بعد."
              : "لا توجد قرارات مسجلة في بيانات العرض بعد."
          }
        />
      </section>
    </>
  );
}
