import { useEffect, useState } from "react";
import {
  Activity,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock,
  GraduationCap,
  Home,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Star,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import StudentProgressCard, {
  type StudentAchievement,
} from "@/components/StudentProgressCard";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, type ConsumerSessionRecord } from "@/lib/apiClient";
import { firstLinkedStudent, sessionsForStudent } from "@/lib/consumerScope";
import "@/components/RoleFoundation.css";
import "@/styles/consumer-portals.css";

type StudentTab = "home" | "sessions" | "progress";

type PortalSession = {
  sessionId: string;
  sessionNumber: number;
  date: string;
  time: string;
  title: string;
  room: string;
  status: "مكتملة" | "قادمة" | "مجدولة";
  attendanceStatus?: string;
  startAt?: string;
  score?: number | null;
  notes?: string | null;
};

const INITIAL_ACHIEVEMENTS: StudentAchievement[] = [
  { title: "مستكشف الحلول", detail: "أنهيت ٣ تحديات تطبيقية عملية", unlocked: true },
  { title: "منتظم في التعلم", detail: "حضرت كافة الجلسات المسجلة دون غياب", unlocked: true },
  { title: "التميز الأكاديمي", detail: "حققت درجة ٩٠+ في تقييم المدرب", unlocked: true },
  { title: "بطل الوحدة", detail: "إتمام المشروع التطبيقي للوحدة الحالية", unlocked: false },
];

const DEMO_SESSIONS: PortalSession[] = [
  {
    sessionId: "demo-1",
    sessionNumber: 1,
    date: "السبت · ٣ أكتوبر",
    time: "١٠:٠٠ ص",
    title: "روبوتكس الناشئين — المستوى 1",
    room: "معمل الروبوتكس أ · الفرع الرئيسي",
    status: "مكتملة",
    attendanceStatus: "PRESENT",
    score: 85,
    notes: "بداية ممتازة وتفاعل نشط مع مكونات الروبوت",
  },
  {
    sessionId: "demo-2",
    sessionNumber: 2,
    date: "السبت · ١٠ أكتوبر",
    time: "١٠:٠٠ ص",
    title: "روبوتكس الناشئين — المستوى 1",
    room: "معمل الروبوتكس أ · الفرع الرئيسي",
    status: "قادمة",
    attendanceStatus: "UNMARKED",
    score: null,
    notes: null,
  },
  {
    sessionId: "demo-3",
    sessionNumber: 3,
    date: "السبت · ٢٦ سبتمبر",
    time: "١٠:٠٠ ص",
    title: "روبوتكس الناشئين — المستوى 1",
    room: "معمل الروبوتكس أ · الفرع الرئيسي",
    status: "مكتملة",
    attendanceStatus: "LATE",
    score: 92,
    notes: "أداء ممتاز وتفاعل متميز في التطبيق العملي",
  },
];

function mapConsumerSession(item: ConsumerSessionRecord): PortalSession {
  const isCompleted = item.status === "COMPLETED";
  const isFuture = new Date(item.startAt).getTime() > Date.now();
  const formattedDate = new Date(item.startAt).toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
  const formattedTime = new Date(item.startAt).toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    sessionId: item.sessionId,
    sessionNumber: item.sessionNumber,
    date: formattedDate,
    time: formattedTime,
    title: item.courseName,
    room: `${item.classroomName} · ${item.branchName}`,
    status: isCompleted ? "مكتملة" : isFuture ? "قادمة" : "مجدولة",
    attendanceStatus: item.attendanceStatus,
    startAt: item.startAt,
    score: item.score,
    notes: item.notes,
  };
}

