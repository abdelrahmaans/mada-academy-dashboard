import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Home,
  RefreshCw,
  ShieldCheck,
  Snowflake,
  Star,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import ChildrenSwitcher from "@/components/ChildrenSwitcher";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import { useAuth } from "@/contexts/AuthContext";
import {
  apiClient,
  type ConsumerSessionRecord,
  type ConsumerStudentRecord,
  type FinanceInvoice,
} from "@/lib/apiClient";
import "@/components/RoleFoundation.css";
import "@/styles/consumer-portals.css";
import {
  type PortalTab,
  type ChildData,
  DEMO_CHILDREN,
  mapFamilyChild,
} from "./FamilyPortalTypes";
import {
  ChildOverview,
  ChildAttendance,
  ChildEvaluations,
  ChildInvoices,
  ChildFreezeSection,
} from "@/components/family/FamilyPortalSubViews";

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
        {children.length > 0 ? (
          <ChildrenSwitcher children={children} selectedId={selectedId} onSelect={selectChild} />
        ) : !dataLoading && !dataError ? (
          <div className="consumer-note-box" role="status" style={{ margin: "20px 0", padding: "18px" }}>
            <AlertCircle size={20} style={{ color: "#0d9488", flexShrink: 0 }} />
            <div>
              <strong style={{ display: "block", color: "#0f172a", marginBottom: "4px" }}>
                لا توجد ملفات أطفال مرتبطة بهذا الحساب.
              </strong>
              <small style={{ color: "#64748b" }}>
                يرجى التواصل مع إدارة الأكاديمية لربط بيانات أطفالك برقم هاتفك المسجل.
              </small>
            </div>
          </div>
        ) : null}

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
        {child && tab === "overview" && <ChildOverview child={child} onTab={selectTab} />}
        {child && tab === "attendance" && <ChildAttendance child={child} />}
        {child && tab === "evaluations" && <ChildEvaluations child={child} />}
        {child && tab === "invoices" && (
          <ChildInvoices invoices={child.invoices ?? []} loading={invoiceLoading} error={invoiceError} onRetry={retry} />
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

