import { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  ArrowUpLeft,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleSidebar from "@/components/RoleSidebar";
import { getRoleBackPath } from "@/lib/roleNavigation";
import ReportsLive from "./ReportsLive";

type Branch = "مدينة نصر";
type Period = "week" | "month" | "quarter";
const PERIOD_LABELS: Record<Period, string> = {
  week: "آخر 7 أيام",
  month: "هذا الشهر",
  quarter: "آخر 3 شهور",
};
const WEEKLY_ATTENDANCE = [
  { day: "السبت", value: 86 },
  { day: "الأحد", value: 78 },
  { day: "الإثنين", value: 82 },
  { day: "الثلاثاء", value: 75 },
  { day: "الأربعاء", value: 90 },
  { day: "الخميس", value: 88 },
  { day: "الجمعة", value: 80 },
];
const WEEKLY_BRANCH: Record<Branch, number[]> = {
  "مدينة نصر": [86, 78, 82, 75, 90, 88, 80],
};
const COURSE_UTILIZATION = [
  {
    name: "روبوتكس مستوى 2",
    track: "الروبوتات",
    sessions: 18,
    students: 72,
    capacity: 86,
    fill: 84,
    tone: "teal",
  },
  {
    name: "برمجة للمبتدئين",
    track: "البرمجة",
    sessions: 14,
    students: 56,
    capacity: 72,
    fill: 78,
    tone: "blue",
  },
  {
    name: "دوائر إلكترونية",
    track: "الإلكترونيات",
    sessions: 12,
    students: 43,
    capacity: 60,
    fill: 72,
    tone: "amber",
  },
  {
    name: "ذكاء اصطناعي للصغار",
    track: "الذكاء الاصطناعي",
    sessions: 8,
    students: 38,
    capacity: 48,
    fill: 79,
    tone: "violet",
  },
];

function BrandMark() {
  return (
    <div className="brand-lockup" aria-label="مدى">
      <span className="brand-symbol" aria-hidden="true">
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
      <span className="brand-word">مدى</span>
    </div>
  );
}

function ReportsPreview() {
  const [, navigate] = useLocation();
  const branch: Branch = "مدينة نصر";
  const [period, setPeriod] = useState<Period>("month");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const attendanceSeries = useMemo(() => {
    return WEEKLY_ATTENDANCE.map((item, index) => ({
      ...item,
      value: WEEKLY_BRANCH[branch][index],
    }));
  }, [branch]);
  const attendanceAverage = Math.round(
    attendanceSeries.reduce((sum, item) => sum + item.value, 0) /
      attendanceSeries.length
  );
  const branchRows = useMemo(() => {
    const source = [
      {
        branch: "مدينة نصر",
        students: 102,
        sessions: 68,
        attendance: 83,
        collected: 94500,
      },
      {
        branch: "المعادي",
        students: 84,
        sessions: 57,
        attendance: 86,
        collected: 78800,
      },
      {
        branch: "الشيخ زايد",
        students: 62,
        sessions: 41,
        attendance: 81,
        collected: 52600,
      },
    ];
    return source.filter(row => row.branch === branch);
  }, [branch, query]);
  const totalStudents = branchRows.reduce((sum, row) => sum + row.students, 0);
  const totalSessions = branchRows.reduce((sum, row) => sum + row.sessions, 0);
  const totalCollected = branchRows.reduce(
    (sum, row) => sum + row.collected,
    0
  );
  const visibleCourses = useMemo(
    () =>
      COURSE_UTILIZATION.filter(
        item =>
          !query ||
          `${item.name} ${item.track}`
            .toLocaleLowerCase("ar")
            .includes(query.trim().toLocaleLowerCase("ar"))
      ),
    [query]
  );

  const showComingSoon = (label: string) => {
    toast("القسم قيد التجهيز", {
      description: `هنبدأ في تطوير «${label}» في المرحلة التالية.`,
    });
    setMobileNavOpen(false);
  };
  const exportCsv = () => {
    const rows = [
      ["الفرع", "عدد الطلاب", "الحصص", "الحضور %", "التحصيل ج.م"],
      ...branchRows.map(row => [
        row.branch,
        row.students,
        row.sessions,
        row.attendance,
        row.collected,
      ]),
    ];
    const csv = `\uFEFF${rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "mada-branch-report-sample.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("تم تنزيل نسخة CSV من ملخص الفرع");
  };
  const formatMoney = (value: number) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

  return (
    <RoleDashboardShell
      className="app-shell reports-preview-shell"
      roleCode="R02"
      roleLabel="مدير الفرع"
      scopeLevel="branch"
      scopeLabel="فرع واحد · بيانات توضيحية"
      tenantName="أكاديمية مدى"
      branchName={branch}
      demo
    >
      <RoleSidebar roleCode="R02" mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-right">
            <button
              className="icon-button mobile-menu-button"
              aria-label="فتح القائمة"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div
              className="branch-select assigned-branch"
              aria-label={`النطاق: فرع ${branch}`}
            >
              <span className="branch-icon">
                <MapPin size={17} />
              </span>
              <span>فرع {branch}</span>
            </div>
            <label className="top-search">
              <Search size={18} />
              <input
                aria-label="ابحث في التقرير"
                placeholder="ابحث عن فرع أو مسار..."
                value={query}
                onChange={event => setQuery(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </label>
          </div>
          <div className="topbar-left">
            <button
              className="icon-button notification-button"
              aria-label="الإشعارات"
              onClick={() => toast("لا توجد إشعارات جديدة")}
            >
              <span className="notification-dot" />
              <Bell size={18} />
            </button>
            <span className="topbar-divider" />
            <button
              className="profile-button"
              onClick={() => toast("إعدادات الحساب قيد التجهيز")}
            >
              <span className="profile-copy">
                <strong>أحمد محمود</strong>
                <small>مدير الفرع</small>
              </span>
              <span className="profile-avatar">أم</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        <div className="workspace reports-workspace">
          <div className="students-breadcrumb">
            <button onClick={() => navigate(getRoleBackPath("R02"))}>الرئيسية</button>
            <ChevronLeft size={13} />
            <span>التقارير والتحليلات</span>
          </div>
          <section className="students-welcome reports-welcome">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" /> مؤشرات الأداء · الأكاديمي ·
                المالي
              </div>
              <h1>تقارير الفرع</h1>
              <p>نظرة تشغيلية سريعة على الحضور، الإشغال، والتحصيل.</p>
            </div>
            <div className="welcome-actions">
              <select
                aria-label="الفترة الزمنية"
                value={period}
                onChange={event => setPeriod(event.target.value as Period)}
              >
                {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <button className="button button-secondary" onClick={exportCsv}>
                <ArrowDownToLine size={17} /> تصدير CSV
              </button>
            </div>
          </section>
          <section className="team-demo-note reports-demo-note" role="note">
            <AlertCircle size={16} />
            <span>
              ملخص تجريبي مبني على بيانات توضيحية، وليس تقريرًا ماليًا أو
              أكاديميًا رسميًا.
            </span>
            <span className="demo-tag">DEMO</span>
          </section>
          <section
            className="finance-stats-grid report-stats"
            aria-label="ملخص المؤشرات"
          >
            <article className="finance-stat">
              <span className="finance-stat-icon icon-teal">
                <Users size={18} />
              </span>
              <span className="finance-stat-label">طلاب نشطون</span>
              <div>
                <strong>{totalStudents}</strong>
                <small>طالب</small>
              </div>
              <small>نطاق الفروع المختار</small>
            </article>
            <article className="finance-stat">
              <span className="finance-stat-icon icon-blue">
                <CalendarDays size={18} />
              </span>
              <span className="finance-stat-label">حصص مجدولة</span>
              <div>
                <strong>{totalSessions}</strong>
                <small>حصة</small>
              </div>
              <small>{PERIOD_LABELS[period]}</small>
            </article>
            <article className="finance-stat">
              <span className="finance-stat-icon icon-violet">
                <Activity size={18} />
              </span>
              <span className="finance-stat-label">متوسط الحضور</span>
              <div>
                <strong>{attendanceAverage}%</strong>
                <small>
                  <TrendingUp size={13} /> +3.4%
                </small>
              </div>
              <small>مقارنة بالفترة السابقة</small>
            </article>
            <article className="finance-stat">
              <span className="finance-stat-icon icon-amber">
                <Wallet size={18} />
              </span>
              <span className="finance-stat-label">التحصيل المسجل</span>
              <div>
                <strong>{formatMoney(totalCollected)}</strong>
                <small>ج.م</small>
              </div>
              <small>للعينة خلال الفترة</small>
            </article>
          </section>

          <section className="report-content-grid">
            <article className="panel report-attendance-panel">
              <div className="panel-heading">
                <div className="panel-title-group">
                  <span className="panel-icon panel-icon-teal">
                    <Activity size={18} />
                  </span>
                  <div>
                    <h2>اتجاه الحضور الأسبوعي</h2>
                    <p>نسبة حضور الطلاب حسب اليوم · {branch}</p>
                  </div>
                </div>
                <span className="report-average-pill">
                  {attendanceAverage}% متوسط
                </span>
              </div>
              <div className="report-chart-legend">
                <span>
                  <i /> الحضور الفعلي
                </span>
                <span>الفترة: {PERIOD_LABELS[period]}</span>
              </div>
              <div className="report-bar-chart">
                {[100, 75, 50].map(mark => (
                  <span key={mark} className={`report-gridline grid-${mark}`}>
                    {mark}%
                  </span>
                ))}
                {attendanceSeries.map((item, index) => (
                  <div className="report-bar-column" key={item.day}>
                    <strong>{item.value}%</strong>
                    <div className="report-bar-track">
                      <i
                        className={index === 4 ? "highlight" : ""}
                        style={{ height: `${item.value}%` }}
                      />
                    </div>
                    <small>{item.day}</small>
                  </div>
                ))}
              </div>
              <div className="report-insight">
                <span>
                  <TrendingUp size={16} />
                </span>
                <p>
                  <strong>ملاحظة تشغيلية</strong> يوم الأربعاء هو الأعلى حضورًا
                  في العينة، بينما الثلاثاء يحتاج متابعة منسق الفرع.
                </p>
              </div>
            </article>
            <article className="panel report-branch-panel">
              <div className="panel-heading">
                <div className="panel-title-group">
                  <span className="panel-icon panel-icon-blue">
                    <MapPin size={18} />
                  </span>
                  <div>
                    <h2>ملخص تشغيل الفرع</h2>
                    <p>لقطة سريعة لمدينة نصر</p>
                  </div>
                </div>
              </div>
              <div className="report-branch-summary">
                {[
                  {
                    label: "طلاب نشطون",
                    value: `${totalStudents}`,
                    suffix: "طالب",
                    icon: Users,
                  },
                  {
                    label: "حصص مجدولة",
                    value: `${totalSessions}`,
                    suffix: "حصة",
                    icon: CalendarDays,
                  },
                  {
                    label: "متوسط الحضور",
                    value: `${attendanceAverage}`,
                    suffix: "%",
                    icon: Activity,
                  },
                  {
                    label: "التحصيل المسجل",
                    value: formatMoney(totalCollected),
                    suffix: "ج.م",
                    icon: Wallet,
                  },
                ].map(item => (
                  <div className="report-branch-summary-row" key={item.label}>
                    <span className="report-summary-icon">
                      <item.icon size={15} />
                    </span>
                    <span className="report-summary-label">{item.label}</span>
                    <strong>
                      {item.value}
                      <small>{item.suffix}</small>
                    </strong>
                  </div>
                ))}
                <div className="report-branch-footer-note">
                  <MapPin size={13} /> النطاق ثابت على مدينة نصر في هذه
                  المعاينة.
                </div>
              </div>
            </article>
          </section>

          <section className="panel report-courses-panel">
            <div className="report-courses-heading">
              <div className="panel-title-group">
                <span className="panel-icon panel-icon-amber">
                  <BookOpen size={18} />
                </span>
                <div>
                  <h2>إشغال المجموعات حسب المسار</h2>
                  <p>مساعدة في قرارات فتح مجموعات أو توزيع السعة</p>
                </div>
              </div>
              <span className="team-table-total">
                {visibleCourses.length} مسارات
              </span>
            </div>
            <div className="report-course-table-wrap">
              <table className="report-course-table">
                <thead>
                  <tr>
                    <th>المجموعة</th>
                    <th>المسار</th>
                    <th>الحصص</th>
                    <th>عدد الطلاب</th>
                    <th>السعة</th>
                    <th>الإشغال</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCourses.length ? (
                    visibleCourses.map(item => (
                      <tr key={item.name}>
                        <td>
                          <strong>{item.name}</strong>
                        </td>
                        <td>{item.track}</td>
                        <td>{item.sessions}</td>
                        <td>{item.students}</td>
                        <td>{item.capacity}</td>
                        <td>
                          <div className="report-fill-cell">
                            <div className="report-fill-bar">
                              <i
                                className={`fill-${item.tone}`}
                                style={{ width: `${item.fill}%` }}
                              />
                            </div>
                            <bdi>{item.fill}%</bdi>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        <div className="team-empty report-no-results">
                          <Search size={18} />
                          <strong>لا توجد مجموعات مطابقة</strong>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="team-table-footer">
              <span>بيانات إشغال توضيحية · آخر تحديث تجريبي</span>
              <span>
                <Clock3 size={13} /> بيانات ثابتة للعرض
              </span>
            </div>
          </section>
          <div className="finance-footer-note">
            <span>
              <AlertCircle size={14} />
            </span>
            <p>
              المؤشرات تعتمد على بيانات محلية ثابتة للعرض. تجميع التقارير حسب
              الصلاحية، الحسابات الدقيقة، وفترات المقارنة تتطلب تعريف قواعد
              التقارير وربطها بالـBackend.
            </p>
          </div>
        </div>
      </main>
    </RoleDashboardShell>
  );
}

export default function Reports() {
  const { me, loading, error } = useAuth();
  if (loading) return <main className="r02-home-auth-state" dir="rtl" role="status">جارٍ التحقق من الجلسة وتحميل التقرير…</main>;
  if (apiClient.hasSession()) {
    if (me?.role === "R01_ACADEMY_OWNER" || me?.role === "R02_BRANCH_MANAGER" || me?.role === "R06_ACCOUNTANT") return <ReportsLive me={me} />;
    return <main className="r02-home-auth-state r02-home-auth-error" dir="rtl" role="alert">التقارير التشغيلية غير متاحة لهذا الدور.</main>;
  }
  if (error) return <main className="r02-home-auth-state r02-home-auth-error" dir="rtl" role="alert">تعذر التحقق من الجلسة. سجّل الدخول مجددًا؛ لن نعرض أرقامًا تجريبية بدل التقرير.</main>;
  return <ReportsPreview />;
}