export default function StudentPortal() {
  const { me } = useAuth();
  const isStudentAccount = me?.role === "R09_STUDENT" || me?.accountType === "student";

  const [tab, setTab] = useState<StudentTab>("home");
  const [progress, setProgress] = useState<number | null>(isStudentAccount ? null : 67);
  const [achievements, setAchievements] = useState<StudentAchievement[] | null>(isStudentAccount ? null : INITIAL_ACHIEVEMENTS);
  const [studentName, setStudentName] = useState(isStudentAccount ? me?.user?.displayName ?? "جارٍ التحميل…" : "لينا عمر");
  const [courseName, setCourseName] = useState(isStudentAccount ? "جارٍ التحميل…" : "روبوتكس الناشئين — المستوى 1");
  const [sessions, setSessions] = useState<PortalSession[]>(isStudentAccount ? [] : DEMO_SESSIONS);
  const [liveMode, setLiveMode] = useState(isStudentAccount);
  const [dataLoading, setDataLoading] = useState(isStudentAccount);
  const [dataError, setDataError] = useState<string | null>(null);
  const [dataWarning, setDataWarning] = useState<string | null>(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // Sync tab with URL hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "") as StudentTab;
      const validTabs: StudentTab[] = ["home", "sessions", "progress"];
      if (validTabs.includes(hash)) {
        setTab(hash);
      } else if (!hash) {
        setTab("home");
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const selectTab = (nextTab: StudentTab) => {
    setTab(nextTab);
    window.location.hash = nextTab === "home" ? "" : nextTab;
  };

  useEffect(() => {
    if (!isStudentAccount) {
      setLiveMode(false);
      setDataLoading(false);
      setSessions(DEMO_SESSIONS);
      setProgress(67);
      setAchievements(INITIAL_ACHIEVEMENTS);
      setProfileMissing(false);
      setStudentName("لينا عمر");
      setCourseName("روبوتكس الناشئين — المستوى 1");
      return;
    }

    let cancelled = false;
    setLiveMode(true);
    setDataLoading(true);
    setSessions([]);
    setProgress(null);
    setAchievements(null);
    setCourseName("جارٍ التحميل…");
    setDataError(null);
    setDataWarning(null);
    setProfileMissing(false);

    const studentsRequest = apiClient.consumerStudents();
    const sessionsRequest = apiClient.consumerSessions();

    Promise.allSettled([studentsRequest, sessionsRequest]).then(([studentsResult, sessionsResult]) => {
      if (cancelled) return;
      setDataLoading(false);

      if (studentsResult.status === "rejected") {
        const message = studentsResult.reason instanceof Error ? studentsResult.reason.message : "تعذر تحميل ملف الطالب.";
        setSessions([]);
        setProgress(null);
        setAchievements(null);
        setCourseName("غير متاح");
        setProfileMissing(false);
        setDataError(message);
        toast.error(message);
        return;
      }

      const student = firstLinkedStudent(studentsResult.value.items);
      const records = sessionsResult.status === "fulfilled" ? sessionsResult.value.items : [];
      const ownRecords = student ? sessionsForStudent(records, student.id) : [];

      setProfileMissing(!student);
      setStudentName(student?.name ?? me?.user?.displayName ?? "الطالب");
      setCourseName(ownRecords[0]?.courseName ?? "لا توجد جلسات مرتبطة");

      const mappedSessions = ownRecords.map(mapConsumerSession);
      setSessions(mappedSessions);

      const completed = mappedSessions.filter(s => s.status === "مكتملة").length;
      if (mappedSessions.length > 0) {
        setProgress(Math.round((completed / mappedSessions.length) * 100));
      } else {
        setProgress(null);
      }

      setDataError(null);

      if (sessionsResult.status === "rejected") {
        const message = "الجلسات غير متاحة مؤقتًا.";
        setDataWarning(message);
        toast.error(`${message} يمكنك إعادة المحاولة لاحقًا.`);
      }
    });

    Promise.allSettled([studentsRequest, sessionsRequest]).then(results => {
      if (!cancelled && retryKey > 0 && results.every(result => result.status === "fulfilled")) {
        toast.success("تم تحديث بيانات الطالب");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [me?.user?.displayName, retryKey, isStudentAccount]);

  const retry = () => setRetryKey(value => value + 1);

  const completedSessions = sessions.filter(item => item.status === "مكتملة").length;
  const attendanceRecords = sessions.filter(item => item.attendanceStatus && item.attendanceStatus !== "UNMARKED");
  const attendanceRate = attendanceRecords.length
    ? Math.round(
        (attendanceRecords.filter(item => item.attendanceStatus === "PRESENT" || item.attendanceStatus === "LATE").length /
          attendanceRecords.length) *
          100
      )
    : liveMode ? null : 100;

  const nextSession = sessions
    .filter(item => item.startAt && new Date(item.startAt).getTime() >= Date.now())
    .sort((a, b) => (a.startAt ?? "").localeCompare(b.startAt ?? ""))[0];

  const latestEvaluation = sessions
    .filter(item => item.score !== null && item.score !== undefined)
    .sort((a, b) => (b.startAt ?? "").localeCompare(a.startAt ?? ""))[0];

  const currentUnit = liveMode ? sessions[0]?.title ?? null : "الحساسات وبرمجة الحركة الذكية";
  const nextCheckpoint = liveMode
    ? nextSession ? `الجلسة القادمة رقم ${nextSession.sessionNumber}` : null
    : achievements?.find(a => a.title === "بطل الوحدة")?.unlocked ? "تم اجتيازه بنجاح" : "تحدي نهاية الوحدة";

  const completeChallenge = () => {
    if (liveMode) return;
    setProgress(current => Math.max(current ?? 0, 85));
    setAchievements(prev =>
      prev?.map(a => (a.title === "بطل الوحدة" ? { ...a, unlocked: true } : a)) ?? null
    );
    toast.success("رائع! تم تسجيل إنجاز بطل الوحدة بنجاح");
  };

  const tabs = [
    { id: "home" as const, label: "رحلتي التعليمية", icon: Home },
    { id: "sessions" as const, label: "جلساتي ومواعيدي", icon: CalendarDays },
    { id: "progress" as const, label: "التقدم والإنجازات", icon: Trophy },
  ];

  return (
    <RoleDashboardShell
      roleCode="R09"
      roleLabel="الطالب"
      scopeLevel="self"
      scopeLabel="حساب الطالب فقط"
      identityKind="consumer"
      tenantName={me?.academy?.name ?? "أكاديمية مدى"}
      demo={!liveMode}
    >
      <div className="student-portal-page" dir="rtl">
        {/* Welcome Header */}
        <div className="portal-welcome-header">
          <div>
            <span className="portal-role-kicker">
              <GraduationCap size={16} /> R09 · مساحة الطالب التعليمية
            </span>
            <h1>أهلًا يا {studentName}، رحلتك التعليمية مستمرة!</h1>
            <p>شاهد تقدمك الدراسي وجلساتك وإنجازاتك من واجهة سريعة ومباشرة.</p>
          </div>
          <span className={`portal-live-badge ${liveMode ? "live" : "demo"}`}>
            {liveMode ? "LIVE · حساب الطالب المباشر" : "DEMO · معاينة حساب الطالب"}
          </span>
        </div>

        {/* Demo switcher helper */}
        {!isStudentAccount && (
          <div
            className="consumer-note-box"
            style={{
              background: "rgba(99, 102, 241, 0.08)",
              borderColor: "rgba(99, 102, 241, 0.25)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <span>
              <strong>معاينة حساب الطالب:</strong> أنت الآن في وضع المعاينة. يمكنك الدخول المباشر بحساب الطالبة (لينا عمر) لمتابعة جلساتها وتقييماتها الحية.
            </span>
            <button
              type="button"
              className="button button-primary"
              style={{ padding: "6px 14px", fontSize: "0.85rem" }}
              onClick={async () => {
                try {
                  await apiClient.login("+201000000012", "Mada@2026", "student");
                  window.location.reload();
                } catch {
                  toast.error("تعذر الدخول بحساب الطالب");
                }
              }}
            >
              الدخول المباشر كطالب (Lina Omar)
            </button>
          </div>
        )}

        {/* Loading and Error States */}
        {dataLoading && (
          <div className="consumer-note-box">
            <RefreshCw size={16} className="animate-spin" />
            <span>جارٍ تحميل جدول الجلسات والتقدم الدراسي…</span>
          </div>
        )}
        {dataError && (
          <div className="consumer-note-box warning" role="alert">
            <ShieldCheck size={16} />
            <span>تعذر تحميل بيانات الطالب: {dataError}</span>
            <button type="button" className="button button-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem", marginInlineStart: "auto" }} onClick={retry}>
              إعادة المحاولة
            </button>
          </div>
        )}
        {profileMissing && !dataError && (
          <div className="consumer-note-box" role="status">
            لا يوجد ملف طالب مرتبط بهذا الحساب حتى الآن.
          </div>
        )}
        {dataWarning && (
          <div className="consumer-note-box warning" role="status">
            <ShieldCheck size={16} />
            <span>تنبيه: {dataWarning}</span>
            <button type="button" className="button button-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem", marginInlineStart: "auto" }} onClick={retry}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Quick Nav Pills */}
        <nav className="consumer-tab-pills" aria-label="أقسام مساحة الطالب">
          {tabs.map(item => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`consumer-tab-pill ${active ? "active" : ""}`}
                onClick={() => selectTab(item.id)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Home Tab */}
        {tab === "home" && (
          <>
            {/* Upcoming Session Vibrant Hero */}
            <div className="student-vibrant-hero">
              <div className="student-vibrant-hero-content">
                <small>الجلسة القادمة</small>
                <h2>{courseName}</h2>
                <p>
                  <CalendarDays size={18} />
                  {nextSession
                    ? `${nextSession.date} · الساعة ${nextSession.time} · ${nextSession.room}`
                    : liveMode ? "لا توجد جلسة قادمة مسجلة حاليًا." : "السبت القادم · ١٠:٠٠ ص · معمل الروبوتكس أ"}
                </p>
              </div>
              <button type="button" className="student-vibrant-hero-action" onClick={() => selectTab("sessions")}>
                جدول الجلسات <ChevronLeft size={16} />
              </button>
            </div>

            {/* Metrics */}
            <div className="portal-metrics-grid">
              <div className="portal-metric-card">
                <div className="portal-metric-top">
                  <span className="portal-metric-label">انتظام الحضور</span>
                  <span className="portal-metric-icon teal"><CalendarDays size={18} /></span>
                </div>
                <div className="portal-metric-value">{attendanceRate === null ? "—" : `${attendanceRate}%`}</div>
                <div className="portal-metric-note">
                  {liveMode
                    ? attendanceRecords.length ? `${attendanceRecords.length} سجلات حضور` : "لا توجد بيانات حضور مسجلة"
                    : "التزام مستمر بدون غياب"}
                </div>
              </div>

              <div className="portal-metric-card">
                <div className="portal-metric-top">
                  <span className="portal-metric-label">التقدم في المسار</span>
                  <span className="portal-metric-icon violet"><Activity size={18} /></span>
                </div>
                <div className="portal-metric-value">{progress === null ? "—" : `${progress}%`}</div>
                <div className="portal-metric-note">
                  {sessions.length > 0 ? `${completedSessions} من ${sessions.length} جلسة مكتملة` : "لا توجد جلسات مسجلة"}
                </div>
              </div>

              <div className="portal-metric-card">
                <div className="portal-metric-top">
                  <span className="portal-metric-label">أحدث درجة تقييم</span>
                  <span className="portal-metric-icon amber"><Star size={18} /></span>
                </div>
                <div className="portal-metric-value">
                  {latestEvaluation?.score ?? "—"}{latestEvaluation?.score !== null && latestEvaluation?.score !== undefined ? " / 100" : ""}
                </div>
                <div className="portal-metric-note">
                  {latestEvaluation ? "تقييم مسجل من جلسات الطالب" : liveMode ? "لا توجد تقييمات مسجلة" : "مكافئ 4.6 من 5 نجوم ★"}
                </div>
              </div>

              <div className="portal-metric-card">
                <div className="portal-metric-top">
                  <span className="portal-metric-label">الأوسمة المكتسبة</span>
                  <span className="portal-metric-icon blue"><Trophy size={18} /></span>
                </div>
                <div className="portal-metric-value">
                  {achievements === null ? "غير متاح" : `${achievements.filter(a => a.unlocked).length} من ${achievements.length}`}
                </div>
                <div className="portal-metric-note">
                  {achievements === null ? "لا تتوفر بيانات إنجازات من الخادم" : "إنجازات تعليمية معتمدة"}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              {/* Progress Card Component */}
              <StudentProgressCard
                progress={progress}
                currentUnit={currentUnit}
                nextCheckpoint={nextCheckpoint}
                achievements={achievements}
              />

              {/* Recent Activity */}
              <section className="consumer-panel">
                <div className="consumer-panel-header">
                  <div>
                    <MessageCircle size={18} />
                    <h2>آخر تفاعل أكاديمي</h2>
                  </div>
                  <button type="button" className="button button-ghost" style={{ fontSize: "0.85rem", color: "#0d9488" }} onClick={() => selectTab("sessions")}>
                    عرض الكل <ChevronLeft size={14} />
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {latestEvaluation && (
                    <div style={{ padding: "14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <strong style={{ color: "#166534", fontSize: "0.95rem" }}>
                          تقييم جلسة #{latestEvaluation.sessionNumber} · درجة {latestEvaluation.score}/100
                        </strong>
                        <span className="status-tag score">تقييم مسجل</span>
                      </div>
                      <p style={{ margin: "4px 0 0", color: "#14532d", fontSize: "0.86rem", lineHeight: "1.6" }}>
                        <strong>ملاحظة المدرب:</strong> {latestEvaluation.notes || "لا توجد ملاحظة من المدرب."}
                      </p>
                    </div>
                  )}

                  {!liveMode && (
                    <div style={{ padding: "14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <strong style={{ color: "#0f172a", fontSize: "0.92rem" }}>
                          حضور الجلسة الافتتاحية بنجاح
                        </strong>
                        <span className="status-tag present">حاضر</span>
                      </div>
                      <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "0.84rem" }}>
                        تم التعرف على بيئة العمل وتجهيز عدة الروبوت التعليمية.
                      </p>
                    </div>
                  )}
                  {liveMode && !latestEvaluation && (
                    <p role="status" style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
                      لا توجد تفاعلات أكاديمية مسجلة من الخادم حاليًا.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </>
        )}

        {/* Sessions Tab */}
        {tab === "sessions" && (
          <section className="consumer-panel">
            <div className="consumer-panel-header">
              <div>
                <CalendarDays size={18} />
                <h2>جدول الجلسات ومواعيد التدريب</h2>
              </div>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                {courseName}
              </span>
            </div>

            <div className="consumer-sessions-list">
              {liveMode && !dataLoading && sessions.length === 0 && (
                <p role="status" style={{ margin: 0, color: "#64748b" }}>
                  {dataError || dataWarning ? "بيانات الجلسات غير متاحة حاليًا." : "لا توجد جلسات مرتبطة بهذا الحساب."}
                </p>
              )}
              {sessions.map(sess => {
                const isCompleted = sess.status === "مكتملة";
                const isPresent = sess.attendanceStatus === "PRESENT";
                const isLate = sess.attendanceStatus === "LATE";
                const isAbsent = sess.attendanceStatus === "ABSENT";
                const isExcused = sess.attendanceStatus === "EXCUSED";

                const tagClass = isPresent ? "present" : isLate ? "late" : isAbsent ? "absent" : isExcused ? "excused" : "scheduled";
                const tagLabel = isPresent ? "حاضر" : isLate ? "حضور متأخر" : isAbsent ? "غائب" : isExcused ? "غياب بعذر" : "مجدولة";

                return (
                  <div key={sess.sessionId} className="consumer-session-item">
                    <div className="consumer-session-item-main">
                      <span className={`consumer-session-item-icon ${isCompleted ? "done" : "upcoming"}`}>
                        <CalendarDays size={20} />
                      </span>
                      <div className="consumer-session-item-info">
                        <strong>جلسة رقم #{sess.sessionNumber} · {sess.title}</strong>
                        <small>
                          {sess.date} · الساعة {sess.time} · {sess.room}
                        </small>
                        {sess.notes && (
                          <p style={{ margin: "6px 0 0", fontSize: "0.84rem", color: "#047857", background: "#f0fdf4", padding: "4px 8px", borderRadius: "6px" }}>
                            <strong>ملاحظة المدرب:</strong> {sess.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="consumer-session-badges">
                      {sess.score !== null && sess.score !== undefined && (
                        <span className="status-tag score">★ {sess.score} / 100</span>
                      )}
                      <span className={`status-tag ${tagClass}`}>{tagLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Progress & Achievements Tab */}
        {tab === "progress" && !liveMode && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            <StudentProgressCard
              progress={progress}
              currentUnit="الحساسات وبرمجة الحركة الذكية"
              nextCheckpoint={achievements?.find(a => a.title === "بطل الوحدة")?.unlocked ? "تم اجتيازه بنجاح" : "تحدي نهاية الوحدة"}
              achievements={achievements}
            />

            <section className="consumer-panel">
              <div className="consumer-panel-header">
                <div>
                  <BookOpen size={18} />
                  <h2>خارطة طريق المسار الحالي</h2>
                </div>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  {courseName}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "10px", background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                  <CheckCircle2 size={18} style={{ color: "#059669" }} />
                  <div>
                    <strong style={{ color: "#065f46", fontSize: "0.95rem", display: "block" }}>الوحدة 1: مقدمة الروبوتات والدوائر</strong>
                    <small style={{ color: "#047857" }}>مكتملة بنجاح · الأساسيات ومفاهيم التحكم</small>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "10px", background: "#f0fdfa", border: "1px solid #ccfbf1" }}>
                  <Activity size={18} style={{ color: "#0d9488" }} />
                  <div>
                    <strong style={{ color: "#0f766e", fontSize: "0.95rem", display: "block" }}>الوحدة 2: الحساسات وبرمجة الحركة الذكية</strong>
                    <small style={{ color: "#0d9488" }}>قيد الدراسة والتطبيق العملي الآن</small>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <Clock size={18} style={{ color: "#94a3b8" }} />
                  <div>
                    <strong style={{ color: "#475569", fontSize: "0.95rem", display: "block" }}>الوحدة 3: الخوارزميات واتخاذ القرار التلقائي</strong>
                    <small style={{ color: "#64748b" }}>الوحدة القادمة</small>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <Trophy size={18} style={{ color: "#94a3b8" }} />
                  <div>
                    <strong style={{ color: "#475569", fontSize: "0.95rem", display: "block" }}>مشروع التحدي الختامي والمعرض</strong>
                    <small style={{ color: "#64748b" }}>المشروع النهائي والشهادة</small>
                  </div>
                </div>
              </div>

              {!achievements?.find(a => a.title === "بطل الوحدة")?.unlocked && (
                <button
                  type="button"
                  className="button button-primary"
                  style={{ width: "100%", marginTop: "18px", padding: "10px", fontSize: "0.9rem" }}
                  onClick={completeChallenge}
                >
                  <Trophy size={16} /> تسجيل إتمام تحدي الوحدة الحالية
                </button>
              )}
            </section>
          </div>
        )}

        {tab === "progress" && liveMode && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            <StudentProgressCard
              progress={progress}
              currentUnit={currentUnit}
              nextCheckpoint={nextCheckpoint}
              achievements={achievements}
            />
            <div className="consumer-note-box" role="status" style={{ alignSelf: "start" }}>
              بيانات خارطة المسار والإنجازات غير متاحة من الخادم حاليًا؛ لن نعرض تفاصيل تجريبية على حساب الطالب.
            </div>
          </div>
        )}

        {/* Guard footer */}
        <footer className="consumer-note-box" style={{ marginTop: "32px" }}>
          <ShieldCheck size={16} />
          <span>
            هذه المساحة مخصصة لك لمتابعة رحلتك التعليمية بأمان — لا توجد أدوات إدارية أو بيانات مالية هنا. إذا واجهتك أي صعوبة، لا تتردد في استشارة مدربك في الجلسة القادمة!
          </span>
        </footer>
      </div>
    </RoleDashboardShell>
  );
}
