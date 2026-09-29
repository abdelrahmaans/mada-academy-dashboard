import { useMemo, useState } from "react";
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
import ChildrenSwitcher, {
  type FamilyChild,
} from "@/components/ChildrenSwitcher";

type PortalTab = "overview" | "attendance" | "evaluations" | "invoices";
type ChildData = FamilyChild & {
  attendance: number;
  progress: number;
  nextSession: string;
  nextRoom: string;
  lastEvaluation: string;
  invoiceStatus: string;
  invoiceDue: string;
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

export default function FamilyPortal() {
  const [selectedId, setSelectedId] = useState(CHILDREN[0].id);
  const [tab, setTab] = useState<PortalTab>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const child = useMemo(
    () => CHILDREN.find(item => item.id === selectedId) ?? CHILDREN[0],
    [selectedId]
  );
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
            <strong>محمد علي</strong>
            <small>ولي الأمر · طفلان مرتبطان</small>
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
          onClick={() => toast("تسجيل الخروج التجريبي")}
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
              <h1>أهلًا يا محمد، تابع رحلة أطفالك</h1>
              <p>الحضور والتقدم والتقييمات والفواتير المرتبطة بأطفالك فقط.</p>
            </div>
            <span className="family-demo-badge">DEMO · معاينة محلية</span>
          </div>
          <ChildrenSwitcher
            children={CHILDREN}
            selectedId={selectedId}
            onSelect={selectChild}
          />
          <section className="family-selected-child">
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
          </section>
          {tab === "overview" && <Overview child={child} onTab={setTab} />}
          {tab === "attendance" && <Attendance child={child} />}
          {tab === "evaluations" && <Evaluations child={child} />}
          {tab === "invoices" && <Invoices child={child} />}
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
  );
}

function Overview({
  child,
  onTab,
}: {
  child: ChildData;
  onTab: (tab: PortalTab) => void;
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
          label="الحالة المالية"
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
function Attendance({ child }: { child: ChildData }) {
  const days = [88, 100, 75, 100, 88, 100, 88, 100];
  return (
    <section className="family-portal-panel family-detail-panel">
      <PanelTitle
        icon={<CalendarDays size={16} />}
        title="سجل الحضور"
        action={<span className="family-context">آخر ٨ جلسات</span>}
      />
      <div className="family-attendance-hero">
        <strong>{child.attendance}%</strong>
        <span>انتظام الحضور</span>
        <small>مؤشر توضيحي مرتبط بالطفل المحدد</small>
      </div>
      <div className="family-attendance-list">
        {days.map((value, index) => (
          <div key={index}>
            <span>الجلسة {index + 1}</span>
            <i>
              <em style={{ width: `${value}%` }} />
            </i>
            <b>{value === 100 ? "حاضر" : "حاضر"}</b>
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
function Evaluations({ child }: { child: ChildData }) {
  return (
    <section className="family-portal-panel family-detail-panel">
      <PanelTitle
        icon={<Star size={16} />}
        title="التقييمات الأكاديمية"
        action={<span className="family-context">مرئية بعد المراجعة</span>}
      />
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
      <div className="family-info-note">
        <ShieldCheck size={14} /> التقييم الذي يظهر هنا تمت مراجعته أكاديميًا؛
        طلب التصحيح يحتاج تواصلًا مع الأكاديمية.
      </div>
    </section>
  );
}
function Invoices({ child }: { child: ChildData }) {
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
          onClick={() =>
            toast("الدفع الإلكتروني قيد التجهيز", {
              description: "لا توجد عملية دفع حقيقية في هذه المعاينة.",
            })
          }
        >
          التفاصيل
        </button>
      </div>
      <div className="family-info-note">
        <AlertCircle size={14} /> هذه معاينة للعرض فقط. لا يتم الدفع أو تغيير
        الفاتورة من بوابة الأسرة حاليًا.
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
