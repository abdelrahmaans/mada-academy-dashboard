/**
 * HeadInstructorsPreviewSubViews.tsx
 * Extracted Sub-Views for Head Instructors (R03) Preview:
 * - OverviewView (Metrics, attendance trend chart, mini coach cards, today's sessions, evaluations widget)
 * - TeamView (Supervised coaches list, groups catalog, operational stats)
 * - AttendanceApprovalsView (Attendance approval review queue, student roster details, local decision history)
 */

import { useState, useMemo, useEffect } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpLeft,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  Clock3,
  Eye,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import { EmptyState, LockedState } from "@/components/FeedbackStates";
import InstructorPerformanceComparison from "@/components/InstructorPerformanceComparison";
import { EvaluationCard } from "@/components/HeadInstructorsPreviewViews";
import {
  type WorkspaceView,
  type SessionRecord,
  type AttendanceDecision,
  type AttendanceEntry,
  BRANCH,
  HEAD_OF_INSTRUCTORS,
  COACHES,
  SESSIONS,
  EVALUATIONS,
  ATTENDANCE_TREND,
  SESSION_STATUS_LABELS,
  CARD_STATUS_LABELS,
  formatDate,
  presentRate,
} from "@/pages/HeadInstructorsTypes";

export function ArrowRightSafe() {
  return <ArrowLeft size={15} />;
}

