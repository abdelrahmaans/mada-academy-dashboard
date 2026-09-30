import { useEffect, useState } from "react";
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CircleHelp,
  Clock3,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  ShieldCheck,
  Star,
  Trophy,
  UserRound,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import StudentProgressCard, {
  type StudentAchievement,
} from "@/components/StudentProgressCard";
import { RoleScopeProvider } from "@/contexts/RoleScopeContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, type ConsumerSessionRecord } from "@/lib/apiClient";
import { useLocation } from "wouter";
import "@/components/RoleFoundation.css";

type StudentTab = "home" | "sessions" | "progress";
type PortalSession = { date: string; title: string; unit: string; room: string; status: string; attendanceStatus?: string; startAt?: string; score?: number | null; notes?: string | null };
const INITIAL_ACHIEVEMENTS: StudentAchievement[] = [
  { title: "مستكشف الحلول", detail: "أنهيت ٣ تحديات تطبيقية", unlocked: true },
  { title: "منتظم في التعلم", detail: "حضرت ٤ جلسات متتالية", unlocked: true },
  { title: "بطل الوحدة", detail: "أكمل الوحدة الحالية", unlocked: false },
];
const DEMO_SESSIONS: PortalSession[] = [
  {
    date: "الأحد · ١٢:٠٠ م",
    title: "روبوتكس مستوى 2",
    unit: "الحساسات والحركة",
    room: "معمل ١",
    status: "قادمة",
  },
  {
    date: "الأربعاء · ١٢:٠٠ م",
    title: "روبوتكس مستوى 2",
    unit: "تطبيق عملي",
    room: "معمل ١",
    status: "قادمة",
  },
  {
    date: "الأحد · ١٢:٠٠ م",
    title: "روبوتكس مستوى 2",
    unit: "دوائر التحكم",
    room: "معمل ١",
    status: "مكتملة",
  },
];

function mapConsumerSession(item: ConsumerSessionRecord): PortalSession {
  return {
    date: `${new Date(item.startAt).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "short" })} · ${new Date(item.startAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`,
    title: item.courseName, unit: `جلسة ${item.sessionNumber}`, room: `${item.classroomName} · ${item.branchName}`,
    status: item.status === "COMPLETED" ? "مكتملة" : new Date(item.startAt).getTime() > Date.now() ? "قادمة" : "مجدولة",
    attendanceStatus: item.attendanceStatus, startAt: item.startAt, score: item.score, notes: item.notes,
  };
}
function completedSessionsText(items: PortalSession[]) {
  return `${items.filter(item => item.status === "مكتملة").length} من ${items.length}`;
}

