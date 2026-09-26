import { useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type Session = {
  time: string;
  title: string;
  level: string;
  coach: string;
  room: string;
  attendance: string;
  status: "جارية" | "قادمة";
  color: "teal" | "amber" | "navy";
};

const sessions: Session[] = [
  {
    time: "10:00",
    title: "روبوتكس مستوى 2",
    level: "المستوى المتوسط",
    coach: "مريم حسن",
    room: "معمل 1",
    attendance: "12 / 16",
    status: "جارية",
    color: "teal",
  },
  {
    time: "12:00",
    title: "برمجة للمبتدئين",
    level: "المستوى التمهيدي",
    coach: "عمر سامح",
    room: "معمل 2",
    attendance: "8 / 12",
    status: "قادمة",
    color: "amber",
  },
  {
    time: "14:00",
    title: "دوائر إلكترونية",
    level: "المستوى المتقدم",
    coach: "سارة خالد",
    room: "معمل 1",
    attendance: "11 / 14",
    status: "قادمة",
    color: "navy",
  },
];

const attendance = [
  { day: "السبت", value: 86 },
  { day: "الأحد", value: 78 },
  { day: "الإثنين", value: 82 },
  { day: "الثلاثاء", value: 75 },
  { day: "الأربعاء", value: 90 },
  { day: "الخميس", value: 88 },
  { day: "الجمعة", value: 80 },
];

const branches = ["فرع مدينة نصر", "فرع المعادي", "فرع الشيخ زايد"];

function BrandMark() {
  return (
    <div className="brand-lockup" aria-label="مدى">
      <span className="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <path
            d="M4 12.5 12.5 8l8.2 4.5v9.4l-8.2 4.6L4 21.9v-9.4Z"
            fill="currentColor"
            opacity=".98"
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

function App() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState(branches[0]);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [studentCount, setStudentCount] = useState(248);
  const [leadCount, setLeadCount] = useState(3);

  const filteredSessions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return sessions;
    return sessions.filter(session =>
      `${session.title} ${session.coach} ${session.room} ${session.time}`
        .toLowerCase()
        .includes(normalized)
    );
  }, [query]);

  const showComingSoon = (label: string) => {
    toast("القسم قيد التجهيز", {
      description: `هنبدأ في تطوير «${label}» في المرحلة التالية.`,
    });
    setMobileNavOpen(false);
  };

  const handleStudentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!studentName.trim() || !parentPhone.trim()) {
      toast.error("أكمل البيانات المطلوبة أولًا");
      return;
    }
    setStudentCount(count => count + 1);
    setLeadCount(count => Math.max(0, count - 1));
    setStudentDialogOpen(false);
    setStudentName("");
    setParentPhone("");
    toast.success("اتضاف الطالب بنجاح", {
      description: "تمت الإضافة في بيانات العرض التجريبية.",
    });
  };

  return (
    <div className="app-shell" dir="rtl">
      {mobileNavOpen && (
        <button
          className="mobile-scrim"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <BrandMark />
          <button
            className="icon-button sidebar-close"
            aria-label="إغلاق القائمة"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="academy-switcher">
          <span className="academy-avatar">
            <GraduationCap size={20} />
          </span>
          <span className="academy-meta">
            <strong>أكاديمية مدى</strong>
            <small>إدارة الأكاديمية</small>
          </span>
          <ChevronDown size={15} className="switcher-chevron" />
        </div>

        <div className="nav-caption">القائمة الرئيسية</div>
        <nav className="primary-nav" aria-label="القائمة الرئيسية">
          <button className="nav-link active" aria-current="page">
            <LayoutDashboard size={19} />
            <span>الرئيسية</span>
          </button>
          <button className="nav-link" onClick={() => navigate("/students")}>
            <Users size={19} />
            <span>الطلاب</span>
            <span className="nav-count">{studentCount}</span>
          </button>
          <button className="nav-link" onClick={() => navigate("/schedule")}>
            <CalendarDays size={19} />
            <span>الجدول</span>
          </button>
          <button className="nav-link" onClick={() => navigate("/classes")}>
            <BookOpen size={19} />
            <span>الحصص والكورسات</span>
          </button>
          <button
            className="nav-link"
            onClick={() => showComingSoon("المسابقات")}
          >
            <Sparkles size={19} />
            <span>المسابقات</span>
          </button>
        </nav>

        <div className="nav-caption nav-caption-spaced">الإدارة</div>
        <nav className="primary-nav" aria-label="قائمة الإدارة">
          <button className="nav-link" onClick={() => navigate("/finance")}>
            <Wallet size={19} />
            <span>المالية والتحصيل</span>
          </button>
          <button className="nav-link" onClick={() => navigate("/team")}>
            <Users size={19} />
            <span>الفريق والأدوار</span>
          </button>
          <button className="nav-link" onClick={() => navigate("/approvals")}>
            <CheckCircle2 size={19} />
            <span>الموافقات</span>
          </button>
          <button className="nav-link" onClick={() => navigate("/reports")}>
            <BarChart3 size={19} />
            <span>التقارير والتحليلات</span>
          </button>
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-help">
          <span className="help-icon">
            <CircleHelp size={18} />
          </span>
          <div>
            <strong>محتاج مساعدة؟</strong>
            <span>مركز الدعم والإرشادات</span>
          </div>
          <ChevronLeft size={16} />
        </div>
        <div className="sidebar-bottom">
          <button
            className="nav-link"
            onClick={() => showComingSoon("الإعدادات")}
          >
            <Settings size={19} />
            <span>الإعدادات</span>
          </button>
          <button
            className="nav-link"
            onClick={() => toast("تم تسجيل الخروج التجريبي")}
          >
            <LogOut size={19} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
        <div className="sidebar-version">
          مدى لإدارة الأكاديميات <span>نسخة تجريبية</span>
        </div>
      </aside>

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
            <div className="branch-select-wrap">
              <button
                className={`branch-select ${branchMenuOpen ? "is-open" : ""}`}
                onClick={() => setBranchMenuOpen(open => !open)}
                aria-expanded={branchMenuOpen}
              >
                <span className="branch-icon">
                  <MapPin size={17} />
                </span>
                <span>{branch}</span>
                <ChevronDown size={15} />
              </button>
              {branchMenuOpen && (
                <div className="branch-menu">
                  {branches.map(item => (
                    <button
                      key={item}
                      className={item === branch ? "selected" : ""}
                      onClick={() => {
                        setBranch(item);
                        setBranchMenuOpen(false);
                      }}
                    >
                      <MapPin size={15} />
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <label className="top-search">
              <Search size={18} />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="ابحث عن حصة أو كوتش..."
                aria-label="ابحث عن حصة أو كوتش"
              />
              <kbd>⌘ K</kbd>
            </label>
          </div>

          <div className="topbar-left">
            <div className="notification-wrap">
              <button
                className={`icon-button notification-button ${notificationsOpen ? "is-open" : ""}`}
                aria-label="الإشعارات"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen(open => !open)}
              >
                <Bell size={19} />
                <span className="notification-dot" />
              </button>
              {notificationsOpen && (
                <div className="notification-popover">
                  <div className="popover-heading">
                    <strong>الإشعارات</strong>
                    <span>2 جديد</span>
                  </div>
                  <div className="notification-item">
                    <span className="notice-icon notice-amber">
                      <Wallet size={16} />
                    </span>
                    <div>
                      <strong>أقساط تحتاج متابعة</strong>
                      <small>12 قسطًا مستحقًا في الفرع</small>
                    </div>
                  </div>
                  <div className="notification-item">
                    <span className="notice-icon notice-teal">
                      <UserPlus size={16} />
                    </span>
                    <div>
                      <strong>طلبات تسجيل جديدة</strong>
                      <small>{leadCount} طلبات بانتظار التواصل</small>
                    </div>
                  </div>
                  <button
                    className="popover-footer"
                    onClick={() => showComingSoon("مركز الإشعارات")}
                  >
                    عرض كل الإشعارات <ChevronLeft size={14} />
                  </button>
                </div>
              )}
            </div>
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

        <div className="workspace">
          <section className="welcome-row">
            <div className="welcome-copy">
              <div className="eyebrow">
                <span className="eyebrow-dot" /> السبت، 26 سبتمبر 2026{" "}
                <span className="eyebrow-divider" /> الفصل الدراسي الأول
              </div>
              <h1>
                صباح الخير، أ. أحمد <span className="wave">✦</span>
              </h1>
              <p>إليك ملخص سريع لحالة الفرع ونشاطه اليوم.</p>
            </div>
            <div className="welcome-actions">
              <button
                className="button button-secondary"
                onClick={() =>
                  toast("جاري تجهيز التقرير", {
                    description: "تنزيل التقارير سيُفعّل في المرحلة القادمة.",
                  })
                }
              >
                <Download size={17} /> تنزيل التقرير
              </button>
              <button
                className="button button-primary"
                onClick={() => setStudentDialogOpen(true)}
              >
                <Plus size={18} /> إضافة طالب
              </button>
            </div>
          </section>

          <section className="stats-grid" aria-label="ملخص الفرع">
            <article className="stat-card">
              <div className="stat-topline">
                <span className="stat-icon icon-teal">
                  <Users size={19} />
                </span>
                <span className="stat-trend trend-up">
                  <ArrowUpLeft size={14} /> 8.4%
                </span>
              </div>
              <div className="stat-label">إجمالي الطلاب النشطين</div>
              <div className="stat-value-row">
                <strong>{studentCount}</strong>
                <span className="stat-period">طالب</span>
              </div>
              <div className="stat-foot">
                <span className="mini-bar">
                  <i style={{ width: "76%" }} />
                </span>
                <span>مقارنة بالشهر الماضي</span>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-topline">
                <span className="stat-icon icon-blue">
                  <CalendarCheck size={19} />
                </span>
                <span className="stat-trend trend-up">
                  <ArrowUpLeft size={14} /> 4.2%
                </span>
              </div>
              <div className="stat-label">حضور اليوم</div>
              <div className="stat-value-row">
                <strong>86</strong>
                <span className="stat-period">من 102 طالب</span>
              </div>
              <div className="stat-foot">
                <span className="mini-bar">
                  <i style={{ width: "84%" }} />
                </span>
                <span>معدل الحضور 84%</span>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-topline">
                <span className="stat-icon icon-amber">
                  <Wallet size={19} />
                </span>
                <span className="stat-trend trend-down">
                  <ArrowDownLeft size={14} /> متابعة
                </span>
              </div>
              <div className="stat-label">أقساط مستحقة</div>
              <div className="stat-value-row">
                <strong>12</strong>
                <span className="stat-period">قسط</span>
              </div>
              <div className="stat-foot">
                <span className="stat-hint">إجمالي المتأخرات</span>
                <b className="stat-money">12,850 ج.م</b>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-topline">
                <span className="stat-icon icon-violet">
                  <UserPlus size={19} />
                </span>
                <span className="stat-trend trend-up">
                  <ArrowUpLeft size={14} /> جديد
                </span>
              </div>
              <div className="stat-label">طلبات تسجيل جديدة</div>
              <div className="stat-value-row">
                <strong>{leadCount.toString().padStart(2, "0")}</strong>
                <span className="stat-period">طلب</span>
              </div>
              <div className="stat-foot">
                <span className="stat-hint">مصدرها صفحة الأكاديمية</span>
                <button
                  className="text-link"
                  onClick={() => showComingSoon("إدارة الطلبات")}
                >
                  عرض الطلبات <ChevronLeft size={13} />
                </button>
              </div>
            </article>
          </section>

          <section className="dashboard-grid">
            <div className="primary-column">
              <article className="panel schedule-panel">
                <div className="panel-heading">
                  <div className="panel-title-group">
                    <span className="panel-icon panel-icon-teal">
                      <CalendarDays size={18} />
                    </span>
                    <div>
                      <h2>جدول اليوم</h2>
                      <p>الحصص المجدولة في {branch}</p>
                    </div>
                  </div>
                  <div className="panel-actions">
                    <span className="live-pill">
                      <i /> 3 حصص
                    </span>
                    <button
                      className="more-button"
                      aria-label="المزيد"
                      onClick={() => showComingSoon("خيارات الجدول")}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                </div>
                <div className="table-wrap">
                  <table className="sessions-table">
                    <thead>
                      <tr>
                        <th>الحصة</th>
                        <th>الكوتش</th>
                        <th>المكان</th>
                        <th>الحضور</th>
                        <th>الحالة</th>
                        <th aria-label="إجراء" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map(session => (
                        <tr key={`${session.time}-${session.title}`}>
                          <td>
                            <div className="session-name">
                              <span
                                className={`course-marker marker-${session.color}`}
                              >
                                <BookOpen size={16} />
                              </span>
                              <span>
                                <strong>{session.title}</strong>
                                <small>{session.level}</small>
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="coach-cell">
                              <span className="coach-avatar">
                                {session.coach.charAt(0)}
                              </span>
                              <span>{session.coach}</span>
                            </div>
                          </td>
                          <td>
                            <span className="room-cell">
                              <MapPin size={14} /> {session.room}
                            </span>
                          </td>
                          <td>
                            <span className="attendance-count">
                              {session.attendance}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-pill ${session.status === "جارية" ? "status-live" : "status-upcoming"}`}
                            >
                              <i />
                              {session.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="row-action"
                              aria-label={`تفاصيل ${session.title}`}
                              onClick={() =>
                                toast("تفاصيل الحصة", {
                                  description: `${session.title} مع الكوتش ${session.coach} — ${session.time}`,
                                })
                              }
                            >
                              <ChevronLeft size={17} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredSessions.length === 0 && (
                        <tr>
                          <td colSpan={6}>
                            <div className="empty-state">
                              <Search size={18} />
                              <span>مفيش حصص مطابقة لعبارة «{query}»</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="schedule-footer">
                  <span>
                    <Clock3 size={14} /> آخر تحديث منذ دقيقتين
                  </span>
                  <button
                    className="text-link"
                    onClick={() => navigate("/schedule")}
                  >
                    عرض الجدول الكامل <ChevronLeft size={14} />
                  </button>
                </div>
              </article>

              <article className="panel attendance-panel">
                <div className="panel-heading">
                  <div className="panel-title-group">
                    <span className="panel-icon panel-icon-blue">
                      <BarChart3 size={18} />
                    </span>
                    <div>
                      <h2>معدل الحضور</h2>
                      <p>نظرة أسبوعية على التزام الطلاب</p>
                    </div>
                  </div>
                  <button
                    className="period-select"
                    onClick={() => toast("الفترة الحالية: آخر 7 أيام")}
                  >
                    آخر 7 أيام <ChevronDown size={14} />
                  </button>
                </div>
                <div className="chart-summary">
                  <strong>
                    82<span>%</span>
                  </strong>
                  <span className="summary-positive">
                    <TrendingUp size={14} /> 5.6%{" "}
                    <small>عن الأسبوع الماضي</small>
                  </span>
                </div>
                <div
                  className="attendance-chart"
                  role="img"
                  aria-label="معدل الحضور خلال آخر سبعة أيام"
                >
                  <div className="chart-y-labels">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                  </div>
                  <div className="chart-plot">
                    <div className="chart-gridline line-top" />
                    <div className="chart-gridline line-mid" />
                    <div className="chart-gridline line-low" />
                    {attendance.map((item, index) => (
                      <div className="bar-column" key={item.day}>
                        <span className="bar-value">{item.value}%</span>
                        <div
                          className={`bar-track ${index === 4 ? "bar-highlight" : ""}`}
                        >
                          <i style={{ height: `${item.value}%` }} />
                        </div>
                        <span className="bar-day">{item.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="chart-legend">
                  <span>
                    <i className="legend-dot" /> نسبة الحضور
                  </span>
                  <span>إجمالي المسجلين: 102 طالب</span>
                </div>
              </article>
            </div>

            <aside className="secondary-column">
              <article className="panel followup-panel">
                <div className="panel-heading compact-heading">
                  <div className="panel-title-group">
                    <span className="panel-icon panel-icon-amber">
                      <ClipboardIcon />
                    </span>
                    <div>
                      <h2>محتاج متابعة</h2>
                      <p>مهام تستدعي انتباهك</p>
                    </div>
                  </div>
                  <button
                    className="more-button"
                    aria-label="المزيد"
                    onClick={() => showComingSoon("قائمة المتابعة")}
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                <button
                  className="followup-item"
                  onClick={() => showComingSoon("طلبات التسجيل")}
                >
                  <span className="followup-icon followup-teal">
                    <UserPlus size={17} />
                  </span>
                  <span className="followup-copy">
                    <strong>طلبات تسجيل جديدة</strong>
                    <small>تحتاج تواصل مع ولي الأمر</small>
                  </span>
                  <b className="followup-number teal-number">
                    {leadCount.toString().padStart(2, "0")}
                  </b>
                </button>
                <button
                  className="followup-item"
                  onClick={() => showComingSoon("الأقساط المستحقة")}
                >
                  <span className="followup-icon followup-amber">
                    <Wallet size={17} />
                  </span>
                  <span className="followup-copy">
                    <strong>أقساط مستحقة</strong>
                    <small>مواعيدها خلال هذا الأسبوع</small>
                  </span>
                  <b className="followup-number amber-number">12</b>
                </button>
                <button
                  className="followup-item"
                  onClick={() => navigate("/approvals")}
                >
                  <span className="followup-icon followup-blue">
                    <FileText size={17} />
                  </span>
                  <span className="followup-copy">
                    <strong>موافقات مطلوبة</strong>
                    <small>خصومات وطلبات إدارية</small>
                  </span>
                  <b className="followup-number blue-number">03</b>
                </button>
                <button
                  className="panel-bottom-link"
                  onClick={() => showComingSoon("كل المهام")}
                >
                  عرض كل المهام <ChevronLeft size={14} />
                </button>
              </article>

              <article className="panel quick-panel">
                <div className="panel-heading compact-heading">
                  <div className="panel-title-group">
                    <span className="panel-icon panel-icon-teal">
                      <Sparkles size={17} />
                    </span>
                    <div>
                      <h2>اختصارات سريعة</h2>
                      <p>إنجاز أسرع للمهام اليومية</p>
                    </div>
                  </div>
                </div>
                <div className="quick-actions">
                  <button onClick={() => setStudentDialogOpen(true)}>
                    <span className="quick-icon quick-teal">
                      <UserPlus size={17} />
                    </span>
                    <span>تسجيل طالب</span>
                    <ChevronLeft size={15} />
                  </button>
                  <button onClick={() => navigate("/finance")}>
                    <span className="quick-icon quick-amber">
                      <Wallet size={17} />
                    </span>
                    <span>تسجيل تحصيل</span>
                    <ChevronLeft size={15} />
                  </button>
                  <button onClick={() => navigate("/schedule")}>
                    <span className="quick-icon quick-blue">
                      <CalendarDays size={17} />
                    </span>
                    <span>إضافة حصة للجدول</span>
                    <ChevronLeft size={15} />
                  </button>
                </div>
              </article>

              <div className="demo-note">
                <AlertCircle size={15} />
                <span>الأرقام والبيانات المعروضة تجريبية لأغراض التصميم.</span>
              </div>
            </aside>
          </section>

          <footer className="workspace-footer">
            <span>© مدى 2026</span>
            <span>واجهة تجريبية — إصدار 0.1</span>
          </footer>
        </div>
      </main>

      {studentDialogOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget)
              setStudentDialogOpen(false);
          }}
        >
          <section
            className="student-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
          >
            <div className="dialog-top">
              <span className="dialog-mark">
                <GraduationCap size={21} />
              </span>
              <button
                className="icon-button"
                aria-label="إغلاق"
                onClick={() => setStudentDialogOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <h2 id="dialog-title">إضافة طالب جديد</h2>
            <p>أدخل البيانات الأساسية لبدء تسجيل الطالب في الفرع.</p>
            <form onSubmit={handleStudentSubmit}>
              <label className="form-field">
                <span>
                  اسم الطالب <b>*</b>
                </span>
                <input
                  autoFocus
                  value={studentName}
                  onChange={event => setStudentName(event.target.value)}
                  placeholder="مثال: ياسين محمد"
                />
              </label>
              <label className="form-field">
                <span>
                  رقم ولي الأمر <b>*</b>
                </span>
                <input
                  value={parentPhone}
                  onChange={event => setParentPhone(event.target.value)}
                  placeholder="01XXXXXXXXX"
                  inputMode="tel"
                  dir="ltr"
                />
              </label>
              <div className="dialog-info">
                <AlertCircle size={15} />
                <span>هذه إضافة تجريبية؛ لن تُحفظ في قاعدة بيانات.</span>
              </div>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setStudentDialogOpen(false)}
                >
                  إلغاء
                </button>
                <button type="submit" className="button button-primary">
                  <Plus size={16} /> إضافة الطالب
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function ClipboardIcon() {
  return <FileText size={17} />;
}

export default App;
