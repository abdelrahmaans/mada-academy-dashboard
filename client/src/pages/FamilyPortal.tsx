import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  ShieldCheck,
  Star,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import ChildrenSwitcher, {
  type FamilyChild,
} from "@/components/ChildrenSwitcher";
import { RoleScopeProvider } from "@/contexts/RoleScopeContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, type ConsumerSessionRecord, type ConsumerStudentRecord } from "@/lib/apiClient";
import "@/components/RoleFoundation.css";

type PortalTab = "overview" | "attendance" | "evaluations" | "invoices";
type ChildData = FamilyChild & {
  attendance: number;
  progress: number;
  nextSession: string;
  nextRoom: string;
  lastEvaluation: string;
  invoiceStatus: string;
  invoiceDue: string;
  sessionRecords?: ConsumerSessionRecord[];
};

const CHILDREN: ChildData[] = [
  {
    id: "MAD-0248",
    name: "ياسين محمد علي",
    initials: "يع",
    course: "روبوتكس مستوى 2",
    branch: "مدينة نصر",
    color: "teal",
    attendance: 88,
    progress: 72,
    nextSession: "الأحد · ١٢:٠٠ م",
    nextRoom: "معمل ١",
    lastEvaluation: "بطاقة جاهزة · 4.3 / 5",
    invoiceStatus: "قسط متبقٍ",
    invoiceDue: "٢,٤٠٠ ج.م · يستحق ١ أكتوبر",
  },
  {
    id: "MAD-0247",
    name: "ليلى أحمد محمود",
    initials: "لم",
    course: "برمجة للمبتدئين",
    branch: "المعادي",
    color: "violet",
    attendance: 94,
    progress: 81,
    nextSession: "الثلاثاء · ١٠:٠٠ ص",
    nextRoom: "معمل ٢",
    lastEvaluation: "تمت المشاركة · 4.6 / 5",
    invoiceStatus: "مدفوع حتى أكتوبر",
    invoiceDue: "لا توجد مستحقات حالية",
  },
];

function mapFamilyChild(student: ConsumerStudentRecord, records: ConsumerSessionRecord[], index: number): ChildData {
  const ownSessions = records.filter(item => item.studentId === student.id);
  const marked = ownSessions.filter(item => item.attendanceStatus !== "UNMARKED");
  const attended = marked.filter(item => item.attendanceStatus === "PRESENT" || item.attendanceStatus === "LATE").length;
  const completed = ownSessions.filter(item => item.status === "COMPLETED").length;
  const next = ownSessions.filter(item => new Date(item.startAt).getTime() >= Date.now() && item.status !== "CANCELLED").sort((a, b) => a.startAt.localeCompare(b.startAt))[0];
  const lastEvaluation = ownSessions.filter(item => item.score !== null).sort((a, b) => b.startAt.localeCompare(a.startAt))[0];
  const mostRecent = ownSessions[0];
  const initials = student.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("");
  return {
    id: student.id, name: student.name, initials, color: index % 2 ? "violet" : "teal",
    course: mostRecent?.courseName ?? "لا توجد مجموعة مسجلة", branch: student.branchName ?? "—",
    attendance: marked.length ? Math.round(attended / marked.length * 100) : 0,
    progress: ownSessions.length ? Math.round(completed / ownSessions.length * 100) : 0,
    nextSession: next ? `${new Date(next.startAt).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "short" })} · ${new Date(next.startAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}` : "لا توجد جلسة قادمة مسجلة",
    nextRoom: next?.classroomName ?? "—",
    lastEvaluation: lastEvaluation ? `آخر تقييم · ${((lastEvaluation.score ?? 0) / 20).toFixed(1)} / 5` : "لا يوجد تقييم منشور",
    invoiceStatus: "غير متاح", invoiceDue: "بيانات الفواتير غير موصولة بهذه البوابة.", sessionRecords: ownSessions,
  };
}

