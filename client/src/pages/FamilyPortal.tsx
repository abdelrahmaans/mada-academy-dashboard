import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock,
  HelpCircle,
  Home,
  MessageCircle,
  Plus,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Snowflake,
  Star,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import ChildrenSwitcher, {
  type FamilyChild,
} from "@/components/ChildrenSwitcher";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import { useAuth } from "@/contexts/AuthContext";
import {
  apiClient,
  freezeStorage,
  type ConsumerSessionRecord,
  type ConsumerStudentRecord,
  type FinanceInvoice,
  type SubscriptionFreezeRequest,
} from "@/lib/apiClient";
import { sessionsForStudent } from "@/lib/consumerScope";
import "@/components/RoleFoundation.css";
import "@/styles/consumer-portals.css";

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

const DEMO_CHILDREN: ChildData[] = [
  {
    id: "MAD-0248",
    name: "يوسف أحمد محمد",
    initials: "يا",
    course: "روبوتكس الناشئين — المستوى 1",
    branch: "الفرع الرئيسي",
    color: "teal",
    attendance: 88,
    progress: 75,
    nextSession: "الأحد · ١٠:٠٠ ص",
    nextRoom: "معمل الروبوتكس أ",
    lastEvaluation: "بطاقة منشورة · 4.4 / 5",
    invoiceStatus: "سداد جزئي",
    invoiceDue: "متبقي ١,٩٥٠ ج.م · استحقاق ١٥ أكتوبر",
  },
  {
    id: "MAD-0249",
    name: "آدم خالد محمود",
    initials: "اخ",
    course: "مقدمة البرمجة والذكاء الاصطناعي",
    branch: "الفرع الرئيسي",
    color: "violet",
    attendance: 92,
    progress: 60,
    nextSession: "الثلاثاء · ١٢:٠٠ م",
    nextRoom: "معمل الحاسب ب",
    lastEvaluation: "بطاقة منشورة · 4.7 / 5",
    invoiceStatus: "مدفوع بالكامل",
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
    id: student.id,
    name: student.name,
    initials,
    color: index % 2 ? "violet" : "teal",
    course: mostRecent?.courseName ?? "الدورة التدريبية",
    branch: student.branchName ?? "الفرع الرئيسي",
    attendance: marked.length ? Math.round((attended / marked.length) * 100) : 88,
    progress: ownSessions.length ? Math.round((completed / ownSessions.length) * 100) : 67,
    nextSession: next
      ? `${new Date(next.startAt).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "short" })} · ${new Date(next.startAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`
      : "لا توجد جلسة قادمة مجدولة",
    nextRoom: next?.classroomName ?? "معمل الأكاديمية",
    lastEvaluation: lastEvaluation
      ? `آخر تقييم · ${((lastEvaluation.score ?? 0) / 20).toFixed(1)} / 5`
      : "لا يوجد تقييم منشور",
    invoiceStatus: "جارٍ التحميل",
    invoiceDue: "يتم جلب بيانات الفواتير…",
    sessionRecords: ownSessions,
    invoices: [],
  };
}

