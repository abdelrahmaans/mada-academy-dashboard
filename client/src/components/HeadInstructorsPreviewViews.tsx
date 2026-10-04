import type { KeyboardEvent, RefObject } from "react";
import {
  AlertCircle,
  BookOpen,
  Clock3,
  ChevronLeft,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";
import { LoadingState } from "@/components/FeedbackStates";
import type {
  EvaluationCardStatus,
  EvaluationRecord,
  SessionRecord,
  SessionStatus,
} from "@/pages/HeadInstructors";

const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short" }).format(
    new Date(`${isoDate}T12:00:00`)
  );

export function EvaluationCard({
  evaluation,
  reviewed,
  onOpen,
  cardStatusLabels,
}: {
  evaluation: EvaluationRecord;
  reviewed: boolean;
  onOpen: () => void;
  cardStatusLabels: Record<EvaluationCardStatus, string>;
}) {
  const avg = (
    Object.values(evaluation.scores).reduce((sum, value) => sum + value, 0) /
    Object.values(evaluation.scores).length
  ).toFixed(1);
  return (
    <button className="academic-evaluation-card" onClick={onOpen}>
      <span
        className={`academic-evaluation-avatar eval-${evaluation.cardStatus}`}
      >
        {evaluation.student.slice(0, 1)}
      </span>
      <span className="academic-evaluation-main">
        <strong>{evaluation.student}</strong>
        <small>
          {evaluation.courseName} · {formatDate(evaluation.sessionDate)}
        </small>
        <span className="academic-evaluation-comment">
          {evaluation.comment}
        </span>
      </span>
      <span className="academic-evaluation-score">
        <strong>
          <Star size={13} fill="currentColor" />
          {avg}
        </strong>
        <small>من ٥</small>
      </span>
      {evaluation.cardStatus === "generating" ? (
        <LoadingState compact label="جارٍ تجهيز البطاقة" />
      ) : (
        <span className={`academic-card-status ${evaluation.cardStatus}`}>
          {reviewed ? "تم الاطلاع" : cardStatusLabels[evaluation.cardStatus]}
        </span>
      )}
      <ChevronLeft size={15} className="academic-row-chevron" />
    </button>
  );
}

