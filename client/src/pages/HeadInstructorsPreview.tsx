import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ClipboardCheck,
  Eye,
  FileCheck2,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageCircle,
  ShieldCheck,
  Users,
  X,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import AuditTimeline, { type AuditEvent } from "@/components/AuditTimeline";
import EvaluationReviewQueue from "@/components/EvaluationReviewQueue";
import ReasonField from "@/components/ReasonField";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import WorkflowStepper from "@/components/WorkflowStepper";
import { apiClient } from "@/lib/apiClient";
import RubricsManagementView from "@/components/RubricsManagementView";
import {
  HeadInstructorsEvaluationsView,
  HeadInstructorsSessionsView,
} from "@/components/HeadInstructorsPreviewViews";
import {
  OverviewView,
  TeamView,
  AttendanceApprovalsView,
  ArrowRightSafe,
} from "@/components/HeadInstructorsPreviewSubViews";
import {
  type WorkspaceView,
  type EvaluationReviewStatus,
  type SessionRecord,
  type AttendanceDecision,
  BRANCH,
  HEAD_OF_INSTRUCTORS,
  VIEW_NAMES,
  VIEW_VALUES,
  SESSION_STATUS_LABELS,
  CARD_STATUS_LABELS,
  RUBRIC,
  COACH,
  SESSIONS,
  EVALUATIONS,
  formatDate,
  presentRate,
} from "./HeadInstructorsTypes";

function MadaMark() {
  return (
    <span className="academic-brand-mark" aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none">
        <path
          d="M4 12.5 12.5 8l8.2 4.5v9.4l-8.2 4.6L4 21.9v-9.4Z"
          fill="currentColor"
        />
        <path
          d="m19.3 12.5 8.2-4.5 8.5 4.5v9.4l-8.5 4.6-8.2-4.6v-9.4Z"
          fill="currentColor"
          opacity=".72"
        />
        <path
          d="m11.5 24.1 8.3-4.6 8.2 4.6v8.2l-8.2 4.4-8.3-4.4v-8.2Z"
          fill="currentColor"
          opacity=".48"
        />
      </svg>
    </span>
  );
}