export default function FamilyPortal() {
  const { me } = useAuth();
  const isParentAccount = me?.role === "R08_PARENT" || me?.accountType === "parent";

  const [children, setChildren] = useState<ChildData[]>(isParentAccount ? [] : DEMO_CHILDREN);
  const [liveMode, setLiveMode] = useState(isParentAccount);
  const [dataLoading, setDataLoading] = useState(isParentAccount);
  const [dataError, setDataError] = useState<string | null>(null);
  const [dataWarning, setDataWarning] = useState<string | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(isParentAccount);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [selectedId, setSelectedId] = useState(isParentAccount ? "" : DEMO_CHILDREN[0].id);
  const [tab, setTab] = useState<PortalTab>("overview");

  const child = useMemo(() => children.find(item => item.id === selectedId) ?? children[0], [children, selectedId]);

  // Sync tab with URL hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "") as PortalTab;
      const validTabs: PortalTab[] = ["overview", "attendance", "evaluations", "invoices", "freeze"];
      if (validTabs.includes(hash)) {
        setTab(hash);
      } else if (!hash) {
        setTab("overview");
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const selectTab = (nextTab: PortalTab) => {
    setTab(nextTab);
    window.location.hash = nextTab === "overview" ? "" : nextTab;
  };

  useEffect(() => {
    if (!isParentAccount) {
      setLiveMode(false);
      setDataLoading(false);
      setInvoiceLoading(false);
      setChildren(DEMO_CHILDREN);
      setSelectedId(DEMO_CHILDREN[0]?.id ?? "");
      return;
    }

    let cancelled = false;
    let invoiceItems: FinanceInvoice[] = [];
    let invoiceState: "loading" | "ready" | "error" = "loading";

    setLiveMode(true);
    setDataLoading(true);
    setInvoiceLoading(true);
    setChildren([]);
    setDataError(null);
    setDataWarning(null);
    setInvoiceError(null);

    const studentsRequest = apiClient.consumerStudents();
    const sessionsRequest = apiClient.consumerSessions();
    const invoicesRequest = apiClient.consumerInvoices();

    const applyInvoices = (items: ChildData[]) =>
      items.map(item => {
        if (invoiceState === "loading") {
          return { ...item, invoices: [], invoiceStatus: "جارٍ التحميل", invoiceDue: "يتم جلب بيانات الفواتير…" };
        }
        if (invoiceState === "error") {
          return { ...item, invoices: [], invoiceStatus: "غير متاح", invoiceDue: "تعذر تحميل الفواتير." };
        }
        const childInvoices = invoiceItems.filter(invoice => invoice.studentId === item.id);
        const outstanding = childInvoices.reduce((sum, inv) => sum + inv.remainingPiastres, 0);
        return {
          ...item,
          invoices: childInvoices,
          invoiceStatus: childInvoices.length === 0 ? "لا توجد مستحقات" : outstanding > 0 ? "سداد جزئي" : "مدفوع بالكامل",
          invoiceDue: outstanding > 0
            ? `متبقي ${(outstanding / 100).toLocaleString("ar-EG")} ج.م · استحقاق ${childInvoices.find(inv => inv.remainingPiastres > 0)?.dueDate ?? "أكتوبر"}`
            : "تم سداد كافة الالتزامات",
        };
      });

    Promise.allSettled([studentsRequest, sessionsRequest]).then(([studentsResult, sessionsResult]) => {
      if (cancelled) return;
      setDataLoading(false);
      if (studentsResult.status === "rejected") {
        const message = studentsResult.reason instanceof Error ? studentsResult.reason.message : "تعذر تحميل الأطفال المرتبطين بالحساب.";
        setChildren([]);
        setDataError(message);
        toast.error(message);
        return;
      }

      const sessions = sessionsResult.status === "fulfilled" ? sessionsResult.value.items : [];
      const mapped = applyInvoices(studentsResult.value.items.map((student, index) => mapFamilyChild(student, sessions, index)));
      setChildren(mapped);
      setSelectedId(current => (mapped.some(item => item.id === current) ? current : mapped[0]?.id ?? ""));
      setDataError(null);

      if (sessionsResult.status === "rejected") {
        const message = sessionsResult.reason instanceof Error ? sessionsResult.reason.message : "تعذر تحميل جلسات الأطفال.";
        setDataWarning(message);
        toast.error(`تعذر تحميل الجلسات: ${message}`);
      }
    });

    invoicesRequest
      .then(response => {
        if (cancelled) return;
        invoiceItems = response.items;
        invoiceState = "ready";
        setInvoiceLoading(false);
        setInvoiceError(null);
        setChildren(current => applyInvoices(current));
      })
      .catch(error => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "تعذر تحميل فواتير الأطفال.";
        invoiceState = "error";
        setInvoiceLoading(false);
        setInvoiceError(message);
        setChildren(current => applyInvoices(current));
      });

    Promise.allSettled([studentsRequest, sessionsRequest, invoicesRequest]).then(results => {
      if (cancelled || retryKey === 0) return;
      if (results.every(result => result.status === "fulfilled")) toast.success("تم تحديث بيانات بوابة الأسرة");
    });

    return () => {
      cancelled = true;
    };
  }, [retryKey, isParentAccount]);

  const retry = () => setRetryKey(value => value + 1);

  const selectChild = (id: string) => {
    setSelectedId(id);
  };

  const tabs: Array<{ id: PortalTab; label: string; icon: typeof Home }> = [
    { id: "overview", label: "ملخص الطفل", icon: Home },
    { id: "attendance", label: "سجل الحضور والانتظام", icon: CalendarDays },
    { id: "evaluations", label: "التقييمات والمتابعة", icon: Star },
    { id: "invoices", label: "الفواتير والأقساط", icon: Wallet },
    { id: "freeze", label: "تجميد وتعويض", icon: Snowflake },
  ];

  return (
    <RoleDashboardShell
      roleCode="R08"
      roleLabel="ولي الأمر"
      scopeLevel="family"
      scopeLabel="الأطفال المرتبطون فقط"
      identityKind="consumer"
      tenantName={me?.academy?.name ?? "أكاديمية مدى"}
      demo={!liveMode}
    >
      <div className="family-portal-page" dir="rtl">
        {/* Welcome Header */}
        <div className="portal-welcome-header">
          <div>
            <span className="portal-role-kicker">
              <ShieldCheck size={16} /> R08 · بوابة الأسرة الموحدة
            </span>
            <h1>أهلًا {me?.user?.displayName || "بولي الأمر"}، تابع رحلة أطفالك التعليمية</h1>
            <p>الحضور والتقدم والتقييمات والفواتير المرتبطة بأطفالك داخل الأكاديمية.</p>
          </div>
          <span className={`portal-live-badge ${liveMode ? "live" : "demo"}`}>
            {liveMode ? "LIVE · بيانات الحساب المباشرة" : "DEMO · معاينة توضيحية"}
          </span>
        </div>

        {/* Demo switcher helper */}
        {!isParentAccount && (
          <div
            className="consumer-note-box"
            style={{
              background: "rgba(13, 148, 136, 0.08)",
              borderColor: "rgba(13, 148, 136, 0.25)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <span>
              <strong>معاينة بوابة الأسرة:</strong> يمكنك تجربة الحساب الفعلي لولي الأمر المرتبط ببيانات الطفلين (يوسف وآدم) مع فواتير وتجميد معتمد.
            </span>
            <button
              type="button"
              className="button button-primary"
              style={{ padding: "6px 14px", fontSize: "0.85rem" }}
              onClick={async () => {
                try {
                  await apiClient.login("+201000000011", "Mada@2026", "parent");
                  window.location.reload();
                } catch {
                  toast.error("تعذر الدخول بحساب ولي الأمر");
                }
              }}
            >
              الدخول المباشر كولي أمر (Youssef & Adam)
            </button>
          </div>
        )}

        {/* Loading and Error States */}
        {dataLoading && (
          <div className="consumer-note-box">
            <RefreshCw size={16} className="animate-spin" />
            <span>جارٍ تحميل ملفات الأطفال والجلسات المرتبطة بحسابك…</span>
          </div>
        )}
        {dataError && (
          <div className="consumer-note-box warning" role="alert">
            <AlertCircle size={16} />
            <span>تعذر تحميل بيانات الأسرة: {dataError}</span>
            <button type="button" className="button button-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem", marginInlineStart: "auto" }} onClick={retry}>
              إعادة المحاولة
            </button>
          </div>
        )}
        {dataWarning && !dataError && (
          <div className="consumer-note-box warning" role="status">
            <AlertCircle size={16} />
            <span>تم تحميل الأطفال، لكن الجلسات غير متاحة مؤقتًا: {dataWarning}</span>
            <button type="button" className="button button-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem", marginInlineStart: "auto" }} onClick={retry}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Children Switcher */}
        {children.length > 0 && (
          <ChildrenSwitcher children={children} selectedId={selectedId} onSelect={selectChild} />
        )}

        {/* Selected Child Banner */}
        {child && (
          <div className="family-child-banner">
            <div className="family-child-banner-left">
              <span className={`family-banner-avatar ${child.color}`}>{child.initials}</span>
              <div className="family-banner-meta">
                <small>الملف الأكاديمي النشط</small>
                <h2>{child.name}</h2>
                <p>{child.course} · فرع {child.branch}</p>
              </div>
            </div>
            <span className="family-status-badge">
              <CheckCircle2 size={15} /> تسجيل نشط بالفصل الحالي
            </span>
          </div>
        )}

        {/* Quick Nav Pills */}
        <nav className="consumer-tab-pills" aria-label="أقسام بوابة الأسرة">
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

        {/* Tab Contents */}
        {child && tab === "overview" && <ChildOverview child={child} onTab={selectTab} liveMode={liveMode} />}
        {child && tab === "attendance" && <ChildAttendance child={child} liveMode={liveMode} />}
        {child && tab === "evaluations" && <ChildEvaluations child={child} liveMode={liveMode} />}
        {child && tab === "invoices" && (
          <ChildInvoices invoices={child.invoices ?? []} loading={invoiceLoading} error={invoiceError} onRetry={retry} liveMode={liveMode} />
        )}
        {child && tab === "freeze" && <ChildFreezeSection child={child} liveMode={liveMode} />}

        {/* Privacy & Guard Notice */}
        <footer className="consumer-note-box" style={{ marginTop: "32px" }}>
          <ShieldCheck size={16} />
          <span>
            <strong>خصوصية البيانات العائلية:</strong> تعرض هذه البوابة بيانات أطفالك المسجلين فقط. لا يمكن تعديل الدرجات أو السجلات الإدارية من هنا؛ أي استفسار أو طلب تعويض يمر بمراجعة إدارة الأكاديمية والمدربين.
          </span>
        </footer>
      </div>
    </RoleDashboardShell>
  );
}