export default function StudentPortal() {
  const { me, logout } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<StudentTab>("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [progress, setProgress] = useState(72);
  const [achievementState, setAchievementState] = useState(INITIAL_ACHIEVEMENTS);
  const [studentName, setStudentName] = useState(apiClient.hasSession() ? me?.user?.displayName ?? "جارٍ التحميل…" : "ياسين محمد علي");
  const [courseName, setCourseName] = useState(apiClient.hasSession() ? "جارٍ التحميل…" : "روبوتكس مستوى 2");
  const [sessions, setSessions] = useState<PortalSession[]>(apiClient.hasSession() ? [] : DEMO_SESSIONS);
  const [liveMode, setLiveMode] = useState(apiClient.hasSession());
  const [dataLoading, setDataLoading] = useState(apiClient.hasSession());
  const [dataError, setDataError] = useState<string | null>(null);
  const [hasStudentProfile, setHasStudentProfile] = useState(!apiClient.hasSession());
  const nav = [
    { id: "home" as const, label: "رحلتي", icon: Home },
    { id: "sessions" as const, label: "جلساتي", icon: CalendarDays },
    { id: "progress" as const, label: "التقدم والإنجازات", icon: Trophy },
  ];
  const select = (next: StudentTab) => {
    setTab(next);
    setMobileOpen(false);
  };
  useEffect(() => {
    if (!apiClient.hasSession()) return;
    let cancelled = false;
    setLiveMode(true); setDataLoading(true); setSessions([]);
    Promise.all([apiClient.consumerStudents(), apiClient.consumerSessions()])
      .then(([students, response]) => {
        if (cancelled) return;
        const student = students.items[0];
        const ownRecords = student ? response.items.filter(item => item.studentId === student.id) : [];
        setHasStudentProfile(Boolean(student));
        setStudentName(student?.name ?? me?.user?.displayName ?? "الطالب");
        setCourseName(ownRecords[0]?.courseName ?? "لا توجد مجموعة مسجلة");
        setSessions(ownRecords.map(mapConsumerSession));
        setDataError(null);
      })
      .catch(error => { if (!cancelled) { setSessions([]); setHasStudentProfile(false); setDataError(error instanceof Error ? error.message : "تعذر تحميل بيانات الطالب"); } })
      .finally(() => { if (!cancelled) setDataLoading(false); });
    return () => { cancelled = true; };
  }, []);
  const completedSessions = sessions.filter(item => item.status === "مكتملة").length;
  const attendanceRecords = sessions.filter(item => item.attendanceStatus && item.attendanceStatus !== "UNMARKED");
  const attendanceRate = attendanceRecords.length ? Math.round(attendanceRecords.filter(item => item.attendanceStatus === "PRESENT" || item.attendanceStatus === "LATE").length / attendanceRecords.length * 100) : 0;
  const liveProgress = sessions.length ? Math.round(completedSessions / sessions.length * 100) : 0;
  const nextSession = sessions.filter(item => item.startAt && new Date(item.startAt).getTime() >= Date.now()).sort((a, b) => (a.startAt ?? "").localeCompare(b.startAt ?? ""))[0];
  const lastEvaluation = sessions.filter(item => item.score !== null && item.score !== undefined).sort((a, b) => (b.startAt ?? "").localeCompare(a.startAt ?? ""))[0];
  const completeCheckpoint = () => {
    setProgress(current => Math.max(current, 84));
    setAchievementState(current =>
      current.map(item =>
        item.title === "بطل الوحدة" ? { ...item, unlocked: true } : item
      )
    );
    toast.success("تم تسجيل إنجاز تحدي الوحدة", {
      description: "أصبح الإنجاز ظاهرًا في رحلتك التعليمية داخل المعاينة.",
    });
  };
  return (
    <RoleScopeProvider
      roleCode="R09"
      roleLabel="الطالب"
      scopeLevel="self"
      scopeLabel="حساب الطالب فقط"
      identityKind="consumer"
      tenantName="أكاديمية مدى"
      demo={!liveMode}
    >
      <div className="student-portal" dir="rtl">
      {mobileOpen && (
        <button
          className="student-portal-scrim"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`student-portal-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="student-brand">
          <span>مدى</span>
          <small>مساحة الطالب</small>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="إغلاق القائمة"
          >
            ×
          </button>
        </div>
        <div className="student-profile">
            <span className="student-avatar">{studentName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("")}</span>
          <div>
              <strong>{studentName}</strong>
              <small>{courseName}</small>
          </div>
        </div>
        <div className="student-nav-label">مساحتي التعليمية</div>
        <nav className="student-nav">
          {nav.map(item => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                className={tab === item.id ? "active" : ""}
                onClick={() => select(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="student-sidebar-spacer" />
        <button
          type="button"
          className="student-help"
          onClick={() =>
            toast("اطلب مساعدة من مدربك", {
              description: "يمكنك التواصل مع المدرب من خلال الأكاديمية.",
            })
          }
        >
          <CircleHelp size={16} />
          <span>
            <strong>محتاج مساعدة؟</strong>
            <small>اسأل مدربك</small>
          </span>
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          className="student-logout"
          onClick={() => { void logout().then(() => navigate("/login")); }}
        >
          <LogOut size={16} /> تسجيل الخروج
        </button>
      </aside>
      <main className="student-portal-main">
        <header className="student-topbar">
          <button
            type="button"
            className="student-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="فتح القائمة"
          >
            <Menu size={20} />
          </button>
          <div>
            <strong>أكاديمية مدى</strong>
            <small>R09 · مساحة تعليمية للطالب</small>
          </div>
          <button
            type="button"
            className="student-notification"
            onClick={() => toast("لا توجد تنبيهات جديدة")}
          >
            <Bell size={17} />
          </button>
        </header>
        <div className="student-content">
          <div className="student-welcome">
            <div>
              <span className="student-kicker">
                <GraduationCap size={13} /> أهلًا {studentName}
              </span>
              <h1>
                {tab === "home"
                  ? "رحلتك التعليمية مستمرة"
                  : nav.find(item => item.id === tab)?.label}
              </h1>
              <p>شاهد تقدمك وجلساتك وإنجازاتك من مساحة بسيطة ومركزة.</p>
            </div>
            <span className="student-demo">{liveMode ? "LIVE · حساب الطالب" : "DEMO · حساب الطالب"}</span>
          </div>
          <div className="student-boundary">
            <ShieldCheck size={14} />
            <span>
              هذه مساحة قراءة مخصصة لك فقط — لا توجد فواتير أو بيانات أسرية أو
              أدوات إدارية.
            </span>
          </div>
          {dataLoading && <div className="student-note">جارٍ تحميل الجلسات المرتبطة بحسابك…</div>}
          {dataError && <div className="student-note" role="alert">تعذر تحميل بيانات الطالب: {dataError}</div>}
          {!dataLoading && !dataError && liveMode && !hasStudentProfile && <div className="student-note" role="status">لا يوجد ملف طالب مرتبط بهذا الحساب حتى الآن. تواصل مع الأكاديمية لربط الملف الصحيح.</div>}
          {hasStudentProfile && !dataLoading && !dataError && <>
          {tab === "home" && (
            <HomeTab
              onNavigate={select}
              progress={liveMode ? liveProgress : progress}
              achievements={liveMode ? [] : achievementState}
              liveMode={liveMode}
              courseName={courseName}
              sessions={sessions}
              attendanceRate={attendanceRate}
              nextSession={nextSession}
              latestEvaluation={lastEvaluation}
            />
          )}
          {tab === "sessions" && <SessionsTab sessions={sessions} liveMode={liveMode} courseName={courseName} />}
          {tab === "progress" && (
            <ProgressTab
              progress={liveMode ? liveProgress : progress}
              achievements={liveMode ? [] : achievementState}
              onCompleteCheckpoint={completeCheckpoint}
              liveMode={liveMode}
              sessions={sessions}
              courseName={courseName}
            />
          )}
          </>}
        </div>
      </main>
      </div>
    </RoleScopeProvider>
  );
}
function HomeTab({ onNavigate, progress, achievements, liveMode, courseName, sessions, attendanceRate, nextSession, latestEvaluation }: { onNavigate: (tab: StudentTab) => void; progress: number; achievements: StudentAchievement[]; liveMode: boolean; courseName: string; sessions: PortalSession[]; attendanceRate: number; nextSession?: PortalSession; latestEvaluation?: PortalSession }) {
  return (
    <>
      <section className="student-hero-card">
        <div>
          <span>الجلسة القادمة</span>
          <h2>{liveMode ? courseName : "روبوتكس مستوى 2"}</h2>
          <p><CalendarDays size={14} /> {liveMode ? (nextSession ? `${nextSession.date} · ${nextSession.room}` : "لا توجد جلسة قادمة مسجلة") : "الأحد · ١٢:٠٠ م · معمل ١"}</p>
          <button type="button" onClick={() => onNavigate("sessions")}>
            عرض كل الجلسات <ChevronLeft size={13} />
          </button>
        </div>
        <div className="student-hero-icon">
          <BookOpen size={28} />
        </div>
      </section>
      <div className="student-stat-grid">
        <Stat
          icon={<CalendarDays size={16} />}
          label="الحضور"
          value={liveMode ? `${attendanceRate}%` : "88%"}
          note={liveMode ? "من سجلات الحضور المحفوظة" : "من آخر ٨ جلسات"}
          tone="teal"
        />
        <Stat
          icon={<Trophy size={16} />}
          label="التقدم"
          value={`${progress}%`}
          note={liveMode ? `${sessions.filter(item => item.status === "مكتملة").length} من ${sessions.length} جلسة مكتملة` : "في المسار الحالي"}
          tone="violet"
        />
        <Stat
          icon={<Star size={16} />}
          label="آخر تقييم"
          value={liveMode ? (latestEvaluation?.score == null ? "لا يوجد" : `${(latestEvaluation.score / 20).toFixed(1)} / 5`) : "4.3 / 5"}
          note={liveMode ? "تقييم منشور فقط" : "مراجعة أكاديمية"}
          tone="amber"
        />
      </div>
      <div className="student-home-grid">
        {liveMode ? <section className="student-panel"><PanelTitle icon={<Trophy size={15} />} title="تقدم الجلسات" /><p>{completedSessionsText(sessions)} من الجلسات المسندة أُنجزت حتى الآن.</p></section> : <StudentProgressCard
          progress={progress}
          currentUnit="الحساسات والحركة"
          nextCheckpoint={achievements.find(item => item.title === "بطل الوحدة")?.unlocked ? "تم اجتيازه" : "تحدي الوحدة"}
          achievements={achievements}
        />}
        <section className="student-panel">
          <PanelTitle
            icon={<CalendarDays size={15} />}
            title="آخر نشاط"
            action={
              <button type="button" onClick={() => onNavigate("sessions")}>
                جلساتي <ChevronLeft size={12} />
              </button>
            }
          />
          <div className="student-activity">
            {liveMode ? sessions.slice(0, 3).map((item, index) => <ActivityRow key={`${item.date}-${index}`} icon={<CalendarDays size={15} />} title={`${item.title} · ${item.status}`} detail={`${item.date} · الحضور: ${item.attendanceStatus === "UNMARKED" ? "لم يسجل" : item.attendanceStatus ?? "غير متاح"}`} tone={item.status === "مكتملة" ? "teal" : "blue"} />) : <>
            <ActivityRow
              icon={<CheckCircle2 size={15} />}
              title="أكملت جلسة دوائر التحكم"
              detail="الأحد · منذ يومين"
              tone="teal"
            />
            <ActivityRow
              icon={<MessageCircle size={15} />}
              title="أضاف المدرب ملاحظة جديدة"
              detail="بطاقة التقييم · منذ ٣ أيام"
              tone="blue"
            />
            <ActivityRow
              icon={<Award size={15} />}
              title="فتحت إنجاز مستكشف الحلول"
              detail="منذ أسبوع"
              tone="amber"
            />
            </>}
          </div>
        </section>
      </div>
    </>
  );
}
function SessionsTab({ sessions, liveMode, courseName }: { sessions: PortalSession[]; liveMode: boolean; courseName: string }) {
  return (
    <section className="student-panel student-detail-panel">
      <PanelTitle
        icon={<CalendarDays size={15} />}
        title="جلساتي"
        action={<span className="student-context">{courseName}</span>}
      />
      <div className="student-session-list">
        {sessions.map((session, index) => (
          <article
            className="student-session"
            key={`${session.date}-${session.unit}-${index}`}
          >
            <span
              className={`student-session-icon ${session.status === "قادمة" || session.status === "مجدولة" ? "upcoming" : "done"}`}
            >
              {session.status === "قادمة" || session.status === "مجدولة" ? (
                <Clock3 size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
            </span>
            <div>
              <strong>{session.date}</strong>
              <small>
                {session.title} · {session.room}
              </small>
              <span>{session.unit}</span>
            </div>
            <b className={session.status === "قادمة" || session.status === "مجدولة" ? "upcoming" : "done"}>
              {session.status}
            </b>
          </article>
        ))}
      </div>
      {liveMode && sessions.length === 0 && <div className="student-note">لا توجد جلسات مرتبطة بملفك حتى الآن.</div>}
      <div className="student-note"><ShieldCheck size={14} /> الجلسات المعروضة هي الجلسات المسندة إلى حسابك فقط.</div>
    </section>
  );
}
function ProgressTab({ progress, achievements, onCompleteCheckpoint, liveMode, sessions, courseName }: { progress: number; achievements: StudentAchievement[]; onCompleteCheckpoint: () => void; liveMode: boolean; sessions: PortalSession[]; courseName: string }) {
  if (liveMode) return <div className="student-progress-layout"><section className="student-panel"><PanelTitle icon={<Trophy size={15} />} title="تقدم الجلسات" /><div className="student-course-map"><CourseStep title={courseName} state="المسار المسند" /><CourseStep title="جلسات مكتملة" state={`${sessions.filter(item => item.status === "مكتملة").length} من ${sessions.length}`} /><CourseStep title="نسبة الإنجاز" state={`${progress}%`} /></div><div className="student-note"><ShieldCheck size={14} /> يعتمد التقدم هنا على الجلسات المسجلة فقط؛ الإنجازات اليدوية غير مفعلة.</div></section></div>;
  const checkpointComplete = achievements.find(item => item.title === "بطل الوحدة")?.unlocked ?? false;
  return (
    <div className="student-progress-layout">
      <StudentProgressCard
        progress={progress}
        currentUnit="الحساسات والحركة"
        nextCheckpoint={checkpointComplete ? "تم اجتيازه" : "تحدي الوحدة"}
        achievements={achievements}
      />
      <section className="student-panel">
        <PanelTitle icon={<BookOpen size={15} />} title="المسار الحالي" />
        <div className="student-course-map">
          <CourseStep title="المقدمة والأمان" state="مكتمل" />
          <CourseStep title="دوائر التحكم" state="مكتمل" />
          <CourseStep title="الحساسات والحركة" state="جاري الآن" />
          <CourseStep title="تحدي الوحدة" state={checkpointComplete ? "مكتمل" : "قادم"} />
        </div>
        {!checkpointComplete && (
          <button type="button" className="student-note" onClick={onCompleteCheckpoint}>
            <Trophy size={14} /> سجّل إكمال تحدي الوحدة بعد إنهاء التطبيق
          </button>
        )}
        {checkpointComplete && (
          <div className="student-note"><CheckCircle2 size={14} /> تم تسجيل الإنجاز ويمكنك متابعة الوحدة التالية.</div>
        )}
      </section>
    </div>
  );
}
function CourseStep({ title, state }: { title: string; state: string }) {
  return (
    <div
      className={`student-course-step ${state === "جاري الآن" ? "current" : state === "مكتمل" ? "done" : "next"}`}
    >
      <span>
        {state === "مكتمل" ? (
          <CheckCircle2 size={15} />
        ) : state === "جاري الآن" ? (
          <Activity size={15} />
        ) : (
          <Clock3 size={15} />
        )}
      </span>
      <div>
        <strong>{title}</strong>
        <small>{state}</small>
      </div>
    </div>
  );
}
function Stat({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  return (
    <article className="student-stat">
      <span className={`student-stat-icon ${tone}`}>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{note}</span>
    </article>
  );
}
function ActivityRow({
  icon,
  title,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  tone: string;
}) {
  return (
    <div className="student-activity-row">
      <span className={tone}>{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}
function PanelTitle({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="student-panel-title">
      <div>
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