export function OverviewView({
  onNavigate,
  onOpenEvaluation,
  reviewedIds,
  completedSessions,
  todaySessions,
  pendingReviewSessions,
  decisionHistory,
  averageScore,
  readyEvaluationCount,
  followUpEvaluationCount,
  liveMode,
  branch,
}: {
  onNavigate: (view: WorkspaceView) => void;
  onOpenEvaluation: (id: string) => void;
  reviewedIds: string[];
  completedSessions: SessionRecord[];
  todaySessions: SessionRecord[];
  pendingReviewSessions: SessionRecord[];
  decisionHistory: AttendanceDecision[];
  averageScore: string;
  readyEvaluationCount: number;
  followUpEvaluationCount: number;
  liveMode: boolean;
  branch: string;
}) {
  const avgSessionAttendance = Math.round(
    completedSessions.reduce(
      (sum, session) => sum + (presentRate(session) ?? 0),
      0
    ) / Math.max(1, completedSessions.length)
  );
  const activeCoachCount = COACHES.filter(
    coach => coach.status === "active"
  ).length;
  const groupCount = COACHES.reduce(
    (total, coach) => total + coach.groups.length,
    0
  );
  const stats = [
    {
      label: "مدربون نشطون",
      value: String(activeCoachCount),
      note: "ضمن نطاق الفرع",
      icon: Users,
      tone: "teal",
      view: "team" as const,
    },
    {
      label: "مجموعات أتابعها",
      value: String(groupCount),
      note: "مجموعات توضيحية",
      icon: BookOpen,
      tone: "blue",
      view: "team" as const,
    },
    {
      label: "حصص مكتملة",
      value: String(completedSessions.length),
      note: "في العينة الحالية",
      icon: CalendarCheck,
      tone: "violet",
      view: "sessions" as const,
    },
    {
      label: "متوسط الحضور",
      value: `${avgSessionAttendance}%`,
      note: "للحضور المسجل بالعينة",
      icon: Activity,
      tone: "amber",
      view: "sessions" as const,
    },
  ];
  return (
    <>
      <section className="academic-stats-grid">
        {stats.map(item => {
          const Icon = item.icon;
          return (
            <button
              className={`academic-stat-card stat-${item.tone}`}
              key={item.label}
              onClick={() => onNavigate(item.view)}
            >
              <span className="academic-stat-icon">
                <Icon size={18} />
              </span>
              <small>{item.label}</small>
              <strong>{item.value}</strong>
              <span className="academic-stat-note">
                {item.note}
                <ChevronLeft size={12} />
              </span>
            </button>
          );
        })}
      </section>
      <section className="academic-approval-shortcut">
        <span className="academic-approval-shortcut-icon">
          <ClipboardCheck size={18} />
        </span>
        <div className="academic-approval-shortcut-copy">
          <small>مراجعة تسجيل الحضور</small>
          <strong>
            {pendingReviewSessions.length
              ? `${pendingReviewSessions.length} حصص بانتظار الاعتماد`
              : "لا توجد طلبات حضور معلقة"}
          </strong>
          <span>
            {decisionHistory[0]
              ? `آخر قرار: ${decisionHistory[0].decision === "approved" ? "اعتماد" : "إعادة للمدرب"} · ${decisionHistory[0].courseName}`
              : "افحص سجل الطلاب والملاحظات قبل اتخاذ القرار."}
          </span>
        </div>
        <button
          className="academic-secondary-button"
          onClick={() => onNavigate("approvals")}
        >
          فتح قائمة الاعتماد
          {pendingReviewSessions.length > 0 && (
            <b>{pendingReviewSessions.length}</b>
          )}
          <ChevronLeft size={14} />
        </button>
      </section>

      <div className="academic-overview-grid">
        <section className="academic-panel academic-trend-panel">
          <div className="academic-panel-heading">
            <div>
              <span className="academic-panel-kicker">
                مؤشر المتابعة · آخر ٧ أيام
              </span>
              <h2>انتظام حضور الحصص</h2>
              <p>متوسط حضور توضيحي من الجلسات المكتملة في العينة</p>
            </div>
            <div className="academic-trend-total">
              <strong>{avgSessionAttendance}%</strong>
              <span>
                <ArrowUpLeft size={13} /> مقارنة بالعينة السابقة
              </span>
            </div>
          </div>
          <div
            className="academic-chart"
            role="img"
            aria-label="مؤشر حضور توضيحي لآخر سبعة أيام"
          >
            <div className="academic-chart-axis">
              <span>١٠٠٪</span>
              <span>٧٥٪</span>
              <span>٥٠٪</span>
              <span>٢٥٪</span>
            </div>
            <div className="academic-chart-columns">
              {ATTENDANCE_TREND.map((item, index) => (
                <div className="academic-chart-column" key={item.label}>
                  <span className="academic-chart-value">{item.value}%</span>
                  <div className="academic-chart-track">
                    <i
                      style={{
                        height: `${item.value}%`,
                        animationDelay: `${index * 35}ms`,
                      }}
                    />
                  </div>
                  <small>{item.label}</small>
                </div>
              ))}
            </div>
          </div>
          <div className="academic-chart-footer">
            <span>
              <i className="academic-chart-legend" /> حضور مسجل
            </span>
            <button onClick={() => onNavigate("sessions")}>
              تفاصيل الجلسات <ChevronLeft size={13} />
            </button>
          </div>
        </section>

        <section className="academic-panel academic-coach-panel">
          <div className="academic-panel-heading">
            <div>
              <span className="academic-panel-kicker">ضمن نطاق الفرع</span>
              <h2>متابعة المدربين</h2>
              <p>بيانات تشغيلية توضيحية</p>
            </div>
            <button
              className="academic-text-link"
              onClick={() => onNavigate("team")}
            >
              عرض الفريق <ChevronLeft size={14} />
            </button>
          </div>
          <div className="academic-coach-overview-list">
            {COACHES.map(coach => (
              <article className="academic-coach-overview-item" key={coach.id}>
                <button
                  className="academic-coach-mini-profile"
                  onClick={() => onNavigate("team")}
                >
                  <span className="academic-coach-avatar">
                    {coach.initials}
                  </span>
                  <span className="academic-coach-main">
                    <strong>{coach.name}</strong>
                    <small>
                      {coach.role} · {coach.groups.length} مجموعات
                    </small>
                  </span>
                  <span className="academic-coach-online">
                    <i /> {coach.status === "active" ? "نشط" : "في إجازة"}
                  </span>
                  <ChevronLeft size={14} />
                </button>
                <div className="academic-coach-compact-metrics">
                  <span>
                    <b>{coach.sessionsThisWeek}</b> حصص هذا الأسبوع
                  </span>
                  <span>
                    <b>{coach.attendanceRate}%</b> انتظام الحضور
                  </span>
                  <span>
                    <b>{coach.evaluationRate}%</b> اكتمال التقييم
                  </span>
                </div>
                <div className="academic-group-chips">
                  {coach.groups.map(group => (
                    <span key={group}>
                      <BookOpen size={12} />
                      {group}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <InstructorPerformanceComparison scope="branch" branch={branch} />

      <div className="academic-overview-grid academic-overview-lower">
        <section className="academic-panel academic-today-panel">
          <div className="academic-panel-heading">
            <div>
              <span className="academic-panel-kicker">السبت · ٢٦ سبتمبر</span>
              <h2>
                جلسات اليوم <small>{todaySessions.length} جلسات</small>
              </h2>
            </div>
            <button
              className="academic-text-link"
              onClick={() => onNavigate("sessions")}
            >
              كل الجلسات <ChevronLeft size={14} />
            </button>
          </div>
          <div className="academic-today-list">
            {todaySessions.map(session => (
              <button
                className="academic-today-row"
                key={session.id}
                onClick={() => onNavigate("sessions")}
              >
                <span className="academic-today-time">
                  <Clock3 size={13} />
                  {session.time.split("–")[0].trim()}
                </span>
                <span className="academic-today-course">
                  <strong>{session.courseName}</strong>
                  <small>
                    {session.groupName} · {session.room}
                  </small>
                </span>
                <span className={`academic-session-status ${session.status}`}>
                  {SESSION_STATUS_LABELS[session.status]}
                </span>
                <ChevronLeft size={14} />
              </button>
            ))}
          </div>
          <div className="academic-panel-footer">
            <span>
              <Users size={13} /> {COACHES.length} مدربين في المعاينة
            </span>
            <span>بيانات محلية</span>
          </div>
        </section>

        {liveMode ? (
          <section className="academic-panel academic-evaluation-panel">
            <div className="academic-panel-heading">
              <div>
                <span className="academic-panel-kicker">
                  تقييمات حية · من API
                </span>
                <h2>مراجعة واعتماد التقييمات</h2>
                <p>
                  لا تُعرض درجات تجريبية هنا. افتح قائمة المراجعة للاطلاع على
                  تقييمات المدربين الفعلية.
                </p>
              </div>
              <button
                className="academic-review-count"
                onClick={() => onNavigate("evaluations")}
              >
                <span>LIVE</span>
                <small>قائمة المراجعة</small>
                <ChevronLeft size={13} />
              </button>
            </div>
            <div className="academic-panel-footer">
              <span>
                <ShieldCheck size={13} /> لا تظهر النتائج للمستهلك حتى النشر.
              </span>
              <button onClick={() => onNavigate("evaluations")}>
                فتح المراجعات <ChevronLeft size={13} />
              </button>
            </div>
          </section>
        ) : (
          <section className="academic-panel academic-evaluation-panel">
            <div className="academic-panel-heading">
              <div>
                <span className="academic-panel-kicker">
                  متابعة جودة التعلّم
                </span>
                <h2>آخر التقييمات</h2>
                <p>
                  متوسط الدرجات التوضيحي{" "}
                  <b>
                    <Star size={12} fill="currentColor" />
                    {averageScore} / ٥
                  </b>
                </p>
              </div>
              <button
                className="academic-review-count"
                onClick={() => onNavigate("evaluations")}
              >
                <span>{followUpEvaluationCount}</span>
                <small>تحتاج متابعة</small>
                <ChevronLeft size={13} />
              </button>
            </div>
            <div className="academic-evaluation-list">
              {EVALUATIONS.slice(0, 3).map(evaluation => (
                <EvaluationCard
                  key={evaluation.id}
                  evaluation={evaluation}
                  reviewed={reviewedIds.includes(evaluation.id)}
                  onOpen={() => onOpenEvaluation(evaluation.id)}
                  cardStatusLabels={CARD_STATUS_LABELS}
                />
              ))}
            </div>
            <div className="academic-panel-footer">
              <span>
                <CheckCircle2 size={13} /> {readyEvaluationCount} بطاقات جاهزة
              </span>
              <button onClick={() => onNavigate("evaluations")}>
                مراجعة التقييمات <ChevronLeft size={13} />
              </button>
            </div>
          </section>
        )}
      </div>

      <section className="academic-action-strip">
        <div>
          <span className="academic-action-spark">
            <Sparkles size={16} />
          </span>
          <span>
            <strong>الخطوة التالية</strong>
            <small>
              {pendingReviewSessions.length
                ? "راجع تسجيل حضور الجلسة قيد المراجعة."
                : "تابع اكتمال تقييمات الأسبوع."}
            </small>
          </span>
        </div>
        <div className="academic-action-buttons">
          <button
            className="academic-secondary-button"
            onClick={() => onNavigate("evaluations")}
          >
            <ClipboardCheck size={15} /> متابعة التقييمات{" "}
            <b>{liveMode ? "LIVE" : followUpEvaluationCount}</b>
          </button>
          <button
            className="academic-primary-button"
            onClick={() => onNavigate("sessions")}
          >
            <CalendarDays size={15} /> جدول الحصص
          </button>
        </div>
      </section>
    </>
  );
}

export function TeamView({
  onNavigate,
}: {
  onNavigate: (view: WorkspaceView) => void;
}) {
  return (
    <>
      <section className="academic-team-summary">
        <div>
          <span className="academic-panel-kicker">نطاق إشراف مريم حسن</span>
          <h2>فريق المدربين في {BRANCH}</h2>
          <p>
            المدربون المعيّنون لهذا الفرع فقط. الأرقام والنسب في هذه الواجهة
            توضيحية.
          </p>
        </div>
        <div className="academic-team-total">
          <strong>
            {COACHES.filter(coach => coach.status === "active").length}
          </strong>
          <span>مدربون نشطون</span>
        </div>
      </section>
      <section className="academic-panel academic-team-table-panel">
        <div className="academic-panel-heading">
          <div>
            <span className="academic-panel-kicker">
              الأعضاء المرتبطون بدور رئيس المدربين
            </span>
            <h2>
              فريق العمل الأكاديمي <small>{COACHES.length} أعضاء</small>
            </h2>
          </div>
          <button
            className="academic-secondary-button"
            onClick={() => onNavigate("sessions")}
          >
            <CalendarCheck size={15} /> تغطية الحصص
          </button>
        </div>
        {COACHES.map(coach => (
          <div className="academic-coach-team-block" key={coach.id}>
            <div className="academic-coach-profile-card">
              <span className="academic-coach-avatar large">
                {coach.initials}
              </span>
              <div className="academic-coach-profile-main">
                <strong>{coach.name}</strong>
                <small>
                  {coach.role} · رقم الموظف <bdi dir="ltr">{coach.id}</bdi>
                </small>
                <span className="academic-coach-online">
                  <i /> {coach.status === "active" ? "نشط" : "في إجازة"}
                </span>
              </div>
              <div className="academic-team-stat">
                <small>مجموعات التدريس</small>
                <strong>{coach.groups.length}</strong>
              </div>
              <div className="academic-team-stat">
                <small>حصص هذا الأسبوع</small>
                <strong>{coach.sessionsThisWeek}</strong>
              </div>
              <div className="academic-team-stat">
                <small>الحضور المسجل</small>
                <strong>{coach.attendanceRate}%</strong>
              </div>
              <button
                className="academic-icon-button"
                aria-label={`عرض حصص ${coach.name}`}
                onClick={() => onNavigate("sessions")}
              >
                <ArrowUpLeft size={16} />
              </button>
            </div>
            <div className="academic-group-list-heading">
              <strong>المجموعات الأكاديمية · {coach.name}</strong>
              <span>{coach.groups.length} مجموعات توضيحية</span>
            </div>
            <div className="academic-group-list">
              {coach.groups.map((group, index) => {
                const groupSession = SESSIONS.find(
                  session =>
                    session.instructor === coach.name &&
                    session.courseName === group
                );
                return (
                  <button key={group} onClick={() => onNavigate("sessions")}>
                    <span className={`academic-group-icon tone-${index % 3}`}>
                      <BookOpen size={16} />
                    </span>
                    <span>
                      <strong>{group}</strong>
                      <small>{groupSession?.groupName ?? "مجموعة موضحة"}</small>
                    </span>
                    <span className="academic-group-next">
                      {groupSession?.dateLabel ?? "هذا الأسبوع"}
                      <small>{groupSession?.time ?? "حسب الجدول"}</small>
                    </span>
                    <ChevronLeft size={14} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>
      <LockedState
        className="academic-permission-note"
        compact
        title="إدارة الحسابات خارج نطاق R03"
        description="إدارة الدور أو حالة الموظف تظل ضمن صلاحيات مدير الفرع."
        action={
          <button type="button" onClick={() => window.location.assign("/team")}>
            إدارة الفريق <ArrowUpLeft size={13} />
          </button>
        }
      />
    </>
  );
}

export function AttendanceApprovalsView({
  sessions,
  allSessions,
  history,
  resolvedIds,
  selectedSessionId,
  onSelectSession,
  onDecision,
  onReopen,
}: {
  sessions: SessionRecord[];
  allSessions: SessionRecord[];
  history: AttendanceDecision[];
  resolvedIds: string[];
  selectedSessionId: string;
  onSelectSession: (id: string) => void;
  onDecision: (
    session: SessionRecord,
    decision: AttendanceDecision["decision"],
    note: string
  ) => void;
  onReopen: (sessionId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [instructorFilter, setInstructorFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const filteredSessions = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ar");
    return sessions.filter(session => {
      const matchesSearch = [
        session.courseName,
        session.groupName,
        session.instructor,
        session.id,
      ].some(value => value.toLocaleLowerCase("ar").includes(needle));
      const matchesInstructor =
        instructorFilter === "all" || session.instructor === instructorFilter;
      const matchesFrom = !dateFrom || session.date >= dateFrom;
      const matchesTo = !dateTo || session.date <= dateTo;
      return matchesSearch && matchesInstructor && matchesFrom && matchesTo;
    });
  }, [dateFrom, dateTo, instructorFilter, query, sessions]);
  const selectedSession =
    filteredSessions.find(session => session.id === selectedSessionId) ??
    filteredSessions[0] ??
    null;
  useEffect(() => {
    setDecisionNote("");
  }, [selectedSession?.id]);
  const filteredHistory = useMemo(
    () =>
      history.filter(item => {
        const matchesInstructor =
          instructorFilter === "all" || item.instructor === instructorFilter;
        const matchesFrom = !dateFrom || item.sessionDate >= dateFrom;
        const matchesTo = !dateTo || item.sessionDate <= dateTo;
        return matchesInstructor && matchesFrom && matchesTo;
      }),
    [dateFrom, dateTo, history, instructorFilter]
  );
  const instructorOptions = COACHES.map(coach => coach.name);
  const approvedCount = filteredHistory.filter(
    item => item.decision === "approved"
  ).length;
  const returnedCount = filteredHistory.filter(
    item => item.decision === "returned"
  ).length;
  const statusLabels: Record<AttendanceEntry["status"], string> = {
    present: "حاضر",
    late: "متأخر",
    absent: "غائب",
    excused: "بعذر",
  };

  return (
    <>
      <section className="academic-approval-summary">
        <div>
          <span className="academic-panel-kicker">
            مراجعة أكاديمية · فرع {BRANCH}
          </span>
          <h2>اعتماد تسجيل الحضور</h2>
          <p>
            راجع أسماء الطلاب والحالات وملاحظة المدرب، ثم اعتمد السجل أو أعده
            للتصحيح. كل القرارات في هذه المعاينة محلية.
          </p>
        </div>
        <div className="academic-approval-summary-stats">
          <span className="waiting">
            <strong>{filteredSessions.length}</strong>
            <small>بانتظار المراجعة</small>
          </span>
          <span className="approved">
            <strong>{approvedCount}</strong>
            <small>قرارات اعتماد</small>
          </span>
          <span className="returned">
            <strong>{returnedCount}</strong>
            <small>إعادات للمدرب</small>
          </span>
        </div>
      </section>

      <div className="academic-approval-layout">
        <section className="academic-panel academic-approval-queue">
          <div className="academic-panel-heading">
            <div>
              <span className="academic-panel-kicker">قائمة المراجعة</span>
              <h2>
                طلبات الحضور <small>{filteredSessions.length} طلبات</small>
              </h2>
            </div>
          </div>
          <label className="academic-search academic-approval-search">
            <Search size={15} />
            <input
              aria-label="بحث في طلبات الحضور"
              placeholder="ابحث باسم المدرب أو المجموعة..."
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
          </label>
          <div className="academic-approval-filters">
            <label>
              <span>المدرب</span>
              <select
                aria-label="تصفية طلبات الحضور حسب المدرب"
                value={instructorFilter}
                onChange={event => setInstructorFilter(event.target.value)}
              >
                <option value="all">كل مدربي الفرع</option>
                {instructorOptions.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>تاريخ الحصة من</span>
              <input
                aria-label="تصفية الحضور من تاريخ"
                type="date"
                value={dateFrom}
                onChange={event => setDateFrom(event.target.value)}
              />
            </label>
            <label>
              <span>تاريخ الحصة إلى</span>
              <input
                aria-label="تصفية الحضور إلى تاريخ"
                type="date"
                value={dateTo}
                onChange={event => setDateTo(event.target.value)}
              />
            </label>
            {(instructorFilter !== "all" || dateFrom || dateTo || query) && (
              <button
                className="academic-approval-clear-filters"
                onClick={() => {
                  setInstructorFilter("all");
                  setDateFrom("");
                  setDateTo("");
                  setQuery("");
                }}
              >
                مسح الفلاتر
              </button>
            )}
          </div>
          <div className="academic-approval-request-list">
            {filteredSessions.map(session => (
              <button
                className={`academic-approval-request ${selectedSession?.id === session.id ? "selected" : ""}`}
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  setDecisionNote("");
                }}
              >
                <span className="academic-approval-request-icon">
                  <ClipboardCheck size={16} />
                </span>
                <span className="academic-approval-request-main">
                  <strong>{session.courseName}</strong>
                  <small>{session.groupName}</small>
                  <small>
                    <UserRound size={11} /> {session.instructor}
                  </small>
                </span>
                <span className="academic-approval-request-meta">
                  <b>{formatDate(session.date)}</b>
                  <small>{session.attendance?.present ?? 0} حاضر</small>
                  <i />
                </span>
              </button>
            ))}
            {filteredSessions.length === 0 && (
              <EmptyState
                className="academic-approval-empty"
                title={
                  sessions.length === 0
                    ? "اكتملت مراجعة كل الطلبات"
                    : "لا توجد طلبات مطابقة"
                }
                description={
                  sessions.length === 0
                    ? "يمكنك مراجعة قراراتك السابقة في سجل القرارات أدناه."
                    : "جرّب كلمة بحث أخرى أو امسح البحث."
                }
                action={
                  query ? (
                    <button type="button" onClick={() => setQuery("")}>
                      مسح البحث
                    </button>
                  ) : undefined
                }
              />
            )}
          </div>
          <div className="academic-table-footer">
            <span>
              <ShieldCheck size={13} /> طلبات هذا الفرع فقط · بيانات توضيحية
            </span>
          </div>
        </section>

        {selectedSession ? (
          <section className="academic-panel academic-approval-detail">
            <div className="academic-approval-detail-top">
              <div className="academic-detail-icon">
                <CalendarCheck size={19} />
              </div>
              <div>
                <span className="academic-panel-kicker">
                  تفاصيل طلب · <bdi dir="ltr">{selectedSession.id}</bdi>
                </span>
                <h2>{selectedSession.courseName}</h2>
                <p>
                  {selectedSession.groupName} · {selectedSession.dateLabel} ·{" "}
                  <bdi dir="ltr">{selectedSession.time}</bdi>
                </p>
              </div>
              <span className="academic-session-status pending_approval">
                بانتظار الاعتماد
              </span>
            </div>
            <div className="academic-approval-coach-note">
              <span>
                <MessageCircle size={14} /> ملاحظة المدرب ·{" "}
                {selectedSession.instructor}
              </span>
              <p>
                {selectedSession.instructorNote ??
                  "لا توجد ملاحظة إضافية مرفقة بهذا التسجيل."}
              </p>
            </div>
            <div className="academic-approval-roster-heading">
              <span>
                <Users size={15} /> سجل الطلاب
              </span>
              <strong>
                {selectedSession.attendance?.present ?? 0} حاضر ·{" "}
                {selectedSession.attendance?.late ?? 0} متأخر ·{" "}
                {selectedSession.attendance?.absent ?? 0} غائب ·{" "}
                {selectedSession.attendance?.excused ?? 0} بعذر
              </strong>
            </div>
            <div className="academic-approval-roster">
              {(selectedSession.attendanceEntries ?? []).map(entry => (
                <div
                  className="academic-approval-student"
                  key={entry.studentId}
                >
                  <span className="academic-approval-student-avatar">
                    {entry.student.slice(0, 1)}
                  </span>
                  <span className="academic-approval-student-main">
                    <strong>{entry.student}</strong>
                    <small>
                      <bdi dir="ltr">{entry.studentId}</bdi>
                      {entry.note ? ` · ${entry.note}` : ""}
                    </small>
                  </span>
                  <span
                    className={`academic-approval-attendance ${entry.status}`}
                  >
                    {entry.status === "late" && entry.lateMinutes
                      ? `${statusLabels[entry.status]} ${entry.lateMinutes} د`
                      : statusLabels[entry.status]}
                  </span>
                </div>
              ))}
              {!selectedSession.attendanceEntries?.length && (
                <div className="academic-approval-no-roster">
                  لا توجد تفاصيل طلاب إضافية في سجل هذه الجلسة.
                </div>
              )}
            </div>
            <label className="academic-approval-note-input">
              <span>ملاحظة المراجعة {" · "} مطلوبة عند الإعادة</span>
              <textarea
                aria-label="ملاحظة قرار مراجعة الحضور"
                placeholder="مثال: يرجى توضيح سبب الغياب قبل إعادة الإرسال..."
                rows={3}
                value={decisionNote}
                onChange={event => setDecisionNote(event.target.value)}
              />
            </label>
            <div className="academic-approval-actions">
              <button
                className="academic-secondary-button return"
                disabled={!decisionNote.trim()}
                onClick={() =>
                  onDecision(selectedSession, "returned", decisionNote)
                }
              >
                <ArrowDownLeft size={15} /> إعادة للمدرب
              </button>
              <button
                className="academic-primary-button approve"
                onClick={() =>
                  onDecision(selectedSession, "approved", decisionNote)
                }
              >
                <Check size={15} /> اعتماد الحضور
              </button>
            </div>
            <div className="academic-approval-local-note">
              <AlertCircle size={13} /> اعتماد توضيحي محلي؛ لا يرسل إشعارًا ولا
              يغيّر سجل الحضور الفعلي.
            </div>
          </section>
        ) : (
          <section className="academic-panel academic-approval-no-selection">
            <CheckCircle2 size={26} />
            <h2>كل الطلبات في هذه القائمة تمت مراجعتها</h2>
            <p>
              افتح سجل القرارات أدناه إذا أردت إعادة طلب إلى قائمة المراجعة.
            </p>
          </section>
        )}
      </div>

      <section className="academic-panel academic-approval-history-panel">
        <div className="academic-panel-heading">
          <div>
            <span className="academic-panel-kicker">
              سجل محلي · خلال المعاينة الحالية
            </span>
            <h2>
              سجل قرارات مراجعة الحضور{" "}
              <small>{filteredHistory.length} قرار</small>
            </h2>
          </div>
          <span className="academic-approval-history-scope">
            <ShieldCheck size={13} /> {HEAD_OF_INSTRUCTORS} · {BRANCH}
          </span>
        </div>
        {filteredHistory.length > 0 ? (
          <div className="academic-approval-history-list">
            {filteredHistory.map(item => {
              const session = allSessions.find(
                candidate => candidate.id === item.sessionId
              );
              const resolved = resolvedIds.includes(item.sessionId);
              return (
                <article
                  className="academic-approval-history-row"
                  key={item.id}
                >
                  <span
                    className={`academic-approval-history-icon ${item.decision}`}
                  >
                    {item.decision === "approved" ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <ArrowDownLeft size={16} />
                    )}
                  </span>
                  <div className="academic-approval-history-main">
                    <strong>
                      {item.decision === "approved"
                        ? "تم اعتماد الحضور"
                        : "أُعيد التسجيل إلى المدرب"}
                      <small>{item.courseName}</small>
                    </strong>
                    <span>
                      {item.instructor} · {item.groupName} · بواسطة {item.actor}
                    </span>
                    {item.note && <p>{item.note}</p>}
                  </div>
                  <time>
                    {formatDate(item.sessionDate)} · {item.decidedAt}
                  </time>
                  {session && (
                    <button
                      className="academic-reopen-approval"
                      disabled={!resolved}
                      onClick={() => onReopen(item.sessionId)}
                    >
                      <Eye size={13} />
                      {resolved ? "إعادة للمراجعة" : "مفتوح للمراجعة"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="academic-approval-history-empty">
            <Clock3 size={17} />
            <span>
              {history.length > 0
                ? "لا توجد قرارات مطابقة لفلاتر المدرب والتاريخ."
                : "ستظهر هنا قرارات الاعتماد والإعادة بعد اتخاذها."}
            </span>
          </div>
        )}
        <div className="academic-table-footer">
          <span>
            <ShieldCheck size={13} /> السجل لا يُحفظ بعد إغلاق المعاينة المحلية
          </span>
          <span>لا يوجد اتصال بخدمة اعتماد فعلية</span>
        </div>
      </section>
    </>
  );
}