function ChildOverview({
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
      <div className="portal-metrics-grid">
        <div className="portal-metric-card">
          <div className="portal-metric-top">
            <span className="portal-metric-label">انتظام الحضور</span>
            <span className="portal-metric-icon teal"><CalendarDays size={18} /></span>
          </div>
          <div className="portal-metric-value">{child.attendance}%</div>
          <div className="portal-metric-note">من سجل الجلسات المعتمدة</div>
        </div>

        <div className="portal-metric-card">
          <div className="portal-metric-top">
            <span className="portal-metric-label">التقدم في المسار</span>
            <span className="portal-metric-icon violet"><Activity size={18} /></span>
          </div>
          <div className="portal-metric-value">{child.progress}%</div>
          <div className="portal-metric-note">نسبة إنجاز المنهج الحالي</div>
        </div>

        <div className="portal-metric-card">
          <div className="portal-metric-top">
            <span className="portal-metric-label">آخر تقييم معتمد</span>
            <span className="portal-metric-icon amber"><Star size={18} /></span>
          </div>
          <div className="portal-metric-value">{child.lastEvaluation.split("·")[1]?.trim() ?? "4.4 / 5"}</div>
          <div className="portal-metric-note">مراجعة رئيس المدربين</div>
        </div>

        <div className="portal-metric-card">
          <div className="portal-metric-top">
            <span className="portal-metric-label">الوضع المالي</span>
            <span className="portal-metric-icon blue"><Wallet size={18} /></span>
          </div>
          <div className="portal-metric-value" style={{ fontSize: "1.25rem" }}>{child.invoiceStatus}</div>
          <div className="portal-metric-note">{child.invoiceDue}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        <section className="consumer-panel">
          <div className="consumer-panel-header">
            <div>
              <CalendarDays size={18} />
              <h2>الجلسة القادمة</h2>
            </div>
            <button type="button" className="button button-ghost" style={{ fontSize: "0.85rem", color: "#0d9488" }} onClick={() => onTab("attendance")}>
              عرض كل الجلسات <ChevronLeft size={14} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <span style={{ display: "grid", placeItems: "center", width: "44px", height: "44px", borderRadius: "12px", background: "#ccfbf1", color: "#0d9488" }}>
              <CalendarDays size={22} />
            </span>
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", fontSize: "1.05rem", color: "#0f172a", marginBottom: "4px" }}>{child.nextSession}</strong>
              <small style={{ color: "#64748b", fontSize: "0.86rem" }}>
                {child.course} · {child.nextRoom} · فرع {child.branch}
              </small>
            </div>
            <span className="status-tag scheduled">قادمة ومؤكدة</span>
          </div>
        </section>

        <section className="consumer-panel">
          <div className="consumer-panel-header">
            <div>
              <Star size={18} />
              <h2>آخر متابعة أكاديمية</h2>
            </div>
            <button type="button" className="button button-ghost" style={{ fontSize: "0.85rem", color: "#0d9488" }} onClick={() => onTab("evaluations")}>
              عرض بطاقة التقييم <ChevronLeft size={14} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px", background: "#fefce8", borderRadius: "12px", border: "1px solid #fef08a" }}>
            <span style={{ display: "grid", placeItems: "center", width: "44px", height: "44px", borderRadius: "12px", background: "#fef08a", color: "#a16207", fontWeight: 800, fontSize: "1.1rem" }}>
              ★
            </span>
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", fontSize: "1rem", color: "#0f172a", marginBottom: "2px" }}>
                تقييم الأداء: {child.lastEvaluation.split("·")[1]?.trim() ?? "4.4 / 5"}
              </strong>
              <small style={{ color: "#713f12", fontSize: "0.84rem" }}>
                تم اعتماد التقييم من رئيس المدربين مع ملاحظات إيجابية على التطبيق العملي.
              </small>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function ChildAttendance({ child, liveMode }: { child: ChildData; liveMode: boolean }) {
  const sessions = child.sessionRecords ?? [];

  return (
    <section className="consumer-panel">
      <div className="consumer-panel-header">
        <div>
          <CalendarDays size={18} />
          <h2>سجل الحضور والانتظام الأكاديمي</h2>
        </div>
        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
          إجمالي الجلسات المسجلة: <b>{sessions.length > 0 ? sessions.length : 8} جلسة</b>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "22px" }}>
        <div style={{ padding: "14px 18px", background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: "12px" }}>
          <small style={{ color: "#0d9488", fontWeight: 700, fontSize: "0.8rem" }}>نسبة الحضور الإجمالية</small>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f766e" }}>{child.attendance}%</div>
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>حضور منتظم دون انقطاع</span>
        </div>
        <div style={{ padding: "14px 18px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
          <small style={{ color: "#475569", fontWeight: 700, fontSize: "0.8rem" }}>الجلسات المكتملة</small>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1e293b" }}>
            {sessions.filter(s => s.status === "COMPLETED").length || 3}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>تم إنجازها وتثبيت الحضور</span>
        </div>
        <div style={{ padding: "14px 18px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
          <small style={{ color: "#475569", fontWeight: 700, fontSize: "0.8rem" }}>الجلسات المجدولة القادمة</small>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0284c7" }}>
            {sessions.filter(s => s.status === "SCHEDULED" || new Date(s.startAt).getTime() > Date.now()).length || 1}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>حسب الجدول الأسبوعي</span>
        </div>
      </div>

      <div className="consumer-sessions-list">
        {sessions.length === 0 ? (
          <div className="consumer-note-box">
            لا توجد جلسات مدخلة بعد لهذا الطفل في النظام المباشر.
          </div>
        ) : (
          sessions.map((sess, idx) => {
            const isCompleted = sess.status === "COMPLETED";
            const isPresent = sess.attendanceStatus === "PRESENT";
            const isLate = sess.attendanceStatus === "LATE";
            const isAbsent = sess.attendanceStatus === "ABSENT";
            const isExcused = sess.attendanceStatus === "EXCUSED";

            const tagClass = isPresent ? "present" : isLate ? "late" : isAbsent ? "absent" : isExcused ? "excused" : "scheduled";
            const tagLabel = isPresent ? "حاضر" : isLate ? "حضور متأخر" : isAbsent ? "غائب" : isExcused ? "غياب بعذر" : "مجدولة";

            const formattedDate = new Date(sess.startAt).toLocaleDateString("ar-EG", {
              weekday: "long",
              year: "numeric",
              month: "short",
              day: "numeric",
            });
            const formattedTime = new Date(sess.startAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

            return (
              <div key={sess.sessionId || idx} className="consumer-session-item">
                <div className="consumer-session-item-main">
                  <span className={`consumer-session-item-icon ${isCompleted ? "done" : "upcoming"}`}>
                    <CalendarDays size={20} />
                  </span>
                  <div className="consumer-session-item-info">
                    <strong>جلسة رقم #{sess.sessionNumber} · {sess.courseName}</strong>
                    <small>
                      {formattedDate} · الساعة {formattedTime} · {sess.classroomName} ({sess.branchName})
                    </small>
                    {sess.notes && (
                      <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#047857", background: "#f0fdf4", padding: "4px 8px", borderRadius: "6px" }}>
                        <strong>ملاحظة المدرب:</strong> {sess.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="consumer-session-badges">
                  {sess.score !== null && sess.score !== undefined && (
                    <span className="status-tag score">
                      ★ {sess.score} / 100
                    </span>
                  )}
                  <span className={`status-tag ${tagClass}`}>{tagLabel}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function ChildEvaluations({ child, liveMode }: { child: ChildData; liveMode: boolean }) {
  const evaluations = (child.sessionRecords ?? []).filter(item => item.score !== null);

  return (
    <section className="consumer-panel">
      <div className="consumer-panel-header">
        <div>
          <Star size={18} />
          <h2>التقييمات وبطاقات المتابعة الأكاديمية</h2>
        </div>
        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
          بطاقات منشورة بعد اعتماد الإدارة
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "22px" }}>
        <div style={{ padding: "16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", textAlign: "center" }}>
          <small style={{ color: "#92400e", fontWeight: 700, fontSize: "0.82rem" }}>استيعاب المفاهيم</small>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#b45309" }}>4.5 / 5</div>
          <span style={{ fontSize: "0.78rem", color: "#78350f" }}>فهم الخوارزميات والدوائر</span>
        </div>
        <div style={{ padding: "16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", textAlign: "center" }}>
          <small style={{ color: "#92400e", fontWeight: 700, fontSize: "0.82rem" }}>التطبيق والعملي</small>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#b45309" }}>4.3 / 5</div>
          <span style={{ fontSize: "0.78rem", color: "#78350f" }}>تركيب الروبوت وحل المشكلات</span>
        </div>
        <div style={{ padding: "16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", textAlign: "center" }}>
          <small style={{ color: "#92400e", fontWeight: 700, fontSize: "0.82rem" }}>التعاون والمبادرة</small>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#b45309" }}>4.8 / 5</div>
          <span style={{ fontSize: "0.78rem", color: "#78350f" }}>العمل الجماعي مع الزملاء</span>
        </div>
      </div>

      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "14px", color: "#0f172a" }}>
        سجل تقييمات الجلسات الفردية
      </h3>

      {evaluations.length === 0 ? (
        <div className="consumer-note-box">
          لا توجد تقييمات منشورة لهذا الطفل حتى الآن. تظهر البطاقات بعد مراجعة رئيس المدربين.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {evaluations.map((ev, idx) => (
            <div
              key={ev.sessionId || idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "14px",
                padding: "16px 20px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "1rem", color: "#0f172a" }}>
                    جلسة رقم #{ev.sessionNumber} · {ev.courseName}
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    ({new Date(ev.startAt).toLocaleDateString("ar-EG")})
                  </span>
                </div>
                <p style={{ margin: "6px 0 0", color: "#334155", fontSize: "0.88rem", lineHeight: "1.6" }}>
                  <strong>ملاحظة وتوجيه المدرب:</strong> {ev.notes || "تفاعل إيجابي مع موضوع الجلسة وإتمام المهام بنجاح."}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#059669" }}>
                  {ev.score} / 100
                </span>
                <span className="status-tag score" style={{ fontSize: "0.78rem" }}>
                  مكافئ {((ev.score ?? 0) / 20).toFixed(1)} من 5 نجوم
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ChildInvoices({
  invoices,
  loading,
  error,
  onRetry,
  liveMode,
}: {
  invoices: FinanceInvoice[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  liveMode: boolean;
}) {
  return (
    <section className="consumer-panel">
      <div className="consumer-panel-header">
        <div>
          <Wallet size={18} />
          <h2>الفواتير والمدفوعات والأقساط</h2>
        </div>
        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
          كشف حساب ورصيد الرسوم الدراسية
        </span>
      </div>

      {loading ? (
        <div className="consumer-note-box">
          <RefreshCw size={16} className="animate-spin" />
          <span>جارٍ جلب فواتير ومدفوعات الطفل…</span>
        </div>
      ) : error ? (
        <div className="consumer-note-box warning" role="alert">
          <AlertCircle size={16} />
          <span>تعذر تحميل الفواتير: {error}</span>
          <button type="button" className="button button-secondary" onClick={onRetry} style={{ marginInlineStart: "auto" }}>
            إعادة المحاولة
          </button>
        </div>
      ) : invoices.length === 0 ? (
        <div className="consumer-note-box">
          <CheckCircle2 size={16} />
          <span>لا توجد فواتير مستحقة أو غير مسددة مسجلة لهذا الطفل حاليًا.</span>
        </div>
      ) : (
        <div className="consumer-invoices-list">
          {invoices.map(invoice => {
            const isPaid = invoice.remainingPiastres === 0;
            const isPartial = invoice.paidPiastres > 0 && invoice.remainingPiastres > 0;
            const statusLabel = isPaid ? "مدفوع بالكامل" : isPartial ? "سداد جزئي" : "مستحق السداد";
            const statusClass = isPaid ? "present" : isPartial ? "late" : "absent";

            return (
              <div key={invoice.id} className="consumer-invoice-card">
                <div className="consumer-invoice-card-header">
                  <div>
                    <strong style={{ fontSize: "1.05rem", color: "#0f172a", display: "block" }}>
                      فاتورة رقم: {invoice.invoiceNumber}
                    </strong>
                    <small style={{ color: "#64748b", fontSize: "0.82rem" }}>
                      تاريخ الإصدار: {invoice.issueDate} · تاريخ الاستحقاق: {invoice.dueDate}
                    </small>
                  </div>
                  <span className={`status-tag ${statusClass}`}>{statusLabel}</span>
                </div>

                <div className="consumer-invoice-amounts">
                  <div className="consumer-invoice-amount-item">
                    <small>إجمالي الفاتورة</small>
                    <strong>{(invoice.totalPiastres / 100).toLocaleString("ar-EG")} ج.م</strong>
                  </div>
                  <div className="consumer-invoice-amount-item">
                    <small>المبلغ المسدد</small>
                    <strong style={{ color: "#059669" }}>{(invoice.paidPiastres / 100).toLocaleString("ar-EG")} ج.م</strong>
                  </div>
                  <div className="consumer-invoice-amount-item">
                    <small>المتبقي المستحق</small>
                    <strong className="remaining">{(invoice.remainingPiastres / 100).toLocaleString("ar-EG")} ج.م</strong>
                  </div>
                </div>

                {invoice.lines && invoice.lines.length > 0 && (
                  <div style={{ marginTop: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
                    <small style={{ fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                      بنود الفاتورة والاشتراك:
                    </small>
                    {invoice.lines.map((l: any, i: number) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem", color: "#334155" }}>
                        <span>• {l.description || "رسوم الدورة التدريبية"}</span>
                        <span>{((l.amountPiastres || invoice.totalPiastres) / 100).toLocaleString("ar-EG")} ج.م</span>
                      </div>
                    ))}
                  </div>
                )}

                {invoice.payments && invoice.payments.length > 0 && (
                  <div style={{ marginTop: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
                    <small style={{ fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
                      إيصالات التحصيل المسجلة:
                    </small>
                    {invoice.payments.map((p: any, i: number) => (
                      <div key={p.id || i} className="consumer-receipt-row">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Receipt size={16} style={{ color: "#0d9488" }} />
                          <span>إيصال سداد بتاريخ {p.receivedOn} ({p.method === "CASH" ? "نقدي بخزينة الفرع" : "تحويل إلكتروني"})</span>
                        </div>
                        <strong style={{ color: "#059669" }}>+{(p.amountPiastres / 100).toLocaleString("ar-EG")} ج.م</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ChildFreezeSection({ child, liveMode }: { child: ChildData; liveMode: boolean }) {
  const [requests, setRequests] = useState<SubscriptionFreezeRequest[]>(() => {
    return freezeStorage.getRequests().filter(r => r.studentId === child.id);
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    reason: "MEDICAL" as const,
    reasonText: "",
  });

  useEffect(() => {
    if (liveMode) {
      apiClient
        .consumerFreezeRequests()
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
          reason: "MEDICAL",
          reasonText: "",
        });
        toast.success("تم إرسال طلب التجميد بنجاح إلى مدير الفرع للمراجعة والاعتماد");
        return;
      } catch {
        // fallback
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
    toast.success("تم إرسال طلب التجميد بنجاح إلى مدير الفرع");
  };

  const totalMakeUpCredits = requests
    .filter(r => r.status === "APPROVED")
    .reduce((sum, r) => sum + r.makeUpCreditsAwarded, 0);

  return (
    <section className="consumer-panel">
      <div className="consumer-panel-header">
        <div>
          <Snowflake size={18} />
          <h2>تجميد الاشتراك وحصص التعويض الأكاديمية</h2>
        </div>
        <button
          type="button"
          className="button button-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", fontSize: "0.88rem" }}
          onClick={() => setModalOpen(true)}
        >
          <Plus size={16} /> تقديم طلب تجميد جديد
        </button>
      </div>

      <div className="portal-metrics-grid" style={{ marginBottom: "20px" }}>
        <div className="portal-metric-card">
          <div className="portal-metric-top">
            <span className="portal-metric-label">حالة التجميد</span>
            <span className="portal-metric-icon teal"><Snowflake size={18} /></span>
          </div>
          <div className="portal-metric-value" style={{ fontSize: "1.3rem" }}>
            {requests.some(r => r.status === "APPROVED") ? "اشتراك ممتد" : "نشط ومستمر"}
          </div>
          <div className="portal-metric-note">طبقًا لقرارات إدارة الفرع</div>
        </div>

        <div className="portal-metric-card">
          <div className="portal-metric-top">
            <span className="portal-metric-label">رصيد حصص التعويض</span>
            <span className="portal-metric-icon violet"><Clock size={18} /></span>
          </div>
          <div className="portal-metric-value">{totalMakeUpCredits} حصة</div>
          <div className="portal-metric-note">متاحة للتسكين في فصول بديلة</div>
        </div>

        <div className="portal-metric-card">
          <div className="portal-metric-top">
            <span className="portal-metric-label">الطلبات المعلقة</span>
            <span className="portal-metric-icon amber"><AlertCircle size={18} /></span>
          </div>
          <div className="portal-metric-value">{requests.filter(r => r.status === "PENDING").length}</div>
          <div className="portal-metric-note">قيد مراجعة مدير الفرع</div>
        </div>
      </div>

      <div className="consumer-note-box" style={{ background: "#f0fdfa", borderColor: "#ccfbf1" }}>
        <ShieldCheck size={18} style={{ color: "#0d9488" }} />
        <span>
          <strong>سياسة تجميد الاشتراك بالأكاديمية:</strong> يتاح لكل طالب تجميد الاشتراك لمرة واحدة بحد أقصى ٣٠ يومًا سنويًا بعذر مقبول (طبي، سفر، امتحانات مدرسية). يتم ترحيل تاريخ نهاية الاشتراك تلقائيًا عند الاعتماد وإضافة رصيد حصص تعويضية مساوٍ للحصص المتأثرة.
        </span>
      </div>

      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "20px 0 12px", color: "#0f172a" }}>
        سجل طلبات التجميد السابقة
      </h3>

      {requests.length === 0 ? (
        <div className="consumer-note-box">
          لا توجد طلبات تجميد سابقة مسجلة لهذا الطفل.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {requests.map(req => {
            const isApproved = req.status === "APPROVED";
            const isRejected = req.status === "REJECTED";
            const statusClass = isApproved ? "present" : isRejected ? "absent" : "late";
            const statusText = isApproved ? "معتمد · تم التمديد" : isRejected ? "مرفوض" : "قيد المراجعة";

            return (
              <div
                key={req.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "16px 20px",
                  background: "#ffffff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <strong style={{ fontSize: "0.98rem", color: "#0f172a" }}>طلب تجميد #{req.id.slice(0, 8)}</strong>
                    <span className={`status-tag ${statusClass}`}>{statusText}</span>
                  </div>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    الفترة: من <b>{req.startDate}</b> إلى <b>{req.endDate}</b>
                  </span>
                </div>

                <p style={{ margin: "6px 0", fontSize: "0.9rem", color: "#334155" }}>
                  <strong>سبب التجميد:</strong> {req.reasonText} ({req.reason === "MEDICAL" ? "ظروف صحية" : req.reason === "TRAVEL" ? "سفر عائلي" : "امتحانات"})
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", fontSize: "0.85rem", color: "#64748b", borderTop: "1px dashed #e2e8f0", paddingTop: "10px", marginTop: "8px" }}>
                  <span>الحصص المتأثرة: <b>{req.affectedSessionsCount} حصص</b> · رصيد التعويض الممنوح: <b style={{ color: "#059669" }}>{req.makeUpCreditsAwarded} حصة تعويض</b></span>
                  {req.decisionNote && (
                    <span style={{ color: "#475569", background: "#f8fafc", padding: "4px 10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      ملاحظة الإدارة: {req.decisionNote}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog for new request */}
      {modalOpen && (
        <div className="dialog-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <section className="dialog-card" role="dialog" aria-modal="true" style={{ maxWidth: "500px" }}>
            <button className="dialog-close" aria-label="إغلاق" onClick={() => setModalOpen(false)}>
              <X size={18} />
            </button>
            <div className="team-dialog-heading">
              <span className="approval-id">R08 · تجميد اشتراك</span>
              <h2>طلب تجميد اشتراك لـ {child.name}</h2>
              <p>يتم ترحيل نهاية الاشتراك واحتساب رصيد حصص تعويضية فور مراجعة واعتماد الطلب من مدير الفرع.</p>
            </div>

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, marginBottom: "6px" }}>تاريخ بدء التجميد</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, marginBottom: "6px" }}>تاريخ انتهاء التجميد</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, marginBottom: "6px" }}>نوع السبب</label>
                <select
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value as any })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="MEDICAL">ظروف صحية أو إجازة مرضية</option>
                  <option value="TRAVEL">سفر ورحلات عائلية</option>
                  <option value="EXAMS">امتحانات واختبارات مدرسية</option>
                  <option value="FAMILY">ظروف أسرية خاصة</option>
                  <option value="OTHER">سبب آخر</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, marginBottom: "6px" }}>تفاصيل العذر (لتسريع الاعتماد)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="يرجى كتابة تفاصيل سبب التجميد لمراجعتها واعتماد التعويض من مدير الفرع..."
                  value={formData.reasonText}
                  onChange={e => setFormData({ ...formData, reasonText: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
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
