import { useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownLeft,
  ArrowDownToLine,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCog,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type RoleCode = "R02" | "R03" | "R04" | "R05" | "R06" | "R07";
type StaffStatus = "active" | "on_leave" | "terminated";
type StaffMember = {
  id: string;
  name: string;
  phone: string;
  role: Exclude<RoleCode, "R02">;
  branch: string;
  status: StaffStatus;
  joined: string;
  headOfInstructorsId?: string;
};
type RoleInfo = {
  code: RoleCode;
  name: string;
  english: string;
  description: string;
  icon: typeof ShieldCheck;
  tone: "teal" | "blue" | "amber" | "violet" | "navy";
  scope: string[];
  assignable: boolean;
};

const ROLES: RoleInfo[] = [
  {
    code: "R02",
    name: "مدير الفرع",
    english: "Branch Admin",
    description: "إدارة تشغيل الفرع والفريق",
    icon: ShieldCheck,
    tone: "navy",
    scope: ["لوحة الفرع", "الفريق", "الموافقات", "التقارير"],
    assignable: false,
  },
  {
    code: "R03",
    name: "رئيس المدربين",
    english: "Head of Instructors",
    description: "إشراف أكاديمي على المدربين",
    icon: GraduationCap,
    tone: "violet",
    scope: ["الجدول والحصص", "متابعة المدربين", "تقييمات الطلاب"],
    assignable: true,
  },
  {
    code: "R04",
    name: "مدرب",
    english: "Instructor",
    description: "تنفيذ الحصص ومتابعة الطلاب",
    icon: BookOpen,
    tone: "teal",
    scope: ["جدولي", "قوائم طلاب مجموعاتي", "الحضور والتقييم"],
    assignable: true,
  },
  {
    code: "R05",
    name: "سكرتارية",
    english: "Secretary",
    description: "التسجيل والتواصل التشغيلي",
    icon: Users,
    tone: "blue",
    scope: ["ملفات الطلاب", "طلبات التسجيل", "متابعة أولياء الأمور"],
    assignable: true,
  },
  {
    code: "R06",
    name: "محاسب",
    english: "Accountant",
    description: "التحصيل والمصروفات والمرتبات",
    icon: Wallet,
    tone: "amber",
    scope: ["الفواتير والتحصيل", "المصروفات", "مسيرات الرواتب"],
    assignable: true,
  },
  {
    code: "R07",
    name: "مسؤول التسويق",
    english: "Media Manager",
    description: "صفحة الأكاديمية والمهتمون",
    icon: Activity,
    tone: "blue",
    scope: ["صفحة الأكاديمية", "طلبات الاهتمام", "المحتوى التسويقي"],
    assignable: true,
  },
];
const ROLE_BY_CODE = Object.fromEntries(
  ROLES.map(role => [role.code, role])
) as Record<RoleCode, RoleInfo>;
const INITIAL_STAFF: StaffMember[] = [
  {
    id: "USR-0201",
    name: "مريم حسن",
    phone: "01012345678",
    role: "R03",
    branch: "مدينة نصر",
    status: "active",
    joined: "12 مايو 2025",
  },
  {
    id: "USR-0202",
    name: "عمر سامح",
    phone: "01123456789",
    role: "R04",
    branch: "مدينة نصر",
    status: "active",
    joined: "03 أغسطس 2025",
    headOfInstructorsId: "USR-0201",
  },
  {
    id: "USR-0203",
    name: "سارة خالد",
    phone: "01234567890",
    role: "R04",
    branch: "المعادي",
    status: "active",
    joined: "22 يناير 2025",
  },
  {
    id: "USR-0204",
    name: "يوسف عماد",
    phone: "01098765432",
    role: "R04",
    branch: "الشيخ زايد",
    status: "on_leave",
    joined: "10 يونيو 2025",
  },
  {
    id: "USR-0205",
    name: "هبة محمود",
    phone: "01109876543",
    role: "R05",
    branch: "مدينة نصر",
    status: "active",
    joined: "14 نوفمبر 2025",
  },
  {
    id: "USR-0206",
    name: "أحمد محمود",
    phone: "01210987654",
    role: "R06",
    branch: "مدينة نصر",
    status: "active",
    joined: "01 فبراير 2025",
  },
  {
    id: "USR-0207",
    name: "نورهان عادل",
    phone: "01087654321",
    role: "R07",
    branch: "المعادي",
    status: "active",
    joined: "18 مارس 2026",
  },
];
const STATUS_LABELS: Record<StaffStatus, string> = {
  active: "نشط",
  on_leave: "إجازة",
  terminated: "موقوف",
};

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

export default function Team() {
  const [, navigate] = useLocation();
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const branch = "مدينة نصر";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialog, setDialog] = useState<"add" | "role" | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleInfo>(ROLES[0]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [newRole, setNewRole] = useState<StaffMember["role"]>("R04");
  const [supervisorId, setSupervisorId] = useState("USR-0201");

  const branchStaff = useMemo(
    () => staff.filter(member => member.branch === branch),
    [staff, branch]
  );
  const activeInstructorHeads = branchStaff.filter(
    member => member.role === "R03" && member.status === "active"
  );
  const filteredStaff = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ar");
    return branchStaff.filter(member => {
      const role = ROLE_BY_CODE[member.role];
      const matchesText =
        !needle ||
        [member.name, member.phone, member.id, role.name].some(value =>
          value.toLocaleLowerCase("ar").includes(needle)
        );
      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" || member.status === statusFilter;
      return matchesText && matchesRole && matchesStatus;
    });
  }, [branchStaff, query, roleFilter, statusFilter]);
  const activeCount = branchStaff.filter(
    member => member.status === "active"
  ).length;
  const instructorCount = branchStaff.filter(
    member => member.role === "R03" || member.role === "R04"
  ).length;
  const adminCount = branchStaff.filter(member =>
    ["R05", "R06", "R07"].includes(member.role)
  ).length;
  const roleCounts = useMemo(() => {
    const counts = new Map<RoleCode, number>();
    for (const member of branchStaff)
      counts.set(member.role, (counts.get(member.role) ?? 0) + 1);
    counts.set("R02", 1);
    return counts;
  }, [branchStaff]);

  const showComingSoon = (label: string) => {
    toast("القسم قيد التجهيز", {
      description: `هنبدأ في تطوير «${label}» في المرحلة التالية.`,
    });
    setMobileNavOpen(false);
  };
  const openAddDialog = () => {
    setName("");
    setPhone("");
    setNewRole("R04");
    setSupervisorId(activeInstructorHeads[0]?.id ?? "");
    setDialog("add");
  };
  const submitStaff = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPhone = phone.replace(/[\s-]/g, "");
    if (!name.trim() || !/^01[0125]\d{8}$/.test(normalizedPhone)) {
      toast.error("أدخل اسمًا ورقم موبايل مصريًا صحيحًا");
      return;
    }
    if (staff.some(member => member.phone === normalizedPhone)) {
      toast.error("رقم الموبايل مسجل بالفعل في بيانات العرض");
      return;
    }
    if (
      newRole === "R04" &&
      !activeInstructorHeads.some(member => member.id === supervisorId)
    ) {
      toast.error("اختر مشرفًا أكاديميًا نشطًا من نفس الفرع");
      return;
    }
    const joined = new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
    setStaff(current => [
      {
        id: `USR-${String(Date.now()).slice(-4)}`,
        name: name.trim(),
        phone: normalizedPhone,
        role: newRole,
        branch,
        status: "active",
        joined,
        ...(newRole === "R04" ? { headOfInstructorsId: supervisorId } : {}),
      },
      ...current,
    ]);
    setDialog(null);
    toast.success("تمت إضافة الحساب إلى بيانات العرض المحلية", {
      description: "لم يتم إرسال OTP أو إنشاء حساب دخول حقيقي.",
    });
  };
  const toggleStatus = (member: StaffMember) => {
    const nextStatus: StaffStatus =
      member.status === "active" ? "on_leave" : "active";
    setStaff(current =>
      current.map(item =>
        item.id === member.id ? { ...item, status: nextStatus } : item
      )
    );
    toast.success(
      nextStatus === "active"
        ? "تم تفعيل الحالة في العرض"
        : "تم إيقاف الحساب مؤقتًا في العرض"
    );
  };
  const openRole = (role: RoleInfo) => {
    setSelectedRole(role);
    setDialog("role");
  };
  const downloadCsv = () => {
    const rows = [
      ["رقم المستخدم", "الاسم", "الهاتف", "الدور", "الفرع", "الحالة"],
      ...filteredStaff.map(member => [
        member.id,
        member.name,
        member.phone,
        ROLE_BY_CODE[member.role].name,
        member.branch,
        STATUS_LABELS[member.status],
      ]),
    ];
    const csv = `\uFEFF${rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "mada-branch-team-sample.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("تم تنزيل نسخة CSV من الفريق الظاهر");
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
          <button className="nav-link" onClick={() => navigate("/")}>
            <LayoutDashboard size={19} />
            <span>الرئيسية</span>
          </button>
          <button className="nav-link" onClick={() => navigate("/students")}>
            <Users size={19} />
            <span>الطلاب</span>
            <span className="nav-count">248</span>
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
          <button className="nav-link active" aria-current="page">
            <UserCog size={19} />
            <span>الفريق والأدوار</span>
          </button>
          <button className="nav-link" onClick={() => navigate("/approvals")}>
            <CheckCircle2 size={19} />
            <span>الموافقات</span>
          </button>
          <button className="nav-link" onClick={() => navigate("/reports")}>
            <Activity size={19} />
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
            onClick={() => toast("تسجيل الخروج التجريبي")}
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
                aria-label="ابحث عن عضو في الفريق"
                placeholder="ابحث بالاسم أو رقم الهاتف..."
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

        <div className="workspace team-workspace">
          <div className="students-breadcrumb">
            <button onClick={() => navigate("/")}>الرئيسية</button>
            <ChevronLeft size={13} />
            <span>الفريق والأدوار</span>
          </div>
          <section className="students-welcome team-welcome">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" /> إدارة فريق الفرع · الحسابات
                والأدوار
              </div>
              <h1>الفريق والأدوار</h1>
              <p>
                إدارة حسابات الموظفين ومراجعة نطاق عمل كل دور داخل {branch}.
              </p>
            </div>
            <div className="welcome-actions">
              <button className="button button-secondary" onClick={downloadCsv}>
                <ArrowDownToLine size={17} /> تصدير الفريق
              </button>
              <button className="button button-primary" onClick={openAddDialog}>
                <Plus size={18} /> إضافة حساب
              </button>
            </div>
          </section>
          <section className="team-demo-note" role="note">
            <AlertCircle size={16} />
            <span>
              بيانات توضيحية محلية. لا يتم إرسال رمز دخول أو إنشاء حساب فعلي،
              والتغييرات لا تُحفظ بعد إغلاق المعاينة.
            </span>
            <span className="demo-tag">DEMO</span>
          </section>

          <section
            className="finance-stats-grid team-stats"
            aria-label="ملخص فريق الفرع"
          >
            <article className="finance-stat">
              <span className="finance-stat-icon icon-teal">
                <Users size={18} />
              </span>
              <span className="finance-stat-label">أعضاء الفريق بالفرع</span>
              <div>
                <strong>{branchStaff.length + 1}</strong>
                <small>بما فيهم مدير الفرع</small>
              </div>
              <small>نطاق العرض الحالي: {branch}</small>
            </article>
            <article className="finance-stat">
              <span className="finance-stat-icon icon-blue">
                <GraduationCap size={18} />
              </span>
              <span className="finance-stat-label">الإشراف والتدريب</span>
              <div>
                <strong>{instructorCount}</strong>
                <small>رئيس مدربين ومدربون</small>
              </div>
              <small>موزعون على الجداول الأكاديمية</small>
            </article>
            <article className="finance-stat">
              <span className="finance-stat-icon icon-amber">
                <CheckCircle2 size={18} />
              </span>
              <span className="finance-stat-label">حسابات نشطة</span>
              <div>
                <strong>{activeCount + 1}</strong>
                <small>حسابات فعالة بالفرع</small>
              </div>
              <small>التغيير هنا تجريبي فقط</small>
            </article>
            <article className="finance-stat">
              <span className="finance-stat-icon icon-violet">
                <Clock3 size={18} />
              </span>
              <span className="finance-stat-label">أدوار تشغيلية مساندة</span>
              <div>
                <strong>{adminCount}</strong>
                <small>سكرتارية · مالية · تسويق</small>
              </div>
              <small>منفصلة عن صلاحيات المدرب</small>
            </article>
          </section>

          <section className="team-role-section">
            <div className="team-section-heading">
              <div>
                <div className="team-kicker">الأدوار على مستوى الفرع</div>
                <h2>كل دور له مساحة عمل مختلفة</h2>
                <p>نظرة مختصرة على الأدوار المعتمدة في هيكل الأكاديمية.</p>
              </div>
              <span className="team-role-count">6 أدوار</span>
            </div>
            <div className="team-role-grid">
              {ROLES.map(role => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.code}
                    className="team-role-card"
                    onClick={() => openRole(role)}
                  >
                    <span className={`team-role-icon role-${role.tone}`}>
                      <Icon size={18} />
                    </span>
                    <span className="team-role-copy">
                      <strong>{role.name}</strong>
                      <small>{role.english}</small>
                      <span>{role.description}</span>
                    </span>
                    <span className="team-role-number">
                      {roleCounts.get(role.code) ?? 0}
                    </span>
                    <ChevronLeft size={15} className="team-role-arrow" />
                  </button>
                );
              })}
            </div>
            <p className="team-permission-note">
              <ShieldCheck size={15} /> نطاقات الأدوار إرشادية حسب المستندات
              الحالية؛ مصفوفة الصلاحيات الدقيقة تُعتمد في مرحلة عقود الـAPI.
            </p>
          </section>

          <section className="panel team-table-panel">
            <div className="team-table-heading">
              <div className="panel-title-group">
                <span className="panel-icon panel-icon-teal">
                  <UserCog size={18} />
                </span>
                <div>
                  <h2>حسابات الفريق</h2>
                  <p>الأعضاء المرتبطون بفرع {branch}</p>
                </div>
              </div>
              <span className="team-table-total">
                {filteredStaff.length} عضو
              </span>
            </div>
            <div className="team-toolbar">
              <label className="team-search">
                <Search size={16} />
                <input
                  aria-label="بحث في الفريق"
                  placeholder="ابحث بالاسم أو الهاتف أو الدور..."
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                />
              </label>
              <select
                aria-label="تصفية حسب الدور"
                value={roleFilter}
                onChange={event => setRoleFilter(event.target.value)}
              >
                <option value="all">كل الأدوار</option>
                {ROLES.filter(role => role.assignable).map(role => (
                  <option key={role.code} value={role.code}>
                    {role.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="تصفية حسب الحالة"
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value)}
              >
                <option value="all">كل الحالات</option>
                <option value="active">نشط</option>
                <option value="on_leave">إجازة</option>
                <option value="terminated">موقوف</option>
              </select>
            </div>
            <div className="team-table-wrap">
              <table className="team-table">
                <thead>
                  <tr>
                    <th>الموظف</th>
                    <th>الدور</th>
                    <th>الفرع</th>
                    <th>الحالة</th>
                    <th>تاريخ الانضمام</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.length ? (
                    filteredStaff.map(member => {
                      const role = ROLE_BY_CODE[member.role];
                      const RoleIcon = role.icon;
                      return (
                        <tr key={member.id}>
                          <td>
                            <div className="team-member-cell">
                              <span className="team-avatar">
                                {member.name.slice(0, 1)}
                              </span>
                              <span>
                                <strong>{member.name}</strong>
                                <small dir="ltr">{member.phone}</small>
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="team-role-chip">
                              <RoleIcon size={14} />
                              {role.name}
                            </span>
                          </td>
                          <td>{member.branch}</td>
                          <td>
                            <span
                              className={`team-status status-${member.status}`}
                            >
                              <i />
                              {STATUS_LABELS[member.status]}
                            </span>
                          </td>
                          <td>{member.joined}</td>
                          <td>
                            <button
                              className="team-row-action"
                              onClick={() => toggleStatus(member)}
                            >
                              {member.status === "active"
                                ? "إيقاف مؤقت"
                                : "تفعيل"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        <div className="team-empty">
                          <Search size={20} />
                          <strong>مفيش نتائج مطابقة</strong>
                          <span>جرّب تغيير كلمة البحث أو الفلاتر.</span>
                          <button
                            className="text-link"
                            onClick={() => {
                              setQuery("");
                              setRoleFilter("all");
                              setStatusFilter("all");
                            }}
                          >
                            مسح الفلاتر
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="team-table-footer">
              <span>
                بيانات عرض تجريبية · {filteredStaff.length} من{" "}
                {branchStaff.length} حساب
              </span>
              <span>
                <ArrowDownLeft size={13} /> كل إجراء محلي وغير محفوظ
              </span>
            </div>
          </section>
          <div className="finance-footer-note">
            <span>
              <AlertCircle size={14} />
            </span>
            <p>
              إضافة عضو هنا لا تنشئ بيانات دخول ولا ترسل OTP. تسجيل الدخول،
              تعيين الصلاحيات الفعلية، وعزل البيانات حسب الفرع تحتاج ربط خدمة
              الهوية والـBackend.
            </p>
          </div>
        </div>
      </main>

      {dialog === "add" && (
        <div
          className="dialog-overlay"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setDialog(null);
          }}
        >
          <section
            className="dialog-card team-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-dialog-title"
          >
            <button
              className="dialog-close"
              aria-label="إغلاق"
              onClick={() => setDialog(null)}
            >
              <X size={17} />
            </button>
            <div className="team-dialog-icon">
              <UserPlus size={20} />
            </div>
            <div className="team-dialog-heading">
              <h2 id="team-dialog-title">إضافة حساب موظف</h2>
              <p>أضف بيانات عضو جديد إلى قائمة الفريق التجريبية.</p>
            </div>
            <form className="finance-form" onSubmit={submitStaff}>
              <label>
                الاسم الكامل
                <input
                  autoFocus
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="مثال: مريم أحمد حسن"
                />
              </label>
              <label>
                رقم الموبايل
                <input
                  dir="ltr"
                  inputMode="tel"
                  value={phone}
                  onChange={event => setPhone(event.target.value)}
                  placeholder="01xxxxxxxxx"
                />
              </label>
              <div className="finance-form-row">
                <label>
                  الدور
                  <select
                    value={newRole}
                    onChange={event => {
                      const role = event.target.value as StaffMember["role"];
                      setNewRole(role);
                      if (role === "R04" && !supervisorId)
                        setSupervisorId(activeInstructorHeads[0]?.id ?? "");
                    }}
                  >
                    {ROLES.filter(role => role.assignable).map(role => (
                      <option key={role.code} value={role.code}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="assigned-branch-field">
                  <span>الفرع</span>
                  <strong>{branch}</strong>
                  <small>الحساب الجديد يُضاف لفرعك الحالي</small>
                </div>
              </div>
              {newRole === "R04" && (
                <label className="team-supervisor-field">
                  المشرف الأكاديمي <b>*</b>
                  <select
                    required
                    value={supervisorId}
                    onChange={event => setSupervisorId(event.target.value)}
                    disabled={activeInstructorHeads.length === 0}
                  >
                    {activeInstructorHeads.length === 0 ? (
                      <option value="">لا يوجد رئيس مدربين نشط في الفرع</option>
                    ) : (
                      activeInstructorHeads.map(head => (
                        <option key={head.id} value={head.id}>
                          {head.name}
                        </option>
                      ))
                    )}
                  </select>
                  <small>
                    وفق علاقة المشرف المباشر للكوتش في مخطط البيانات.
                  </small>
                </label>
              )}
              <div className="team-role-preview">
                <span
                  className={`team-role-icon role-${ROLE_BY_CODE[newRole].tone}`}
                >
                  <ShieldCheck size={16} />
                </span>
                <div>
                  <strong>نطاق دور {ROLE_BY_CODE[newRole].name}</strong>
                  <small>{ROLE_BY_CODE[newRole].scope.join(" · ")}</small>
                  <small className="team-setup-hint">
                    {newRole === "R04"
                      ? "اربط المدرب برئيس مدربين نشط في نفس الفرع قبل التفعيل."
                      : newRole === "R05"
                        ? "جهّز قائمة التسجيل ومتابعة أولياء الأمور للحساب."
                        : newRole === "R06"
                          ? "النطاق المالي منفصل عن التسجيل والتقييم الأكاديمي."
                          : newRole === "R03"
                            ? "يظهر هذا الدور كمشرف أكاديمي قابل للربط بالمدربين."
                            : "النطاق إرشادي؛ التفعيل الحقيقي يحتاج خدمة الهوية والصلاحيات."}
                  </small>
                </div>
              </div>
              <div className="dialog-info">
                <AlertCircle size={15} />
                <span>
                  لن يتم إنشاء حساب دخول حقيقي أو إرسال OTP من هذه المعاينة.
                </span>
              </div>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setDialog(null)}
                >
                  إلغاء
                </button>
                <button type="submit" className="button button-primary">
                  <Check size={16} /> إضافة للعرض
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {dialog === "role" && (
        <div
          className="dialog-overlay"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setDialog(null);
          }}
        >
          <section
            className="dialog-card team-dialog team-role-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-dialog-title"
          >
            <button
              className="dialog-close"
              aria-label="إغلاق"
              onClick={() => setDialog(null)}
            >
              <X size={17} />
            </button>
            <div className={`team-role-icon role-${selectedRole.tone}`}>
              <selectedRole.icon size={20} />
            </div>
            <div className="team-dialog-heading">
              <span className="team-role-code">{selectedRole.code}</span>
              <h2 id="role-dialog-title">{selectedRole.name}</h2>
              <p>
                {selectedRole.english} · {selectedRole.description}
              </p>
            </div>
            <div className="role-scope-list">
              <strong>نطاقات العمل الموضحة</strong>
              {selectedRole.scope.map(item => (
                <span key={item}>
                  <CheckCircle2 size={15} />
                  {item}
                </span>
              ))}
            </div>
            <div className="dialog-info">
              <AlertCircle size={15} />
              <span>
                {selectedRole.assignable
                  ? "نطاق توضيحي؛ الصلاحيات النهائية تعتمد بعد إعداد مصفوفة الوصول وربط الـBackend."
                  : "دور الحساب الحالي للمدير؛ لا يمكن إنشاء مدير فرع آخر من نموذج الفريق التجريبي."}
              </span>
            </div>
            <div className="dialog-actions">
              <button
                className="button button-primary"
                onClick={() => setDialog(null)}
              >
                تم
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