export default function FamilyPortal() {
  const { me, logout } = useAuth();
  const [, navigate] = useLocation();
  const [children, setChildren] = useState<ChildData[]>(apiClient.hasSession() ? [] : CHILDREN);
  const [liveMode, setLiveMode] = useState(apiClient.hasSession());
  const [dataLoading, setDataLoading] = useState(apiClient.hasSession());
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(apiClient.hasSession() ? "" : CHILDREN[0].id);
  const [tab, setTab] = useState<PortalTab>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [supportRequested, setSupportRequested] = useState(false);
  const child = useMemo(() => children.find(item => item.id === selectedId) ?? children[0], [children, selectedId]);
  useEffect(() => {
    if (!apiClient.hasSession()) return;
    let cancelled = false;
    setLiveMode(true); setDataLoading(true); setChildren([]);
    Promise.all([apiClient.consumerStudents(), apiClient.consumerSessions()])
      .then(([students, sessions]) => {
        if (cancelled) return;
        const mapped = students.items.map((student, index) => mapFamilyChild(student, sessions.items, index));
        setChildren(mapped); setSelectedId(mapped[0]?.id ?? ""); setDataError(null);
      })
      .catch(error => { if (!cancelled) { setChildren([]); setDataError(error instanceof Error ? error.message : "تعذر تحميل بيانات الأسرة"); } })
      .finally(() => { if (!cancelled) setDataLoading(false); });
    return () => { cancelled = true; };
  }, []);
  const tabs: Array<{ id: PortalTab; label: string; icon: typeof Home }> = [
    { id: "overview", label: "ملخص الطفل", icon: Home },
    { id: "attendance", label: "الحضور", icon: CalendarDays },
    { id: "evaluations", label: "التقييمات", icon: Star },
    { id: "invoices", label: "الفواتير", icon: Wallet },
  ];
  const selectChild = (id: string) => {
    setSelectedId(id);
    setTab("overview");
    setMobileOpen(false);
  };
  return (
    <RoleScopeProvider
      roleCode="R08"
      roleLabel="ولي الأمر"
      scopeLevel="family"
      scopeLabel="الأطفال المرتبطون فقط"
      identityKind="consumer"
      tenantName="أكاديمية مدى"
      demo={!liveMode}
    >
      <div className="family-portal" dir="rtl">
      {mobileOpen && (
        <button
          className="family-portal-scrim"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`family-portal-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="family-portal-brand">
          <span>مدى</span>
          <small>بوابة الأسرة</small>
          <button
            type="button"
            aria-label="إغلاق القائمة"
            onClick={() => setMobileOpen(false)}
          >
            <X size={17} />
          </button>
        </div>
        <div className="family-parent-card">
          <span className="family-parent-avatar">م</span>
          <div>
            <strong>{me?.user?.displayName || "ولي الأمر"}</strong>
            <small>ولي الأمر · {children.length} طفل مرتبط</small>
          </div>
        </div>
        <div className="family-portal-label">مساحة الأسرة</div>
        <nav className="family-portal-nav">
          {tabs.map(item => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                className={tab === item.id ? "active" : ""}
                onClick={() => {
                  setTab(item.id);
                  setMobileOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="family-portal-spacer" />
        <button
          type="button"
          className="family-portal-help"
          onClick={() =>
            toast("الدعم الأسري قيد التجهيز", {
              description: "يمكن فتح تذكرة دعم بعد ربط حساب الأسرة.",
            })
          }
        >
          <HelpCircle size={17} />
          <span>
            <strong>تحتاجين مساعدة؟</strong>
            <small>تواصل مع الأكاديمية</small>
          </span>
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          className="family-portal-logout"
          onClick={() => { void logout().then(() => navigate("/login")); }}
        >
          <LogOut size={17} /> تسجيل الخروج
        </button>
      </aside>
      <main className="family-portal-main">
        <header className="family-portal-topbar">
          <button
            type="button"
            className="family-menu-button"
            aria-label="فتح القائمة"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div>
            <span>أكاديمية مدى</span>
            <small>بوابة الأسرة · بيانات مرتبطة بحسابك فقط</small>
          </div>
          <button
            type="button"
            className="family-notification"
            onClick={() => toast("لا توجد تنبيهات جديدة")}
          >
            <Bell size={18} />
          </button>
        </header>
        <div className="family-portal-content">
          <div className="family-portal-welcome">
            <div>
              <span className="family-kicker">
                <ShieldCheck size={13} /> R08 · Parent Portal
              </span>
              <h1>أهلًا {me?.user?.displayName || "بكم"}، تابع رحلة أطفالك</h1>
              <p>الحضور والتقدم والتقييمات والفواتير المرتبطة بأطفالك فقط.</p>
            </div>
            <span className="family-demo-badge">{liveMode ? "LIVE · بيانات الحساب" : "DEMO · معاينة محلية"}</span>
          </div>
          {dataLoading && <div className="family-info-note">جارٍ تحميل الأطفال والجلسات المرتبطة بحسابك…</div>}
          {dataError && <div className="family-info-note" role="alert">تعذر تحميل بيانات الأسرة: {dataError}</div>}
          {children.length > 0 && <ChildrenSwitcher
            children={children}
            selectedId={selectedId}
            onSelect={selectChild}
          />}
          {child && <section className="family-selected-child">
            <span className={`family-child-avatar large ${child.color}`}>
              {child.initials}
            </span>
            <div>
              <small>الطفل المحدد</small>
              <h2>{child.name}</h2>
              <p>
                {child.course} · {child.branch}
              </p>
            </div>
            <span className="family-active-status">
              <CheckCircle2 size={13} /> تسجيل نشط
            </span>
          </section>}
          {!dataLoading && !dataError && !child && <div className="family-info-note" role="status">لا توجد ملفات أطفال مرتبطة بهذا الحساب. تواصل مع الأكاديمية لربط الملف الصحيح.</div>}
          {child && tab === "overview" && <Overview child={child} onTab={setTab} liveMode={liveMode} />}
          {child && tab === "attendance" && <Attendance child={child} liveMode={liveMode} />}
          {child && tab === "evaluations" && <Evaluations child={child} liveMode={liveMode} />}
          {child && tab === "invoices" && (liveMode ? <section className="family-portal-panel family-detail-panel"><PanelTitle icon={<Wallet size={16} />} title="الفواتير والمدفوعات" /><div className="family-info-note"><AlertCircle size={14} /> بيانات الفواتير غير متاحة من الـAPI الحالي؛ لم نعرض أي مبالغ تجريبية على حساب حقيقي.</div></section> : <Invoices child={child} supportRequested={supportRequested} onRequestSupport={() => { setSupportRequested(true); toast.success("تم تسجيل طلب المراجعة في المعاينة فقط."); }} />)}
          <footer className="family-portal-privacy">
            <ShieldCheck size={14} />
            <span>
              خصوصيتك أولًا: لا يمكن لحساب الأسرة البحث عن أطفال آخرين أو تعديل
              بيانات حساسة مباشرة. أي طلب تصحيح أو دعم يمر بمراجعة الأكاديمية.
            </span>
          </footer>
        </div>
      </main>
      </div>
    </RoleScopeProvider>
  );
}

function Overview({
  child,
  onTab,
  liveMode,
}: {
  child: ChildData;
  onTab: (tab: PortalTab) => void;
  liveMode: boolean;
}) {
  return (
    <>
      <section className="family-metrics">
        <Metric
          icon={<CalendarDays size={17} />}
          label="الانتظام"
          value={`${child.attendance}%`}
          note="من آخر ٨ جلسات"
          tone="teal"
        />
        <Metric
          icon={<Activity size={17} />}
          label="التقدم"
          value={`${child.progress}%`}
          note="إكمال المسار الحالي"
          tone="violet"
        />
        <Metric
          icon={<Star size={17} />}
          label="آخر تقييم"
          value={child.lastEvaluation.split("·")[1]?.trim() ?? "—"}
          note="مراجعة أكاديمية"
          tone="amber"
        />
        <Metric
          icon={<Wallet size={17} />}
          label={liveMode ? "الفواتير" : "الحالة المالية"}
          value={child.invoiceStatus}
          note={child.invoiceDue}
          tone="blue"
        />
      </section>
      <div className="family-overview-grid">
        <section className="family-portal-panel">
          <PanelTitle
            icon={<CalendarDays size={16} />}
            title="الجلسة القادمة"
            action={
              <button type="button" onClick={() => onTab("attendance")}>
                عرض الحضور <ChevronLeft size={13} />
              </button>
            }
          />
          <div className="family-next-session">
            <span>
              <CalendarDays size={19} />
            </span>
            <div>
              <strong>{child.nextSession}</strong>
              <small>
                {child.course} · {child.nextRoom} · فرع {child.branch}
              </small>
            </div>
            <b>قادمة</b>
          </div>
        </section>
        <section className="family-portal-panel">
          <PanelTitle
            icon={<Star size={16} />}
            title="آخر متابعة أكاديمية"
            action={
              <button type="button" onClick={() => onTab("evaluations")}>
                عرض التقييم <ChevronLeft size={13} />
              </button>
            }
          />
          <div className="family-evaluation-preview">
            <span className="family-score">
              {child.lastEvaluation.split("·")[1]?.trim() ?? "—"}
            </span>
            <div>
              <strong>بطاقة التقييم الأكاديمية</strong>
              <small>تظهر بعد مراجعة رئيس المدربين ومشاركة البطاقة.</small>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
function Attendance({ child, liveMode }: { child: ChildData; liveMode: boolean }) {
  const demoDays = [
    { value: 88, label: "متأخر" },
    { value: 100, label: "حاضر" },
    { value: 75, label: "حضور جزئي" },
    { value: 100, label: "حاضر" },
    { value: 88, label: "متأخر" },
    { value: 100, label: "حاضر" },
    { value: 88, label: "متأخر" },
    { value: 100, label: "حاضر" },
  ];
  const days = liveMode
    ? (child.sessionRecords ?? []).slice(0, 8).map(item => ({ value: item.attendanceStatus === "PRESENT" ? 100 : item.attendanceStatus === "LATE" ? 80 : item.attendanceStatus === "EXCUSED" ? 100 : 0, label: item.attendanceStatus === "PRESENT" ? "حاضر" : item.attendanceStatus === "LATE" ? "متأخر" : item.attendanceStatus === "EXCUSED" ? "بعذر" : item.attendanceStatus === "ABSENT" ? "غائب" : "لم يسجل", date: new Date(item.startAt).toLocaleDateString("ar-EG", { day: "numeric", month: "short" }) }))
    : demoDays;
  return (
    <section className="family-portal-panel family-detail-panel">
      <PanelTitle
        icon={<CalendarDays size={16} />}
        title="سجل الحضور"
        action={<span className="family-context">{liveMode ? "من سجل الجلسات" : "آخر ٨ جلسات"}</span>}
      />
      <div className="family-attendance-hero">
        <strong>{child.attendance}%</strong>
        <span>انتظام الحضور</span>
        <small>{liveMode ? "محسوب من سجلات الحضور المحفوظة" : "مؤشر توضيحي مرتبط بالطفل المحدد"}</small>
      </div>
      {liveMode && days.length === 0 && <div className="family-info-note">لا توجد سجلات حضور لهذا الطفل بعد.</div>}
      <div className="family-attendance-list">
        {days.map((day, index) => (
          <div key={index}>
            <span>{liveMode ? ((day as { date?: string }).date ?? `الجلسة ${index + 1}`) : `الجلسة ${index + 1}`}</span>
            <i>
              <em style={{ width: `${day.value}%` }} />
            </i>
            <b>{day.label}</b>
          </div>
        ))}
      </div>
      <div className="family-info-note">
        <CheckCircle2 size={14} /> إذا تغيبت الأسرة عن جلسة، تواصلوا مع الفرع
        لتسجيل سبب الغياب أو طلب التعويض حسب السياسة.
      </div>
    </section>
  );
}
function Evaluations({ child, liveMode }: { child: ChildData; liveMode: boolean }) {
  const evaluation = (child.sessionRecords ?? []).filter(item => item.score !== null).sort((a, b) => b.startAt.localeCompare(a.startAt))[0];
  return (
    <section className="family-portal-panel family-detail-panel">
      <PanelTitle
        icon={<Star size={16} />}
        title="التقييمات الأكاديمية"
        action={<span className="family-context">{liveMode ? "النتائج المنشورة" : "مرئية بعد المراجعة"}</span>}
      />
      {liveMode && (evaluation ? <><div className="family-rubric-grid"><Rubric label="التقييم العام" value={((evaluation.score ?? 0) / 20).toFixed(1)} /></div><div className="family-evaluation-message"><MessageCircle size={17} /><div><strong>ملاحظة المدرب · {evaluation.courseName}</strong><p>{evaluation.notes || "لا توجد ملاحظة نصية."}</p></div></div></> : <div className="family-info-note">لا يوجد تقييم منشور لهذا الطفل حتى الآن.</div>)}
      {!liveMode && <>
      <div className="family-rubric-grid">
        <Rubric label="استيعاب الفكرة" value="4.5" />
        <Rubric label="التطبيق العملي" value="4.2" />
        <Rubric label="التعاون والمبادرة" value="4.3" />
      </div>
      <div className="family-evaluation-message">
        <MessageCircle size={17} />
        <div>
          <strong>ملاحظة المدرب</strong>
          <p>
            تقدم جيد في ترتيب الخطوات وتجربة الحلول، ونوصي بالاستمرار في شرح
            الفكرة بصوت عالٍ.
          </p>
        </div>
      </div>
      </>}
      <div className="family-info-note">
        <ShieldCheck size={14} /> {liveMode ? "تظهر هنا المعلومات التي أتاحها النظام لحساب الأسرة فقط." : "التقييم الذي يظهر هنا تمت مراجعته أكاديميًا؛ طلب التصحيح يحتاج تواصلًا مع الأكاديمية."}
      </div>
    </section>
  );
}
function Invoices({ child, supportRequested, onRequestSupport }: { child: ChildData; supportRequested: boolean; onRequestSupport: () => void }) {
  const paid = child.invoiceStatus.includes("مدفوع");
  return (
    <section className="family-portal-panel family-detail-panel">
      <PanelTitle
        icon={<Wallet size={16} />}
        title="الفواتير والمدفوعات"
        action={<span className="family-context">للطفل المحدد فقط</span>}
      />
      <div className={`family-invoice-card ${paid ? "paid" : "due"}`}>
        <span>
          {paid ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        </span>
        <div>
          <small>الفاتورة الحالية · {child.course}</small>
          <strong>{child.invoiceStatus}</strong>
          <p>{child.invoiceDue}</p>
        </div>
        <button
          type="button"
          onClick={onRequestSupport}
          disabled={supportRequested}
        >
          {supportRequested ? "تم إرسال طلب المراجعة" : "طلب مراجعة الفاتورة"}
        </button>
      </div>
      <div className="family-info-note">
        <AlertCircle size={14} /> هذه معاينة للعرض فقط. لا يتم الدفع أو تغيير
        الفاتورة من بوابة الأسرة حاليًا؛ طلب المراجعة يمر عبر الأكاديمية.
      </div>
    </section>
  );
}
function Rubric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>
        {value}
        <small>/ 5</small>
      </strong>
    </div>
  );
}
function Metric({
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
    <article className="family-metric">
      <span className={`family-metric-icon ${tone}`}>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{note}</span>
    </article>
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
    <div className="family-panel-title">
      <div>
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