export default function HeadInstructorsPreview() {
  const [, navigate] = useLocation();
  const liveMode = apiClient.hasSession();
  const sessionSearchRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<WorkspaceView>(() => {
    const requested = new URLSearchParams(window.location.search).get("view");
    return VIEW_VALUES.includes(requested as WorkspaceView)
      ? (requested as WorkspaceView)
      : "overview";
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [decisionHistory, setDecisionHistory] = useState<AttendanceDecision[]>(
    []
  );
  const [resolvedAttendanceIds, setResolvedAttendanceIds] = useState<string[]>(
    []
  );
  const [selectedSessionId, setSelectedSessionId] = useState(SESSIONS[0].id);
  const [selectedApprovalId, setSelectedApprovalId] = useState(
    SESSIONS.find(session => session.status === "pending_approval")?.id ??
      SESSIONS[0].id
  );
  const [sessionQuery, setSessionQuery] = useState("");
  const [sessionStatusFilter, setSessionStatusFilter] = useState("all");
  const [evaluationQuery, setEvaluationQuery] = useState("");
  const [evaluationStatusFilter, setEvaluationStatusFilter] = useState("all");
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<
    string | null
  >(null);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const [evaluationReviewStatuses, setEvaluationReviewStatuses] = useState<
    Record<string, EvaluationReviewStatus>
  >({});
  const [evaluationReviewNote, setEvaluationReviewNote] = useState("");

  const selectedSession =
    SESSIONS.find(session => session.id === selectedSessionId) ?? SESSIONS[0];
  const selectedEvaluation = liveMode
    ? undefined
    : EVALUATIONS.find(evaluation => evaluation.id === selectedEvaluationId);
  const selectedEvaluationReviewStatus = selectedEvaluation
    ? (evaluationReviewStatuses[selectedEvaluation.id] ?? "pending")
    : "pending";
  const evaluationReviewEvents: AuditEvent[] = selectedEvaluation
    ? [
        {
          id: `${selectedEvaluation.id}-submitted`,
          title: "تم إرسال التقييم",
          description: selectedEvaluation.comment,
          actor: selectedEvaluation.instructor,
          timestamp: formatDate(selectedEvaluation.sessionDate),
          tone: "pending" as const,
        },
        ...(selectedEvaluationReviewStatus !== "pending"
          ? [
              {
                id: `${selectedEvaluation.id}-decision`,
                title:
                  selectedEvaluationReviewStatus === "approved"
                    ? "تم اعتماد التقييم"
                    : "مطلوب تعديل",
                description:
                  selectedEvaluationReviewStatus === "approved"
                    ? "التقييم جاهز للمشاركة بعد ربط النظام."
                    : "أُعيد للمدرب مع ملاحظة مراجعة.",
                actor: "رئيس المدربين",
                timestamp: "الآن",
                tone:
                  selectedEvaluationReviewStatus === "approved"
                    ? ("approved" as const)
                    : ("rejected" as const),
              },
            ]
          : []),
      ]
    : [];
  const approvedAttendanceIds = useMemo(
    () =>
      decisionHistory
        .filter(decision => decision.decision === "approved")
        .map(decision => decision.sessionId),
    [decisionHistory]
  );
  const visibleSessions = useMemo(
    () =>
      SESSIONS.map(session =>
        approvedAttendanceIds.includes(session.id) &&
        session.status === "pending_approval"
          ? { ...session, status: "completed" as const }
          : session
      ),
    [approvedAttendanceIds]
  );
  const completedSessions = visibleSessions.filter(
    session => session.status === "completed"
  );
  const todaySessions = visibleSessions.filter(
    session => session.date === "2026-09-26"
  );
  const pendingReviewSessions = visibleSessions.filter(
    session =>
      session.status === "pending_approval" &&
      !resolvedAttendanceIds.includes(session.id)
  );
  const readyEvaluationCount = EVALUATIONS.filter(
    evaluation => evaluation.cardStatus === "ready"
  ).length;
  const followUpEvaluationCount = EVALUATIONS.filter(
    evaluation => evaluation.cardStatus !== "ready"
  ).length;
  const averageScore = (
    EVALUATIONS.flatMap(evaluation => Object.values(evaluation.scores)).reduce(
      (sum, score) => sum + score,
      0
    ) /
    EVALUATIONS.flatMap(evaluation => Object.values(evaluation.scores)).length
  ).toFixed(1);

  const filteredSessions = useMemo(() => {
    const needle = sessionQuery.trim().toLocaleLowerCase("ar");
    return visibleSessions
      .filter(session => {
        const matchesSearch = [
          session.courseName,
          session.instructor,
          session.room,
          session.offeringId,
          session.id,
        ].some(value => value.toLocaleLowerCase("ar").includes(needle));
        return (
          matchesSearch &&
          (sessionStatusFilter === "all" ||
            session.status === sessionStatusFilter)
        );
      })
      .sort((first, second) =>
        `${first.date} ${first.time}`.localeCompare(
          `${second.date} ${second.time}`
        )
      );
  }, [visibleSessions, sessionQuery, sessionStatusFilter]);
  const filteredEvaluations = useMemo(() => {
    const needle = evaluationQuery.trim().toLocaleLowerCase("ar");
    return EVALUATIONS.filter(evaluation => {
      const matchesSearch = [
        evaluation.student,
        evaluation.studentId,
        evaluation.courseName,
        evaluation.instructor,
      ].some(value => value.toLocaleLowerCase("ar").includes(needle));
      return (
        matchesSearch &&
        (evaluationStatusFilter === "all" ||
          evaluation.cardStatus === evaluationStatusFilter)
      );
    });
  }, [evaluationQuery, evaluationStatusFilter]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (view === "overview") url.searchParams.delete("view");
    else url.searchParams.set("view", view);
    window.history.replaceState({}, "", url);
  }, [view]);

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLocaleLowerCase() === "k"
      ) {
        event.preventDefault();
        setView("sessions");
        requestAnimationFrame(() =>
          requestAnimationFrame(() => sessionSearchRef.current?.focus())
        );
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const goToView = (nextView: WorkspaceView) => {
    setView(nextView);
    setMobileNavOpen(false);
  };
  const openEvaluation = (id: string) => setSelectedEvaluationId(id);
  const decideEvaluation = (
    id: string,
    status: Exclude<EvaluationReviewStatus, "pending">,
    note = ""
  ) => {
    setEvaluationReviewStatuses(current => ({ ...current, [id]: status }));
    setReviewedIds(current =>
      current.includes(id) ? current : [...current, id]
    );
    setEvaluationReviewNote("");
    setSelectedEvaluationId(null);
    toast.success(
      status === "approved" ? "تم اعتماد التقييم" : "أُعيد التقييم للتعديل",
      { description: note || "تم تسجيل القرار محليًا داخل المعاينة." }
    );
  };
  const recordAttendanceDecision = (
    session: SessionRecord,
    decision: AttendanceDecision["decision"],
    note: string
  ) => {
    const decidedAt = new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
    setDecisionHistory(current => [
      {
        id: `DEC-${Date.now()}`,
        sessionId: session.id,
        courseName: session.courseName,
        groupName: session.groupName,
        instructor: session.instructor,
        sessionDate: session.date,
        actor: HEAD_OF_INSTRUCTORS,
        decision,
        note: note.trim(),
        decidedAt,
      },
      ...current,
    ]);
    setResolvedAttendanceIds(current =>
      current.includes(session.id) ? current : [...current, session.id]
    );
    toast.success(
      decision === "approved"
        ? "تم اعتماد الحضور في المعاينة"
        : "تمت إعادة التسجيل للمدرب",
      { description: "القرار والسجل محليان ولا يُحفظان خارج هذه الجلسة." }
    );
  };
  const reopenAttendanceReview = (sessionId: string) => {
    setResolvedAttendanceIds(current => current.filter(id => id !== sessionId));
    toast.success("أُعيد الطلب إلى قائمة المراجعة المحلية", {
      description: "احتفظنا بقرار المراجعة السابق في السجل.",
    });
  };
  const onSessionKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    sessionId: string
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedSessionId(sessionId);
    }
  };

  return (
    <RoleDashboardShell
      className="academic-shell"
      hideSidebar
      roleCode="R03"
      roleLabel="رئيس المدربين"
      scopeLevel="branch"
      scopeLabel="فرع واحد · فريق المدربين والجلسات التابعة"
      branchName={BRANCH}
    >
      <button
        className={`academic-mobile-backdrop ${mobileNavOpen ? "is-open" : ""}`}
        aria-label="إغلاق القائمة"
        onClick={() => setMobileNavOpen(false)}
      />
      <aside className={`academic-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
        <div className="academic-brand">
          <MadaMark />
          <span>مدى</span>
          <small>مساحة رئيس المدربين</small>
        </div>
        <div className="academic-user-card">
          <span className="academic-user-avatar">م</span>
          <span>
            <strong>{HEAD_OF_INSTRUCTORS}</strong>
            <small>رئيس المدربين · {BRANCH}</small>
          </span>
          <ChevronDown size={15} />
        </div>
        <div className="academic-nav-label">الإشراف الأكاديمي</div>
        <nav className="academic-nav" aria-label="التنقل الأكاديمي">
          <button
            className={view === "overview" ? "active" : ""}
            onClick={() => goToView("overview")}
          >
            <LayoutDashboard size={17} />
            <span>ملخص الفريق</span>
          </button>
          <button
            className={view === "team" ? "active" : ""}
            onClick={() => goToView("team")}
          >
            <Users size={17} />
            <span>فريق المدربين</span>
            <b>{COACH.status === "active" ? 1 : 0}</b>
          </button>
          <button
            className={view === "sessions" ? "active" : ""}
            onClick={() => goToView("sessions")}
          >
            <CalendarDays size={17} />
            <span>الحصص والحضور</span>
            <b>{pendingReviewSessions.length}</b>
          </button>
          <button
            className={view === "approvals" ? "active" : ""}
            onClick={() => goToView("approvals")}
          >
            <CheckCircle2 size={17} />
            <span>اعتماد الحضور</span>
            <b>{pendingReviewSessions.length}</b>
          </button>
          <button
            className={view === "evaluations" ? "active" : ""}
            onClick={() => goToView("evaluations")}
          >
            <ClipboardCheck size={17} />
            <span>تقييمات الطلاب</span>
            <b>{liveMode ? "LIVE" : followUpEvaluationCount}</b>
          </button>
          <button
            className={view === "rubrics" ? "active" : ""}
            onClick={() => goToView("rubrics")}
          >
            <Award size={17} />
            <span>بنك معايير التقييم</span>
          </button>
        </nav>
        <div className="academic-sidebar-divider" />
        <button
          className="academic-nav-link"
          onClick={() => navigate("/academic-programs")}
        >
          <BookOpen size={16} />
          <span>إدارة البرامج والمناهج</span>
          <ChevronLeft size={14} />
        </button>
        <button
          className="academic-nav-link"
          onClick={() => navigate("/schedule")}
        >
          <CalendarCheck size={16} />
          <span>جدول الفرع</span>
          <ChevronLeft size={14} />
        </button>
        <button className="academic-nav-link" onClick={() => navigate("/team")}>
          <ShieldCheck size={16} />
          <span>إدارة فريق الفرع</span>
          <ChevronLeft size={14} />
        </button>
        <div className="academic-sidebar-spacer" />
        <div className="academic-branch-card">
          <span>
            <MapPin size={15} />
          </span>
          <div>
            <small>نطاق الإشراف</small>
            <strong>{BRANCH}</strong>
          </div>
          <span className="academic-branch-fixed">ثابت</span>
        </div>
        <button
          className="academic-back-manager"
          onClick={() => navigate("/team")}
        >
          <ArrowRightSafe /> العودة للوحة مدير الفرع
        </button>
        <div className="academic-sidebar-footer">
          <span>مدى لإدارة الأكاديميات</span>
          <b>نسخة تجريبية</b>
        </div>
      </aside>

      <main className="academic-main">
        <header className="academic-topbar">
          <div className="academic-topbar-left">
            <button
              className="academic-icon-button academic-menu-button"
              aria-label="فتح القائمة"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={18} />
            </button>
            <span className="academic-branch-pill">
              <MapPin size={14} /> فرع {BRANCH}
            </span>
            <span className="academic-online">
              <i /> الإشراف الأكاديمي نشط
            </span>
          </div>
          <div className="academic-topbar-right">
            <button
              className="academic-icon-button"
              aria-label="التنبيهات"
              onClick={() => goToView("sessions")}
            >
              <Activity size={16} />
              <i className="academic-notification-dot" />
            </button>
            <span className="academic-topbar-divider" />
            <button
              className="academic-profile"
              onClick={() => goToView("team")}
            >
              <span>
                <strong>{HEAD_OF_INSTRUCTORS}</strong>
                <small>رئيس المدربين</small>
              </span>
              <i>م</i>
              <ChevronDown size={13} />
            </button>
          </div>
        </header>

        <div className="academic-content">
          <div className="academic-breadcrumb">
            <span>الأدوار الأكاديمية</span>
            <ChevronLeft size={13} />
            <b>{VIEW_NAMES[view]}</b>
          </div>
          <section className="academic-welcome">
            <div>
              <span className="academic-eyebrow">
                <i /> قيادة أكاديمية · فرع {BRANCH}
              </span>
              <h1>
                {view === "overview"
                  ? "متابعة الفريق الأكاديمي"
                  : VIEW_NAMES[view]}
              </h1>
              <p>
                {view === "overview"
                  ? "إشراف على أداء المدربين والحصص والتقييمات في نطاق الفرع، مع رفع تقرير المجموعة لمدير الفرع."
                  : "إشراف أكاديمي ضمن الفرع — دون صلاحيات مالية أو إدارية خارج النطاق."}
              </p>
            </div>
            <div className="academic-welcome-actions">
              <span className="academic-date-pill">
                <CalendarDays size={15} /> السبت، ٢٦ سبتمبر ٢٠٢٦
              </span>
              <button
                className="academic-primary-button"
                onClick={() => goToView("sessions")}
              >
                <CalendarCheck size={15} /> متابعة جدول الحصص
              </button>
              <button
                className="academic-secondary-button"
                onClick={() =>
                  toast.success("تم تجهيز تقرير المدربين لمدير الفرع", {
                    description:
                      "التقرير التوضيحي يجمع الحضور والتقييمات ونقاط الدعم.",
                  })
                }
              >
                <FileCheck2 size={15} /> تقرير لمدير الفرع
              </button>
            </div>
          </section>

          <div className="academic-demo-banner">
            <span className="academic-demo-icon">
              <AlertCircle size={15} />
            </span>
            <span>
              {liveMode
                ? "مراجعة التقييمات LIVE من الخادم؛ بقية بيانات الفريق والحصص في هذه الصفحة ما زالت توضيحية."
                : "بيانات الفريق والحصص والتقييمات توضيحية ومحلية. لا يوجد حفظ فعلي أو اعتماد إداري من هذه المعاينة."}
            </span>
            <b>{liveMode ? "LIVE + DEMO" : "DEMO"}</b>
          </div>
          <RoleScopeCard className="academic-role-scope-card" compact />

          {view === "overview" && (
            <OverviewView
              onNavigate={goToView}
              onOpenEvaluation={openEvaluation}
              reviewedIds={reviewedIds}
              completedSessions={completedSessions}
              todaySessions={todaySessions}
              pendingReviewSessions={pendingReviewSessions}
              decisionHistory={decisionHistory}
              averageScore={averageScore}
              readyEvaluationCount={readyEvaluationCount}
              followUpEvaluationCount={followUpEvaluationCount}
              liveMode={liveMode}
              branch={BRANCH}
            />
          )}
          {view === "team" && <TeamView onNavigate={goToView} />}
          {view === "sessions" && (
            <HeadInstructorsSessionsView
              query={sessionQuery}
              setQuery={setSessionQuery}
              searchRef={sessionSearchRef}
              statusFilter={sessionStatusFilter}
              setStatusFilter={setSessionStatusFilter}
              sessions={filteredSessions}
              summarySessions={visibleSessions}
              selectedSessionId={selectedSessionId}
              selectedSession={selectedSession}
              onSelectSession={setSelectedSessionId}
              onKeyDown={onSessionKeyDown}
              statusLabels={SESSION_STATUS_LABELS}
              branch={BRANCH}
              presentRate={presentRate}
            />
          )}
          {view === "approvals" && (
            <AttendanceApprovalsView
              sessions={pendingReviewSessions}
              allSessions={visibleSessions}
              history={decisionHistory}
              resolvedIds={resolvedAttendanceIds}
              selectedSessionId={selectedApprovalId}
              onSelectSession={setSelectedApprovalId}
              onDecision={recordAttendanceDecision}
              onReopen={reopenAttendanceReview}
            />
          )}
          {view === "evaluations" &&
            (liveMode ? (
              <EvaluationReviewQueue />
            ) : (
              <HeadInstructorsEvaluationsView
                query={evaluationQuery}
                setQuery={setEvaluationQuery}
                statusFilter={evaluationStatusFilter}
                setStatusFilter={setEvaluationStatusFilter}
                evaluations={filteredEvaluations}
                reviewedIds={reviewedIds}
                onOpen={openEvaluation}
                allEvaluations={EVALUATIONS}
                cardStatusLabels={CARD_STATUS_LABELS}
              />
            ))}
          {view === "rubrics" && <RubricsManagementView />}

          <footer className="academic-footnote">
            <span>
              <ShieldCheck size={15} />
            </span>
            <p>
              رئيس المدربين يراجع التقييمات والحضور ويقترح الدعم والتطوير، لكنه
              لا يغيّر الماليات أو حسابات المستخدمين أو قرارات مدير الفرع. أي
              ملاحظة حساسة تُرفع في تقرير واضح بدل اتخاذ إجراء إداري مباشر.
            </p>
          </footer>
        </div>
      </main>

      {selectedEvaluation && (
        <div
          className="academic-modal-backdrop"
          onMouseDown={event => {
            if (event.target === event.currentTarget)
              setSelectedEvaluationId(null);
          }}
        >
          <section
            className="academic-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="academic-evaluation-title"
            dir="rtl"
          >
            <div className="academic-modal-top">
              <span>
                <FileCheck2 size={18} />
              </span>
              <button
                aria-label="إغلاق"
                onClick={() => setSelectedEvaluationId(null)}
              >
                <X size={17} />
              </button>
            </div>
            <span className="academic-modal-kicker">
              مراجعة أكاديمية · {selectedEvaluation.id}
            </span>
            <h2 id="academic-evaluation-title">
              تقييم {selectedEvaluation.student}
            </h2>
            <p>
              {selectedEvaluation.courseName} · المدرب{" "}
              {selectedEvaluation.instructor} ·{" "}
              {formatDate(selectedEvaluation.sessionDate)}
            </p>
            <div className="academic-rubric-list">
              {RUBRIC.map(item => (
                <div className="academic-rubric-row" key={item.key}>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </span>
                  <span className="academic-rubric-score">
                    <strong>{selectedEvaluation.scores[item.key]}</strong>
                    <small>/ ٥</small>
                  </span>
                </div>
              ))}
            </div>
            <div className="academic-comment-box">
              <span>
                <MessageCircle size={14} /> ملاحظة المدرب
              </span>
              <p>{selectedEvaluation.comment}</p>
            </div>
            <div className="academic-evaluation-state">
              <span>حالة البطاقة</span>
              <b className={selectedEvaluation.cardStatus}>
                {CARD_STATUS_LABELS[selectedEvaluation.cardStatus]}
              </b>
            </div>
            <WorkflowStepper
              title="دورة التقييم"
              description="من إرسال المدرب حتى قرار رئيس المدربين."
              steps={[
                {
                  id: "submitted",
                  label: "أرسل المدرب التقييم",
                  caption: "مكتمل",
                  status: "complete",
                },
                {
                  id: "review",
                  label: "مراجعة رئيس المدربين",
                  caption:
                    selectedEvaluationReviewStatus === "pending"
                      ? "بانتظار القرار"
                      : "تمت المراجعة",
                  status:
                    selectedEvaluationReviewStatus === "pending"
                      ? "current"
                      : "complete",
                },
                {
                  id: "share",
                  label: "المشاركة مع ولي الأمر",
                  caption:
                    selectedEvaluationReviewStatus === "approved"
                      ? "الخطوة التالية"
                      : "بعد الاعتماد",
                  status:
                    selectedEvaluationReviewStatus === "approved"
                      ? "current"
                      : "upcoming",
                },
              ]}
            />
            <AuditTimeline
              events={evaluationReviewEvents}
              emptyLabel="لا يوجد سجل مراجعة بعد."
            />
            {selectedEvaluationReviewStatus === "pending" && (
              <ReasonField
                id="evaluation-review-note"
                label="ملاحظة المراجعة"
                helper="اختيارية للاعتماد؛ مطلوبة عند طلب التعديل"
                value={evaluationReviewNote}
                onChange={setEvaluationReviewNote}
                placeholder="اكتب ما يجب تثبيته أو تعديله قبل المشاركة..."
              />
            )}
            <div className="academic-modal-actions">
              <button
                className="academic-secondary-button"
                onClick={() => setSelectedEvaluationId(null)}
              >
                إغلاق
              </button>
              {selectedEvaluationReviewStatus === "pending" ? (
                <>
                  <button
                    className="academic-secondary-button academic-return-button"
                    disabled={!evaluationReviewNote.trim()}
                    onClick={() =>
                      decideEvaluation(
                        selectedEvaluation.id,
                        "changes_requested",
                        evaluationReviewNote
                      )
                    }
                  >
                    <ArrowLeft size={15} /> طلب تعديل
                  </button>
                  <button
                    className="academic-primary-button"
                    onClick={() =>
                      decideEvaluation(
                        selectedEvaluation.id,
                        "approved",
                        evaluationReviewNote
                      )
                    }
                  >
                    <Check size={15} /> اعتماد التقييم
                  </button>
                </>
              ) : (
                <button
                  className="academic-primary-button"
                  onClick={() => setSelectedEvaluationId(null)}
                >
                  <Eye size={15} /> إغلاق المراجعة
                </button>
              )}
            </div>
            <div className="academic-modal-disclaimer">
              هذه حالة توضيحية محلية؛ الاعتماد الحقيقي يحتاج Evaluation API
              وAudit Log ومشاركة خاضعة للسياسة.
            </div>
          </section>
        </div>
      )}
    </RoleDashboardShell>
  );
}

