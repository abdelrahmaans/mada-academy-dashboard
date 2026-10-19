import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  ShieldCheck,
  Snowflake,
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
import {
  apiClient,
  freezeStorage,
  type ConsumerSessionRecord,
  type ConsumerStudentRecord,
  type CreateFreezeRequestInput,
  type FinanceInvoice,
  type SubscriptionFreezeRequest,
} from "@/lib/apiClient";
import { sessionsForStudent } from "@/lib/consumerScope";
import "@/components/RoleFoundation.css";

type PortalTab = "overview" | "attendance" | "evaluations" | "invoices" | "freeze";
type ChildData = FamilyChild & {
  attendance: number;
  progress: number;
  nextSession: string;
  nextRoom: string;
  lastEvaluation: string;
  invoiceStatus: string;
  invoiceDue: string;
  sessionRecords?: ConsumerSessionRecord[];
  invoices?: FinanceInvoice[];
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
  const ownSessions = sessionsForStudent(records, student.id);
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
    invoiceStatus: "غير متاح", invoiceDue: "بيانات الفواتير غير موصولة بهذه البوابة.", sessionRecords: ownSessions, invoices: [],
  };
}

export default function FamilyPortal() {
  const { me, logout } = useAuth();
  const [, navigate] = useLocation();
  const isParentAccount = me?.role === "R08_PARENT" || me?.accountType === "parent";

  const [children, setChildren] = useState<ChildData[]>(isParentAccount ? [] : CHILDREN);
  const [liveMode, setLiveMode] = useState(isParentAccount);
  const [dataLoading, setDataLoading] = useState(isParentAccount);
  const [dataError, setDataError] = useState<string | null>(null);
  const [dataWarning, setDataWarning] = useState<string | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(isParentAccount);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [selectedId, setSelectedId] = useState(isParentAccount ? "" : CHILDREN[0].id);
  const [tab, setTab] = useState<PortalTab>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [supportRequested, setSupportRequested] = useState(false);
  const child = useMemo(() => children.find(item => item.id === selectedId) ?? children[0], [children, selectedId]);

  useEffect(() => {
    if (!isParentAccount) {
      setLiveMode(false);
      setDataLoading(false);
      setInvoiceLoading(false);
      setChildren(CHILDREN);
      setSelectedId(CHILDREN[0]?.id ?? "");
      return;
    }
    let cancelled = false;
    let invoiceItems: FinanceInvoice[] = [];
    let invoiceState: "loading" | "ready" | "error" = "loading";
    setLiveMode(true); setDataLoading(true); setInvoiceLoading(true); setChildren([]);
    setDataError(null); setDataWarning(null); setInvoiceError(null);
    const studentsRequest = apiClient.consumerStudents();
    const sessionsRequest = apiClient.consumerSessions();
    const invoicesRequest = apiClient.consumerInvoices();
    const applyInvoices = (items: ChildData[]) => items.map(item => {
      if (invoiceState === "loading") return { ...item, invoices: [], invoiceStatus: "جارٍ التحميل", invoiceDue: "يتم جلب بيانات الفواتير…" };
      if (invoiceState === "error") return { ...item, invoices: [], invoiceStatus: "غير متاح", invoiceDue: "تعذر تحميل بيانات الفواتير." };
      const invoices = invoiceItems.filter(invoice => invoice.studentId === item.id);
      const outstanding = invoices.reduce((sum, invoice) => sum + invoice.remainingPiastres, 0);
      return { ...item, invoices, invoiceStatus: invoices.length === 0 ? "لا توجد فواتير" : outstanding > 0 ? "قسط متبقٍ" : "مدفوع", invoiceDue: invoices.find(invoice => invoice.remainingPiastres > 0)?.dueDate ?? "لا توجد مستحقات حالية" };
    });
    Promise.allSettled([studentsRequest, sessionsRequest]).then(([studentsResult, sessionsResult]) => {
      if (cancelled) return;
      setDataLoading(false);
      if (studentsResult.status === "rejected") {
        const message = studentsResult.reason instanceof Error ? studentsResult.reason.message : "تعذر تحميل الأطفال المرتبطين بالحساب.";
        setChildren([]); setDataError(message); toast.error(message); return;
      }
      const sessions = sessionsResult.status === "fulfilled" ? sessionsResult.value.items : [];
      const mapped = applyInvoices(studentsResult.value.items.map((student, index) => mapFamilyChild(student, sessions, index)));
      setChildren(mapped); setSelectedId(current => mapped.some(item => item.id === current) ? current : mapped[0]?.id ?? ""); setDataError(null);
      if (sessionsResult.status === "rejected") {
        const message = sessionsResult.reason instanceof Error ? sessionsResult.reason.message : "تعذر تحميل جلسات الأطفال.";
        setDataWarning(message); toast.error(`تعذر تحميل الجلسات: ${message}`);
      }
    });
    invoicesRequest.then(response => {
      if (cancelled) return;
      invoiceItems = response.items;
      invoiceState = "ready";
      setInvoiceLoading(false); setInvoiceError(null);
      setChildren(current => applyInvoices(current));
    }).catch(error => {
      if (cancelled) return;
      const message = error instanceof Error ? error.message : "تعذر تحميل فواتير الأطفال.";
      invoiceState = "error";
      setInvoiceLoading(false); setInvoiceError(message); toast.error(`تعذر تحميل الفواتير: ${message}`);
      setChildren(current => applyInvoices(current));
    });
    Promise.allSettled([studentsRequest, sessionsRequest, invoicesRequest]).then(results => {
      if (cancelled || retryKey === 0) return;
      if (results.every(result => result.status === "fulfilled")) toast.success("تم تحديث بيانات بوابة الأسرة");
    });
    return () => { cancelled = true; };
  }, [retryKey, isParentAccount]);
  const retry = () => setRetryKey(value => value + 1);
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "") as PortalTab;
      const validTabs: PortalTab[] = ["overview", "attendance", "evaluations", "invoices", "freeze"];
      if (validTabs.includes(hash)) {
        setTab(hash);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const selectTab = (nextTab: PortalTab) => {
    setTab(nextTab);
    window.location.hash = nextTab === "overview" ? "" : nextTab;
    setMobileOpen(false);
  };

  const tabs: Array<{ id: PortalTab; label: string; icon: typeof Home }> = [
    { id: "overview", label: "ملخص الطفل", icon: Home },
    { id: "attendance", label: "الحضور", icon: CalendarDays },
    { id: "evaluations", label: "التقييمات", icon: Star },
    { id: "invoices", label: "الفواتير", icon: Wallet },
    { id: "freeze", label: "تجميد وتعويض", icon: Snowflake },
  ];
  const selectChild = (id: string) => {
    setSelectedId(id);
    selectTab("overview");
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
      <div className={`family-portal ${mobileOpen ? "sidebar-open" : ""}`} dir="rtl">
      {mobileOpen && (
        <button
          className="family-portal-scrim"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside id="family-portal-sidebar" className={`family-portal-sidebar ${mobileOpen ? "open" : ""}`}>
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
                onClick={() => selectTab(item.id)}
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
            aria-expanded={mobileOpen}
            aria-controls="family-portal-sidebar"
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
          {dataError && <div className="family-info-note" role="alert">تعذر تحميل بيانات الأسرة: {dataError} <button type="button" onClick={retry}>إعادة المحاولة</button></div>}
          {dataWarning && !dataError && <div className="family-info-note" role="status">تم تحميل الأطفال، لكن الجلسات غير متاحة مؤقتًا: {dataWarning} <button type="button" onClick={retry}>إعادة المحاولة</button></div>}

          {!isParentAccount && (
            <div className="family-info-note" style={{ background: "rgba(12, 117, 105, 0.08)", borderColor: "rgba(12, 117, 105, 0.25)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px" }} role="note">
              <span><strong>معاينة بوابة الأسرة:</strong> أنت الآن في وضع العرض التوضيحي. لتجربة الربط المباشر مع بيانات الأبناء الحقيقية والفواتير:</span>
              <button
                type="button"
                className="button button-primary"
                style={{ padding: "6px 14px", fontSize: "0.84rem" }}
                onClick={async () => {
                  try {
                    await apiClient.login("+201000000011", "Mada@2026", "parent");
                    window.location.reload();
                  } catch {
                    toast.error("تعذر الدخول بحساب ولي الأمر");
                  }
                }}
              >
                الدخول كولي أمر (Youssef's Parent)
              </button>
            </div>
          )}
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
          {child && tab === "overview" && <Overview child={child} onTab={selectTab} liveMode={liveMode} />}
          {child && tab === "attendance" && <Attendance child={child} liveMode={liveMode} />}
          {child && tab === "evaluations" && <Evaluations child={child} liveMode={liveMode} />}
          {child && tab === "invoices" && (liveMode ? <LiveInvoices invoices={child.invoices ?? []} loading={invoiceLoading} error={invoiceError} onRetry={retry} /> : <Invoices child={child} supportRequested={supportRequested} onRequestSupport={() => { setSupportRequested(true); toast.success("تم تسجيل طلب المراجعة في المعاينة فقط."); }} />)}
          {child && tab === "freeze" && <FreezeSection child={child} liveMode={liveMode} />}
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
function FreezeSection({ child, liveMode }: { child: ChildData; liveMode: boolean }) {
  const [requests, setRequests] = useState<SubscriptionFreezeRequest[]>(() => {
    return freezeStorage.getRequests().filter(r => r.studentId === child.id);
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    reason: "TRAVEL" as const,
    reasonText: "",
  });

  useEffect(() => {
    if (liveMode) {
      apiClient.consumerFreezeRequests()
        .then(res => {
          const matching = res.filter(r => r.studentId === child.id);
          setRequests(matching.length > 0 ? matching : freezeStorage.getRequests().filter(r => r.studentId === child.id));
        })
        .catch(() => {
          setRequests(freezeStorage.getRequests().filter(r => r.studentId === child.id));
        });
    }
  }, [child.id, liveMode]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reasonText.trim()) {
      toast.error("يرجى كتابة سبب التجميد بالتفصيل");
      return;
    }
    if (liveMode) {
      try {
        const liveCreated = await apiClient.createConsumerFreezeRequest({
          studentId: child.id,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          reasonText: formData.reasonText,
        });
        setRequests(prev => [liveCreated, ...prev]);
        setModalOpen(false);
        setFormData({
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          reason: "TRAVEL",
          reasonText: "",
        });
        toast.success("تم إرسال طلب التجميد بنجاح إلى مدير الفرع للمراجعة");
        return;
      } catch {
        // Fallback to offline storage if backend is unreachable
      }
    }
    const created = freezeStorage.createRequest({
      studentId: child.id,
      studentName: child.name,
      courseName: child.course,
      branchName: child.branch,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      reasonText: formData.reasonText,
      submittedByRole: "R08_PARENT",
      submittedByName: "ولي الأمر",
    });
    setRequests(prev => [created, ...prev]);
    setModalOpen(false);
    setFormData({
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      reason: "TRAVEL",
      reasonText: "",
    });
    toast.success("تم إرسال طلب التجميد بنجاح إلى مدير الفرع للمراجعة");
  };

  const totalMakeUpCredits = requests
    .filter(r => r.status === "APPROVED")
    .reduce((sum, r) => sum + r.makeUpCreditsAwarded, 0);

  return (
    <section className="family-portal-panel family-detail-panel">
      <PanelTitle
        icon={<Snowflake size={16} />}
        title="تجميد الاشتراك وحصص التعويض"
        action={
          <button
            type="button"
            className="button button-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", fontSize: "0.85rem" }}
            onClick={() => setModalOpen(true)}
          >
            <Plus size={15} /> طلب تجميد جديد
          </button>
        }
      />

      <div className="family-metrics" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <Metric
          icon={<Snowflake size={17} />}
          label="حالة التجميد الحالية"
          value={requests.some(r => r.status === "APPROVED") ? "اشتراك ممتد" : "نشط بدون تجميد"}
          note="طبقًا لقرارات الفرع"
          tone="teal"
        />
        <Metric
          icon={<Clock size={17} />}
          label="رصيد حصص التعويض"
          value={`${totalMakeUpCredits} حصة`}
          note="متاحة للتسكين البديل"
          tone="violet"
        />
        <Metric
          icon={<AlertCircle size={17} />}
          label="الطلبات المعلقة"
          value={`${requests.filter(r => r.status === "PENDING").length} طلب`}
          note="قيد مراجعة الإدارة"
          tone="amber"
        />
      </div>

      <div className="family-info-note" style={{ background: "rgba(14, 165, 233, 0.08)", borderColor: "rgba(14, 165, 233, 0.25)" }}>
        <ShieldCheck size={16} style={{ color: "var(--color-primary, #0c7569)", flexShrink: 0 }} />
        <span>
          <strong>سياسة التجميد بالأكاديمية:</strong> يتاح لكل طالب تجميد الاشتراك لمرة واحدة بحد أقصى ٣٠ يومًا سنويًا بعذر مقبول (سفر، طبي، امتحانات). يتم ترحيل تاريخ انتهاء الاشتراك تلقائيًا عند الاعتماد وإضافة رصيد حصص تعويضية.
        </span>
      </div>

      <div style={{ marginTop: "1.2rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.8rem", color: "var(--foreground, #1e293b)" }}>
          سجل طلبات التجميد السابقة
        </h3>

        {requests.length === 0 ? (
          <div className="family-info-note">لا توجد طلبات تجميد مسجلة لهذا الطفل حتى الآن.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {requests.map(req => {
              const statusBadge =
                req.status === "APPROVED"
                  ? { label: "معتمد · تم التمديد", bg: "rgba(16, 185, 129, 0.12)", color: "#059669" }
                  : req.status === "REJECTED"
                  ? { label: "مرفوض", bg: "rgba(239, 68, 68, 0.12)", color: "#dc2626" }
                  : { label: "قيد المراجعة", bg: "rgba(245, 158, 11, 0.12)", color: "#d97706" };

              return (
                <div
                  key={req.id}
                  style={{
                    border: "1px solid var(--border, #e2e8f0)",
                    borderRadius: "10px",
                    padding: "14px 18px",
                    background: "var(--card, #ffffff)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--foreground, #0f172a)" }}>
                        {req.id}
                      </span>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "12px",
                          background: statusBadge.bg,
                          color: statusBadge.color,
                        }}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                      فترة التجميد: من {req.startDate} إلى {req.endDate}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: "0.86rem", color: "#334155" }}>
                    <strong>السبب:</strong> {req.reasonText} ({req.reason === "MEDICAL" ? "طبي" : req.reason === "TRAVEL" ? "سفر" : req.reason === "EXAMS" ? "امتحانات" : "عائلي"})
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", fontSize: "0.8rem", color: "#64748b", borderTop: "1px dashed #e2e8f0", paddingTop: "8px", marginTop: "4px" }}>
                    <span>الحصص المتأثرة: <b>{req.affectedSessionsCount} حصص</b> · رصيد التعويض الممنوح: <b>{req.makeUpCreditsAwarded}</b></span>
                    {req.extendedNewEndDate && (
                      <span style={{ color: "#059669", fontWeight: 600 }}>
                        تاريخ الانتهاء الجديد للاشتراك: {req.extendedNewEndDate}
                      </span>
                    )}
                    {req.decisionNote && (
                      <span style={{ width: "100%", color: "#475569", background: "rgba(241, 245, 249, 0.6)", padding: "4px 8px", borderRadius: "6px" }}>
                        ملاحظة الإدارة: {req.decisionNote}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="dialog-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <section className="dialog-card" role="dialog" aria-modal="true" style={{ maxWidth: "480px" }}>
            <button className="dialog-close" aria-label="إغلاق" onClick={() => setModalOpen(false)}>
              <X size={17} />
            </button>
            <div className="team-dialog-heading">
              <span className="approval-id">R08 · طلب تجميد</span>
              <h2>طلب تجميد اشتراك لـ {child.name}</h2>
              <p>سيتم ترحيل تاريخ انتهاء الاشتراك واحتساب رصيد حصص تعويضية فور الاعتماد من مدير الفرع.</p>
            </div>

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px" }}>تاريخ بدء التجميد</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px" }}>تاريخ نهاية التجميد</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px" }}>تصنيف السبب</label>
                <select
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value as any })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                >
                  <option value="TRAVEL">سفر ورحلات عائلية</option>
                  <option value="MEDICAL">ظروف صحية أو إجازة مرضية</option>
                  <option value="EXAMS">امتحانات واختبارات مدرسية</option>
                  <option value="FAMILY">ظروف أسرية خاصة</option>
                  <option value="OTHER">سبب آخر</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px" }}>تفاصيل السبب (إلزامي للـ Audit)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="يرجى كتابة تفاصيل سبب التجميد لتسريع المراجعة من مدير الفرع..."
                  value={formData.reasonText}
                  onChange={e => setFormData({ ...formData, reasonText: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button type="button" className="button button-secondary" onClick={() => setModalOpen(false)}>
                  إلغاء
                </button>
                <button type="submit" className="button button-primary">
                  إرسال الطلب للاعتماد
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

function LiveInvoices({ invoices, loading, error, onRetry }: { invoices: FinanceInvoice[]; loading: boolean; error: string | null; onRetry: () => void }) {
  return <section className="family-portal-panel family-detail-panel"><PanelTitle icon={<Wallet size={16} />} title="الفواتير والمدفوعات" />
    {loading ? <div className="family-info-note" role="status">جارٍ تحميل فواتير الأطفال المرتبطين…</div> : error ? <div className="family-info-note" role="alert"><AlertCircle size={14} /> تعذر تحميل الفواتير: {error} <button type="button" onClick={onRetry}>إعادة المحاولة</button></div> : invoices.length === 0 ? <div className="family-info-note"><AlertCircle size={14} /> لا توجد فواتير مرتبطة بهذا الملف حاليًا.</div> : <div className="family-invoice-list">{invoices.map(invoice => <article className="family-invoice-card" key={invoice.id}><div><strong>{invoice.invoiceNumber}</strong><small>استحقاق {invoice.dueDate} · {invoice.status}</small></div><div><b>{(invoice.remainingPiastres / 100).toLocaleString("ar-EG")} ج.م متبقي</b><small>الإجمالي {(invoice.totalPiastres / 100).toLocaleString("ar-EG")} · المدفوع {(invoice.paidPiastres / 100).toLocaleString("ar-EG")}</small></div></article>)}</div>}
    <div className="family-info-note"><ShieldCheck size={14} /> عرض للقراءة فقط؛ تسجيل التحصيل وإثباتاته يتم عبر الأكاديمية.</div>
  </section>;
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
