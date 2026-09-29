import { useState } from "react";
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

type StudentTab = "home" | "sessions" | "progress";
const achievements: StudentAchievement[] = [
  { title: "مستكشف الحلول", detail: "أنهيت ٣ تحديات تطبيقية", unlocked: true },
  { title: "منتظم في التعلم", detail: "حضرت ٤ جلسات متتالية", unlocked: true },
  { title: "بطل الوحدة", detail: "أكمل الوحدة الحالية", unlocked: false },
];
const sessions = [
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

export default function StudentPortal() {
  const [tab, setTab] = useState<StudentTab>("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = [
    { id: "home" as const, label: "رحلتي", icon: Home },
    { id: "sessions" as const, label: "جلساتي", icon: CalendarDays },
    { id: "progress" as const, label: "التقدم والإنجازات", icon: Trophy },
  ];
  const select = (next: StudentTab) => {
    setTab(next);
    setMobileOpen(false);
  };
  return (
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
          <span className="student-avatar">يع</span>
          <div>
            <strong>ياسين محمد علي</strong>
            <small>روبوتكس مستوى 2</small>
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
          onClick={() => toast("تسجيل الخروج التجريبي")}
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
                <GraduationCap size={13} /> أهلًا يا ياسين
              </span>
              <h1>
                {tab === "home"
                  ? "رحلتك التعليمية مستمرة"
                  : nav.find(item => item.id === tab)?.label}
              </h1>
              <p>شاهد تقدمك وجلساتك وإنجازاتك من مساحة بسيطة ومركزة.</p>
            </div>
            <span className="student-demo">DEMO · حساب الطالب</span>
          </div>
          <div className="student-boundary">
            <ShieldCheck size={14} />
            <span>
              هذه مساحة قراءة مخصصة لك فقط — لا توجد فواتير أو بيانات أسرية أو
              أدوات إدارية.
            </span>
          </div>
          {tab === "home" && <HomeTab onNavigate={select} />}
          {tab === "sessions" && <SessionsTab />}
          {tab === "progress" && <ProgressTab />}
        </div>
      </main>
    </div>
  );
}
function HomeTab({ onNavigate }: { onNavigate: (tab: StudentTab) => void }) {
  return (
    <>
      <section className="student-hero-card">
        <div>
          <span>الجلسة القادمة</span>
          <h2>روبوتكس مستوى 2</h2>
          <p>
            <CalendarDays size={14} /> الأحد · ١٢:٠٠ م · معمل ١
          </p>
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
          value="88%"
          note="من آخر ٨ جلسات"
          tone="teal"
        />
        <Stat
          icon={<Trophy size={16} />}
          label="التقدم"
          value="72%"
          note="في المسار الحالي"
          tone="violet"
        />
        <Stat
          icon={<Star size={16} />}
          label="آخر تقييم"
          value="4.3 / 5"
          note="مراجعة أكاديمية"
          tone="amber"
        />
      </div>
      <div className="student-home-grid">
        <StudentProgressCard
          progress={72}
          currentUnit="الحساسات والحركة"
          nextCheckpoint="تحدي الوحدة"
          achievements={achievements}
        />
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
          </div>
        </section>
      </div>
    </>
  );
}
function SessionsTab() {
  return (
    <section className="student-panel student-detail-panel">
      <PanelTitle
        icon={<CalendarDays size={15} />}
        title="جلساتي"
        action={<span className="student-context">روبوتكس مستوى 2</span>}
      />
      <div className="student-session-list">
        {sessions.map(session => (
          <article
            className="student-session"
            key={`${session.date}-${session.unit}`}
          >
            <span
              className={`student-session-icon ${session.status === "قادمة" ? "upcoming" : "done"}`}
            >
              {session.status === "قادمة" ? (
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
            <b className={session.status === "قادمة" ? "upcoming" : "done"}>
              {session.status}
            </b>
          </article>
        ))}
      </div>
      <div className="student-note">
        <ShieldCheck size={14} /> الجلسات المعروضة هي الجلسات المسندة إلى حسابك
        فقط.
      </div>
    </section>
  );
}
function ProgressTab() {
  return (
    <div className="student-progress-layout">
      <StudentProgressCard
        progress={72}
        currentUnit="الحساسات والحركة"
        nextCheckpoint="تحدي الوحدة"
        achievements={achievements}
      />
      <section className="student-panel">
        <PanelTitle icon={<BookOpen size={15} />} title="المسار الحالي" />
        <div className="student-course-map">
          <CourseStep title="المقدمة والأمان" state="مكتمل" />
          <CourseStep title="دوائر التحكم" state="مكتمل" />
          <CourseStep title="الحساسات والحركة" state="جاري الآن" />
          <CourseStep title="تحدي الوحدة" state="قادم" />
        </div>
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
