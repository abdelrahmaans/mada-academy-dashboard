import { useLayoutEffect, useRef, type ReactNode } from "react";
import {
  Activity,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  CreditCard,
  Search,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import SharedStatusBadge from "@/components/StatusBadge";

type AcademyStatus = "active" | "trial" | "setup" | "paused";
type TicketStatus = "new" | "inProgress" | "waiting" | "resolved";
type Academy = {
  id: string;
  name: string;
  owner: string;
  plan: string;
  branches: number;
  users: number;
  status: AcademyStatus;
  renewal: string;
};
type SupportTicket = {
  id: string;
  title: string;
  academy: string;
  category: string;
  priority: "high" | "medium" | "low";
  status: TicketStatus;
  updated: string;
  summary: string;
};

const academyStatusLabels: Record<AcademyStatus, string> = {
  active: "نشطة",
  trial: "فترة تجريبية",
  setup: "تحتاج استكمالًا",
  paused: "معلّقة للمراجعة",
};
const ticketStatusLabels: Record<TicketStatus, string> = {
  new: "جديدة",
  inProgress: "قيد المتابعة",
  waiting: "بانتظار الأكاديمية",
  resolved: "تم الحل",
};
const ticketPriorityLabels = {
  high: "عالية",
  medium: "متوسطة",
  low: "عادية",
} as const;
const formatNumber = (value: number) =>
  new Intl.NumberFormat("ar-EG").format(value);

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`pc-ticket-status pc-ticket-${status}`}>
      {ticketStatusLabels[status]}
    </span>
  );
}