export function HeadInstructorsSessionsView({
  query,
  setQuery,
  searchRef,
  statusFilter,
  setStatusFilter,
  sessions,
  summarySessions,
  selectedSessionId,
  selectedSession,
  onSelectSession,
  onKeyDown,
  statusLabels,
  branch,
  presentRate,
}: {
  query: string;
  setQuery: (value: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sessions: SessionRecord[];
  summarySessions: SessionRecord[];
  selectedSessionId: string;
  selectedSession: SessionRecord;
  onSelectSession: (id: string) => void;
  onKeyDown: (
    event: KeyboardEvent<HTMLTableRowElement>,
    sessionId: string
  ) => void;
  statusLabels: Record<SessionStatus, string>;
  branch: string;
  presentRate: (session: SessionRecord) => number | null;
}) {
  const currentCompletedCount = summarySessions.filter(
    session => session.status === "completed"
  ).length;
  const currentPendingCount = summarySessions.filter(
    session => session.status === "pending_approval"
  ).length;
  const currentScheduledCount = summarySessions.filter(
    session => session.status === "scheduled"
  ).length;
  return (
    <>
      <div className="academic-mini-kpis">
        <span>
          <i className="mini-teal" />
          <b>{summarySessions.length}</b> جلسات في العينة
        </span>
        <span>
          <i className="mini-blue" />
          <b>{currentCompletedCount}</b> مكتملة
        </span>
        <span>
          <i className="mini-amber" />
          <b>{currentPendingCount}</b> مراجعة تسجيل
        </span>
        <span>
          <i className="mini-violet" />
          <b>{currentScheduledCount}</b> قادمة
        </span>
      </div>
      <div className="academic-workspace-grid">
        <section className="academic-panel academic-sessions-panel">
          <div className="academic-panel-heading">
            <div>
              <span className="academic-panel-kicker">
                جلسات الفرع · بيانات توضيحية
              </span>
              <h2>
                سجل الحصص والحضور <small>{sessions.length} نتائج</small>
              </h2>
            </div>
          </div>
          <div className="academic-filter-row">
            <label className="academic-search">
              <Search size={15} />
              <input
                aria-label="بحث في الحصص"
                placeholder="ابحث بالكورس أو المدرب أو المجموعة..."
                ref={searchRef}
                value={query}
                onChange={event => setQuery(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </label>
            <label className="academic-filter-select">
              <span>الحالة</span>
              <select
                aria-label="تصفية الحصص حسب الحالة"
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value)}
              >
                <option value="all">كل الحالات</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option value={key} key={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="academic-session-table-wrap">
            <table className="academic-session-table">
              <thead>
                <tr>
                  <th>الجلسة</th>
                  <th>المدرب</th>
                  <th>التاريخ والوقت</th>
                  <th>الحضور</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr
                    key={session.id}
                    tabIndex={0}
                    aria-label={`تفاصيل جلسة ${session.courseName}`}
                    aria-current={
                      selectedSessionId === session.id ? "true" : undefined
                    }
                    className={
                      selectedSessionId === session.id ? "selected" : ""
                    }
                    onClick={() => onSelectSession(session.id)}
                    onKeyDown={event => onKeyDown(event, session.id)}
                  >
                    <td>
                      <span className="academic-session-name">
                        <i>
                          <BookOpen size={14} />
                        </i>
                        <span>
                          <strong>{session.courseName}</strong>
                          <small>
                            {session.groupName} · {session.offeringId}
                          </small>
                        </span>
                      </span>
                    </td>
                    <td>{session.instructor}</td>
                    <td>
                      <span className="academic-session-date">
                        {session.dateLabel}
                        <small>
                          <bdi dir="ltr">{session.time}</bdi>
                        </small>
                      </span>
                    </td>
                    <td>
                      {session.attendance ? (
                        <span className="academic-attendance-ratio">
                          <strong>
                            {session.attendance.present +
                              session.attendance.late}
                          </strong>{" "}
                          / {session.students}
                          <small>{presentRate(session)}%</small>
                        </span>
                      ) : (
                        <span className="academic-not-recorded">
                          لم يُسجّل بعد
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`academic-session-status ${session.status}`}
                      >
                        {statusLabels[session.status]}
                      </span>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="academic-empty">
                        <Search size={18} />
                        <strong>لا توجد جلسات مطابقة</strong>
                        <button
                          onClick={() => {
                            setQuery("");
                            setStatusFilter("all");
                          }}
                        >
                          مسح الفلاتر
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="academic-table-footer">
            <span>
              <ShieldCheck size={13} /> مراجعة أكاديمية ضمن فرع {branch}
            </span>
            <span>لا يوجد تعديل على الجدول</span>
          </div>
        </section>
        <SessionDetail session={selectedSession} statusLabels={statusLabels} />
      </div>
    </>
  );
}

function SessionDetail({
  session,
  statusLabels,
}: {
  session: SessionRecord;
  statusLabels: Record<SessionStatus, string>;
}) {
  const attendance = session.attendance;
  const items = attendance
    ? [
        { label: "حاضر", value: attendance.present, className: "present" },
        { label: "متأخر", value: attendance.late, className: "late" },
        { label: "غائب", value: attendance.absent, className: "absent" },
        { label: "بعذر", value: attendance.excused, className: "excused" },
      ]
    : [];
  return (
    <aside className="academic-panel academic-session-detail">
      <div className="academic-detail-kicker">
        تفاصيل الجلسة <small dir="ltr">{session.id}</small>
      </div>
      <div className="academic-detail-icon">
        <BookOpen size={20} />
      </div>
      <h3>{session.courseName}</h3>
      <p>{session.groupName}</p>
      <span className={`academic-session-status ${session.status}`}>
        {statusLabels[session.status]}
      </span>
      <div className="academic-detail-list">
        <div>
          <span>المدرب</span>
          <strong>{session.instructor}</strong>
        </div>
        <div>
          <span>التاريخ</span>
          <strong>{session.dateLabel}</strong>
        </div>
        <div>
          <span>الوقت</span>
          <strong dir="ltr">{session.time}</strong>
        </div>
        <div>
          <span>المكان</span>
          <strong>{session.room}</strong>
        </div>
        <div>
          <span>المجموعة</span>
          <strong dir="ltr">{session.offeringId}</strong>
        </div>
      </div>
      <div className="academic-attendance-breakdown">
        <div className="academic-breakdown-heading">
          <strong>ملخص تسجيل الحضور</strong>
          <small>{attendance ? `${session.students} طلاب` : "لم يُسجّل"}</small>
        </div>
        {attendance ? (
          items.map(item => (
            <div className="academic-attendance-line" key={item.className}>
              <span>
                <i className={item.className} />
                {item.label}
              </span>
              <strong>{item.value}</strong>
            </div>
          ))
        ) : (
          <div className="academic-attendance-empty">
            <Clock3 size={14} /> ستظهر تفاصيل الحضور بعد التسجيل
          </div>
        )}
      </div>
      {session.status === "pending_approval" && (
        <div className="academic-session-hint">
          <AlertCircle size={14} />
          <span>
            حالة الجلسة تشير إلى مراجعة التسجيل. أي اعتماد رسمي خارج نطاق هذه
            المعاينة.
          </span>
        </div>
      )}
      <div className="academic-detail-local-note">
        <ShieldCheck size={13} /> للعرض فقط · لا يمكن تعديل السجل هنا
      </div>
    </aside>
  );
}

export function HeadInstructorsEvaluationsView({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  evaluations,
  reviewedIds,
  onOpen,
  allEvaluations,
  cardStatusLabels,
}: {
  query: string;
  setQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  evaluations: EvaluationRecord[];
  reviewedIds: string[];
  onOpen: (id: string) => void;
  allEvaluations: EvaluationRecord[];
  cardStatusLabels: Record<EvaluationCardStatus, string>;
}) {
  return (
    <>
      <section className="academic-review-summary">
        <div>
          <span className="academic-panel-kicker">
            التقييمات الأكاديمية · بيانات توضيحية
          </span>
          <h2>متابعة تقدّم الطلاب</h2>
          <p>
            استعرض درجات المعايير وملاحظات المدرب، وسجّل الاطلاع محليًا عند
            الانتهاء.
          </p>
        </div>
        <div className="academic-review-summary-stats">
          <span>
            <strong>{allEvaluations.length}</strong>
            <small>نماذج تقييم</small>
          </span>
          <span>
            <strong>
              {
                allEvaluations.filter(item => item.cardStatus === "ready")
                  .length
              }
            </strong>
            <small>بطاقات جاهزة</small>
          </span>
          <span>
            <strong>
              {
                allEvaluations.filter(item => item.cardStatus !== "ready")
                  .length
              }
            </strong>
            <small>بطاقات قيد التجهيز</small>
          </span>
        </div>
      </section>
      <section className="academic-panel academic-evaluation-workspace">
        <div className="academic-panel-heading">
          <div>
            <span className="academic-panel-kicker">
              المعيار مأخوذ من نموذج التقييم
            </span>
            <h2>
              قائمة تقييمات الطلاب <small>{evaluations.length} نتائج</small>
            </h2>
          </div>
          <div className="academic-rubric-note">
            <Star size={13} /> ٣ معايير · كل معيار من ٥
          </div>
        </div>
        <div className="academic-filter-row">
          <label className="academic-search">
            <Search size={15} />
            <input
              aria-label="بحث في التقييمات"
              placeholder="ابحث باسم الطالب أو المجموعة..."
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
          </label>
          <label className="academic-filter-select">
            <span>حالة البطاقة</span>
            <select
              aria-label="تصفية التقييمات حسب حالة البطاقة"
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
            >
              <option value="all">كل الحالات</option>
              {Object.entries(cardStatusLabels).map(([key, label]) => (
                <option value={key} key={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="academic-evaluation-list academic-evaluation-list-full">
          {evaluations.map(evaluation => (
            <EvaluationCard
              key={evaluation.id}
              evaluation={evaluation}
              reviewed={reviewedIds.includes(evaluation.id)}
              onOpen={() => onOpen(evaluation.id)}
              cardStatusLabels={cardStatusLabels}
            />
          ))}
          {evaluations.length === 0 && (
            <div className="academic-empty">
              <Search size={18} />
              <strong>لا توجد تقييمات مطابقة</strong>
              <button
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                }}
              >
                مسح الفلاتر
              </button>
            </div>
          )}
        </div>
        <div className="academic-table-footer">
          <span>
            <ShieldCheck size={13} /> «تم الاطلاع» حالة محلية للاستخدام خلال
            المعاينة فقط
          </span>
          <span>لا يوجد تعديل على درجات الطلاب</span>
        </div>
      </section>
    </>
  );
}
