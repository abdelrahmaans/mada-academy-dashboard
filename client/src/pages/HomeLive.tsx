import { useEffect, useState, type ReactNode } from "react";
import { Activity, ArrowLeft, BookOpen, CalendarDays, CheckCircle2, Clock, Eye, LifeBuoy, MapPin, Menu, Receipt, RefreshCw, UserPlus, Users, X } from "lucide-react";
import { useLocation } from "wouter";
import PageHeader from "@/components/PageHeader";
import QuickActionsBar from "@/components/QuickActionsBar";
import { QuickPaymentReceiptModal, QuickSupportTicketModal } from "@/components/QuickActionModals";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import { apiClient, type AuthMe, type DashboardSummary } from "@/lib/apiClient";
import { sessionStatusLabel } from "@/lib/statusLabels";
import "./HomeLive.css";

export default function HomeLive({ me }: { me: AuthMe }) {
  const [, navigate] = useLocation();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedSessionForDetails, setSelectedSessionForDetails] = useState<{
    id: string;
    sessionNumber: number;
    startAt: string;
    status: string;
  } | null>(null);
  const branchName = me.branches?.find(branch => branch.id === me.branchId)?.name ?? "الفرع المحدد";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    apiClient.dashboardSummary().then(data => {
      if (active) setSummary(data);
    }).catch(cause => {
      if (active) {
        setSummary(null);
        setError(cause instanceof Error ? cause.message : "تعذر تحميل بيانات الفرع.");
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [refreshKey]);

  const displayName = me.user?.displayName?.trim() || "مدير الفرع";

  return <RoleDashboardShell className="app-shell r02-home-live-shell" roleCode="R02" roleLabel={me.roleLabel || "مدير الفرع"} scopeLevel="branch" scopeLabel={branchName} tenantName={me.academy?.name} branchName={branchName} demo={false} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)}>
    <main className="main-panel">
      <header className="topbar r02-live-topbar">
        <button className="icon-button mobile-menu-button" aria-label="فتح قائمة مدير الفرع" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
        <div className="r02-live-topbar-scope"><span>{me.academy?.name || "أكاديمية مدى"}</span><small>{branchName} · بيانات مباشرة</small></div>
      </header>
      <div className="workspace r02-home-live">
        <PageHeader
          className="welcome-row"
          copyClassName="welcome-copy"
          actionsClassName="welcome-actions"
          eyebrow={<span className="eyebrow"><i className="eyebrow-dot" /> ملخص التشغيل · بيانات مباشرة</span>}
          title={`أهلًا، ${displayName}`}
          description="مؤشرات الجلسات والطلاب المسجلة لهذا الفرع فقط."
          actions={<button className="button button-secondary" onClick={() => setRefreshKey(value => value + 1)} disabled={loading}><RefreshCw size={16} /> تحديث البيانات</button>}
        />
        <RoleScopeCard className="home-role-scope-card" compact />
        <QuickActionsBar
          actions={[
            {
              id: "r02-payment",
              label: "تسجيل دفعة اشتراك / إيصال فوري",
              icon: <Receipt size={14} />,
              onClick: () => setPaymentModalOpen(true),
              tone: "primary",
            },
            {
              id: "r02-ticket",
              label: "تسجيل تذكرة دعم / استفسار للمنصة",
              icon: <LifeBuoy size={14} />,
              onClick: () => setTicketModalOpen(true),
            },
            {
              id: "r02-approvals",
              label: "الموافقات والقرارات المعلقة",
              icon: <CheckCircle2 size={14} />,
              onClick: () => navigate("/approvals"),
            },
            {
              id: "r02-refresh",
              label: "تحديث مؤشرات الفرع",
              icon: <RefreshCw size={14} />,
              onClick: () => setRefreshKey((v) => v + 1),
            },
          ]}
        />
        <div className="r02-home-live-source"><Activity size={14} /> المصدر: API الفرع · النطاق مستمد من جلسة المستخدم</div>

        {loading && <section className="r02-live-state" role="status"><span className="r02-live-spinner" /> جارٍ تحميل مؤشرات الفرع…</section>}
        {!loading && error && <section className="r02-live-state r02-live-error" role="alert"><strong>تعذر تحميل لوحة الفرع</strong><p>{error}</p><button className="button button-secondary" onClick={() => setRefreshKey(value => value + 1)}><RefreshCw size={15} /> إعادة المحاولة</button></section>}
        {!loading && !error && summary && <>
          <section className="r02-live-stat-grid" aria-label="مؤشرات الفرع الحية">
            <LiveStat icon={<Users size={18} />} label="الطلاب المسجلون" value={summary.students} suffix="طالب" tone="teal" />
            <LiveStat icon={<BookOpen size={18} />} label="التسجيلات النشطة" value={summary.activeEnrollments} suffix="تسجيل" tone="blue" />
            <LiveStat icon={<CalendarDays size={18} />} label="الجلسات القادمة" value={summary.upcomingSessions} suffix="جلسة" tone="amber" />
            <LiveStat icon={<CheckCircle2 size={18} />} label="الجلسات المكتملة" value={summary.completedSessions} suffix="جلسة" tone="violet" />
          </section>

          <section className="r02-live-panel">
            <div className="r02-live-panel-heading"><div><h2>الجلسات القادمة</h2><p>{branchName} · أقرب الجلسات المسجلة</p></div><span>{summary.upcoming.length} جلسات</span></div>
            {summary.upcoming.length === 0 ? (
              <div className="r02-live-empty">لا توجد جلسات قادمة مسجلة لهذا الفرع.</div>
            ) : (
              <div className="r02-live-session-list">
                {summary.upcoming.map((session) => (
                  <article
                    key={session.id}
                    className="r02-live-session"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedSessionForDetails(session)}
                    title="انقر لعرض تفاصيل الجلسة"
                  >
                    <span className="r02-live-session-icon">
                      <CalendarDays size={17} />
                    </span>
                    <div>
                      <strong>الجلسة رقم {session.sessionNumber}</strong>
                      <small>{formatSessionTime(session.startAt)}</small>
                    </div>
                    <span className="r02-live-session-status">
                      {sessionStatusLabel(session.status)}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>}
      </div>
    </main>
    <QuickPaymentReceiptModal
      isOpen={paymentModalOpen}
      onClose={() => setPaymentModalOpen(false)}
      branchName={branchName}
      onSuccess={() => setRefreshKey((v) => v + 1)}
    />
    <QuickSupportTicketModal
      isOpen={ticketModalOpen}
      onClose={() => setTicketModalOpen(false)}
      roleLabel="مدير الفرع · R02"
    />
    {selectedSessionForDetails && (
      <div
        className="dialog-backdrop"
        role="presentation"
        onClick={() => setSelectedSessionForDetails(null)}
      >
        <div
          className="dialog"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: "500px", width: "100%", padding: "24px", direction: "rtl" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <span style={{ fontSize: "12px", color: "#0d9488", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <CalendarDays size={14} /> تفاصيل الجلسة التدريبية
              </span>
              <h3 style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 800 }}>
                الجلسة رقم {selectedSessionForDetails.sessionNumber}
              </h3>
            </div>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setSelectedSessionForDetails(null)}
              style={{ padding: "6px" }}
              aria-label="إغلاق"
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: "grid", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "12px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "#64748b" }}>توقيت الانعقاد:</span>
              <strong style={{ color: "#0f172a" }}>{formatSessionTime(selectedSessionForDetails.startAt)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "#64748b" }}>حالة الجلسة:</span>
              <span className="r02-live-session-status">
                {sessionStatusLabel(selectedSessionForDetails.status)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "#64748b" }}>الفرع المخصص:</span>
              <strong style={{ color: "#0f172a" }}>{branchName}</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                setSelectedSessionForDetails(null);
                navigate("/schedule");
              }}
            >
              <CalendarDays size={15} /> الانتقال إلى جدول الحصص
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setSelectedSessionForDetails(null)}
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    )}
  </RoleDashboardShell>;
}

function LiveStat({ icon, label, value, suffix, tone }: { icon: ReactNode; label: string; value: number; suffix: string; tone: string }) {
  return <article className={`r02-live-stat r02-live-stat-${tone}`}><span className="r02-live-stat-icon">{icon}</span><div><small>{label}</small><strong>{new Intl.NumberFormat("en-US").format(value)} <em>{suffix}</em></strong></div></article>;
}

function formatSessionTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "موعد الجلسة غير متاح";
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(date);
}