export function AcademyTable({
  academies,
  onOpen,
  compact = false,
}: {
  academies: Academy[];
  onOpen: (academy: Academy) => void;
  compact?: boolean;
}) {
  const rows = compact ? academies.slice(0, 4) : academies;
  const tableWrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const wrapper = tableWrapRef.current;
    if (!wrapper) return;

    const alignToAcademyColumn = () => {
      wrapper.scrollLeft = wrapper.scrollWidth;
    };

    alignToAcademyColumn();
    const resizeObserver = new ResizeObserver(alignToAcademyColumn);
    resizeObserver.observe(wrapper);
    return () => resizeObserver.disconnect();
  }, [rows.length]);

  if (rows.length === 0) {
    return (
      <div className="pc-empty-state">
        <Building2 size={22} aria-hidden="true" />
        <strong>مافيش أكاديميات مطابقة</strong>
        <span>جرّب تغيير كلمة البحث أو حالة الاشتراك.</span>
      </div>
    );
  }

  return (
    <>
      <p className="pc-table-swipe-hint">
        اسحب الجدول أفقيًا لعرض باقي الأعمدة
      </p>
      <div
        className="pc-table-wrap"
        dir="ltr"
        role="region"
        aria-label="جدول الأكاديميات قابل للتمرير أفقيًا"
        tabIndex={0}
        ref={tableWrapRef}
      >
        <table className="pc-table" dir="rtl">
          <thead>
            <tr>
              <th scope="col">الأكاديمية</th>
              <th scope="col">الخطة</th>
              <th scope="col">الفروع</th>
              <th scope="col">الحسابات</th>
              <th scope="col">الحالة</th>
              <th scope="col">التجديد / المتابعة</th>
              <th scope="col">
                <span className="pc-sr-only">التفاصيل</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(academy => (
              <tr key={academy.id}>
                <td>
                  <div className="pc-academy-cell">
                    <span className="pc-academy-avatar" aria-hidden="true">
                      {academy.name.slice(0, 1)}
                    </span>
                    <span className="pc-academy-copy">
                      <strong>{academy.name}</strong>
                      <small>
                        {academy.id} · مسؤول الأكاديمية: {academy.owner}
                      </small>
                    </span>
                  </div>
                </td>
                <td>
                  <span className="pc-plan-label">{academy.plan}</span>
                </td>
                <td>
                  <span className="pc-number-ltr">
                    {formatNumber(academy.branches)}
                  </span>
                </td>
                <td>
                  <span className="pc-number-ltr">
                    {formatNumber(academy.users)}
                  </span>
                </td>
                <td>
                  <SharedStatusBadge
                    status={academy.status}
                    label={academyStatusLabels[academy.status]}
                    className={`pc-status-badge pc-status-${academy.status}`}
                  />
                </td>
                <td>
                  <span className="pc-renewal-text">{academy.renewal}</span>
                </td>
                <td>
                  <button
                    className="pc-row-action"
                    type="button"
                    onClick={() => onOpen(academy)}
                  >
                    التفاصيل <ChevronLeft size={14} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function TicketList({
  tickets,
  onOpen,
  compact = false,
}: {
  tickets: SupportTicket[];
  onOpen: (ticket: SupportTicket) => void;
  compact?: boolean;
}) {
  const rows = compact ? tickets.slice(0, 3) : tickets;

  if (rows.length === 0) {
    return (
      <div className="pc-empty-state pc-empty-compact">
        <Ticket size={21} aria-hidden="true" />
        <strong>مافيش تذاكر في العينة</strong>
        <span>ستظهر الطلبات هنا عندما ترسلها أكاديمية.</span>
      </div>
    );
  }

  return (
    <div className="pc-ticket-list">
      {rows.map(ticket => (
        <article className="pc-ticket-card" key={ticket.id}>
          <div className="pc-ticket-card-top">
            <span className="pc-ticket-id">{ticket.id}</span>
            <span className={`pc-priority pc-priority-${ticket.priority}`}>
              {ticketPriorityLabels[ticket.priority]}
            </span>
          </div>
          <button
            className="pc-ticket-title"
            type="button"
            onClick={() => onOpen(ticket)}
          >
            {ticket.title}
          </button>
          <div className="pc-ticket-meta">
            <span>
              <Building2 size={13} aria-hidden="true" />
              {ticket.academy}
            </span>
            <span>
              <Clock3 size={13} aria-hidden="true" />
              {ticket.updated}
            </span>
          </div>
          <div className="pc-ticket-card-bottom">
            <span className="pc-ticket-category">{ticket.category}</span>
            <TicketStatusBadge status={ticket.status} />
          </div>
        </article>
      ))}
    </div>
  );
}
export function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Building2;
  tone: "teal" | "blue" | "amber" | "violet";
}) {
  return (
    <article className="pc-metric-card">
      <div className={`pc-metric-icon pc-metric-${tone}`}>
        <Icon size={18} aria-hidden="true" />
      </div>
      <span className="pc-metric-label">{label}</span>
      <strong className="pc-metric-value">{value}</strong>
      <small className="pc-metric-note">{note}</small>
    </article>
  );
}

export function PanelHeading({
  title,
  eyebrow,
  action,
}: {
  title: string;
  eyebrow: string;
  action?: ReactNode;
}) {
  return (
    <div className="pc-panel-heading">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function AcademyFilters({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
}: {
  query: string;
  setQuery: (value: string) => void;
  statusFilter: "all" | AcademyStatus;
  setStatusFilter: (value: "all" | AcademyStatus) => void;
}) {
  const filters: { value: "all" | AcademyStatus; label: string }[] = [
    { value: "all", label: "الكل" },
    { value: "active", label: "نشطة" },
    { value: "trial", label: "تجريبية" },
    { value: "setup", label: "تحتاج استكمالًا" },
    { value: "paused", label: "معلّقة" },
  ];
  return (
    <div className="pc-filter-row">
      <label className="pc-search-field">
        <Search size={17} aria-hidden="true" />
        <input
          aria-label="ابحث عن أكاديمية أو مسؤولها"
          placeholder="ابحث عن أكاديمية أو مسؤولها..."
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
      </label>
      <div
        className="pc-filter-chips"
        role="group"
        aria-label="تصفية الأكاديميات حسب الحالة"
      >
        {filters.map(filter => (
          <button
            type="button"
            key={filter.value}
            className={statusFilter === filter.value ? "pc-filter-active" : ""}
            aria-pressed={statusFilter === filter.value}
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="pc-detail-item">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
