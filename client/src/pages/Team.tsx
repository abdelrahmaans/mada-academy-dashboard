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
import { TeamManagementViews } from "@/components/TeamManagementViews";
import {
  ROLE_BY_CODE,
  ROLES,
  STATUS_LABELS,
  type RoleInfo,
  type RoleCode,
  type StaffMember,
  type StaffStatus,
} from "@/components/TeamModels";
import { useLocation } from "wouter";

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
    id: "USR-0208",
    name: "دينا مصطفى",
    phone: "01033334444",
    role: "R04",
    branch: "مدينة نصر",
    status: "active",
    joined: "04 مارس 2026",
    headOfInstructorsId: "USR-0201",
  },
  {
    id: "USR-0209",
    name: "كريم أشرف",
    phone: "01133334444",
    role: "R04",
    branch: "مدينة نصر",
    status: "active",
    joined: "18 يناير 2026",
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
              <button
                className="button button-secondary academy-owner-preview-button"
                onClick={() => navigate("/academy-owner")}
              >
                <GraduationCap size={17} /> معاينة رئيس الأكاديمية
              </button>
              <button
                className="button button-secondary academy-owner-preview-button"
                onClick={() => navigate("/platform-console")}
              >
                <ShieldCheck size={17} /> معاينة أدمن المنصة · R00
              </button>
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

          <TeamManagementViews
            branch={branch}
            branchStaff={branchStaff}
            instructorCount={instructorCount}
            activeCount={activeCount}
            adminCount={adminCount}
            roleCounts={roleCounts}
            openRole={openRole}
            filteredStaff={filteredStaff}
            query={query}
            setQuery={setQuery}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            toggleStatus={toggleStatus}
            dialog={dialog}
            setDialog={setDialog}
            name={name}
            setName={setName}
            phone={phone}
            setPhone={setPhone}
            newRole={newRole}
            setNewRole={value => setNewRole(value as typeof newRole)}
            supervisorId={supervisorId}
            setSupervisorId={setSupervisorId}
            activeInstructorHeads={activeInstructorHeads}
            submitStaff={submitStaff}
            selectedRole={selectedRole}
            navigate={navigate}
          />
        </div>
      </main>
    </div>
  );
}
