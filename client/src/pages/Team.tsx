import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  Bell,
  ChevronDown,
  ChevronLeft,
  MapPin,
  Menu,
  Plus,
  Search,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import { getRoleDefinition, type RoleCode as NavRoleCode } from "@/lib/roleNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";
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
    assignedWork: [
      "الإشراف الفني والأكاديمي على مدربي الفرع",
      "مراجعة واعتماد تقييمات الطلاب الأسبوعية",
      "متابعة جاهزية المعامل والحقائب التدريبية (Kits)",
    ],
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
    assignedWork: [
      "مجموعة Junior Robotics (Level 1) — السبت والثلاثاء 4:00م (12 طالب)",
      "مجموعة Python Coders — الإثنين والخميس 5:30م (10 طلاب)",
      "تسجيل حضور وتقييمات الجلسات",
    ],
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
    assignedWork: [
      "مجموعة AI Little Pioneers — الأحد والأربعاء 4:30م (8 طلاب)",
      "تدريب وتأهيل فريق الفرع لمسابقة الروبوتات السنوية WRO",
    ],
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
    assignedWork: [
      "مجموعة الإلكترونيات التطبيقية والدوائر — السبت 10:00ص (14 طالب)",
      "تجهيز مشاريع التخرج للمجموعات المتقدمة",
    ],
  },
  {
    id: "USR-0203",
    name: "سارة خالد",
    phone: "01234567890",
    role: "R04",
    branch: "المعادي",
    status: "active",
    joined: "22 يناير 2025",
    assignedWork: [
      "مجموعة Scratch & Game Design — الجمعة والسبت 2:00م (10 طلاب)",
    ],
  },
  {
    id: "USR-0204",
    name: "يوسف عماد",
    phone: "01098765432",
    role: "R04",
    branch: "الشيخ زايد",
    status: "on_leave",
    joined: "10 يونيو 2025",
    assignedWork: [
      "إجازة مؤقتة — تم نقل مجموعاته التدريبية لمدرب بديل",
    ],
  },
  {
    id: "USR-0205",
    name: "هبة محمود",
    phone: "01109876543",
    role: "R05",
    branch: "مدينة نصر",
    status: "active",
    joined: "14 نوفمبر 2025",
    assignedWork: [
      "إدارة الاستقبال والتسجيلات الجديدة وتسكين الطلاب",
      "إصدار إيصالات وسندات القبض ومتابعة الخزينة",
      "متابعة طلبات تجميد الاشتراكات والتعويضات",
    ],
  },
  {
    id: "USR-0206",
    name: "أحمد محمود",
    phone: "01210987654",
    role: "R06",
    branch: "مدينة نصر",
    status: "active",
    joined: "01 فبراير 2025",
    assignedWork: [
      "مطابقة الفواتير والتحصيلات اليومية مع البنك",
      "اعتماد أذون الصرف وإغلاق ورديات الخزينة",
      "إصدار مسيرات مستحقات المدربين الشهرية",
    ],
  },
  {
    id: "USR-0207",
    name: "نورهان عادل",
    phone: "01087654321",
    role: "R07",
    branch: "المعادي",
    status: "active",
    joined: "18 مارس 2026",
    assignedWork: [
      "إدارة الحملات الإعلانية ومتابعة العملاء المحتملين (Leads)",
      "التنسيق مع السكرتارية لمتابعة تحويل الاستفسارات إلى اشتراكات",
    ],
  },
];

export default function Team() {
  const [, navigate] = useLocation();
  const { me } = useAuth();
  const isLive = apiClient.hasSession();
  const assignedBranchName =
    me?.branchId
      ? me.branches?.find(b => b.id === me.branchId)?.name ?? "الفرع الحالي"
      : isLive
      ? "كل الفروع"
      : "مدينة نصر";
  const branch = assignedBranchName;

  const [staff, setStaff] = useState<StaffMember[]>(() => (isLive ? [] : INITIAL_STAFF));
  const [liveManagerCount, setLiveManagerCount] = useState(0);
  const [liveLoading, setLiveLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialog, setDialog] = useState<"add" | "role" | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleInfo>(ROLES[0]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [newRole, setNewRole] = useState<StaffMember["role"]>("R04");
  const [supervisorId, setSupervisorId] = useState("");

  useEffect(() => {
    if (!isLive) return;
    let active = true;
    setLiveLoading(true);
    apiClient
      .branchTeam(me?.branchId ?? undefined)
      .then(res => {
        if (!active) return;
        const managers = res.items.filter(m => m.roleCode.startsWith("R02"));
        setLiveManagerCount(managers.length);
        const mapped: StaffMember[] = res.items
          .filter(m => ["R03", "R04", "R05", "R06", "R07"].includes(m.roleCode.slice(0, 3)))
          .map(m => ({
            id: m.membershipId,
            name: m.name,
            phone: m.phone,
            role: m.roleCode.slice(0, 3) as StaffMember["role"],
            branch: m.branch?.name ?? assignedBranchName,
            status: m.status === "ACTIVE" ? "active" : "on_leave",
            joined: new Date(m.joinedAt).toLocaleDateString("ar-EG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          }));
        setStaff(mapped);
      })
      .catch(err => {
        if (!active) return;
        toast.error(err instanceof Error ? err.message : "تعذر تحميل قائمة فريق الفرع");
      })
      .finally(() => {
        if (active) setLiveLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isLive, me?.branchId, assignedBranchName, refreshTick]);

  const branchStaff = useMemo(
    () => (isLive ? staff : staff.filter(member => member.branch === branch)),
    [isLive, staff, branch]
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
    counts.set("R02", isLive ? liveManagerCount : 1);
    return counts;
  }, [branchStaff, isLive, liveManagerCount]);
  const openAddDialog = () => {
    setName("");
    setPhone("");
    setNewRole("R04");
    setSupervisorId(activeInstructorHeads[0]?.id ?? "");
    setDialog("add");
  };
  const submitStaff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPhone = phone.replace(/[\s-]/g, "");
    if (!name.trim() || !/^01[0125]\d{8}$/.test(normalizedPhone)) {
      toast.error("أدخل اسمًا ورقم موبايل مصريًا صحيحًا");
      return;
    }
    if (staff.some(member => member.phone === normalizedPhone)) {
      toast.error("رقم الموبايل مسجل بالفعل في الفريق");
      return;
    }

    if (isLive) {
      const fullRoleCode =
        newRole === "R03"
          ? "R03_HEAD_INSTRUCTORS"
          : newRole === "R04"
          ? "R04_INSTRUCTOR"
          : newRole === "R05"
          ? "R05_SECRETARY"
          : newRole === "R06"
          ? "R06_ACCOUNTANT"
          : "R07_MEDIA_MANAGER";
      try {
        const slug = normalizedPhone.slice(-6);
        await apiClient.addAcademyMember({
          fullName: name.trim(),
          email: `staff.${slug}@mada.demo`,
          phone: `+2${normalizedPhone}`,
          password: "Mada@2026",
          roleCode: fullRoleCode,
          branchId: me?.branchId ?? me?.branches?.[0]?.id,
        });
        setDialog(null);
        setRefreshTick(v => v + 1);
        toast.success("تم إنشاء حساب العضو وتفعيله في قاعدة البيانات");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "تعذر إضافة العضو");
      }
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
  const toggleStatus = async (member: StaffMember) => {
    const nextStatus: StaffStatus =
      member.status === "active" ? "on_leave" : "active";

    if (isLive) {
      const apiStatus = nextStatus === "active" ? "ACTIVE" : "SUSPENDED";
      try {
        await apiClient.changeBranchMemberStatus(member.id, apiStatus);
        setStaff(current =>
          current.map(item =>
            item.id === member.id ? { ...item, status: nextStatus } : item
          )
        );
        toast.success(
          apiStatus === "ACTIVE"
            ? "تم تفعيل حساب الموظف بنجاح"
            : "تم إيقاف حساب الموظف مؤقتاً"
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "تعذر تحديث حالة الحساب");
      }
      return;
    }

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

  const userRoleCode = me?.role ? (me.role.replace(/_.*$/, "") as NavRoleCode) : undefined;
  const activeRoleCode: NavRoleCode = userRoleCode || "R02";
  const roleDef = getRoleDefinition(activeRoleCode);
  const branchContext = me?.branchId ? me.branches?.find(b => b.id === me.branchId)?.name : branch;
  const displayName = me?.user?.displayName || "أحمد محمود";
  const roleTitle = me?.roleLabel || roleDef.label;

  return (
    <RoleDashboardShell
      className="app-shell team-shell"
      roleCode={activeRoleCode}
      roleLabel={roleTitle}
      scopeLevel={roleDef.scopeLevel}
      scopeLabel={roleDef.defaultScopeLabel}
      tenantName={me?.academy?.name}
      branchName={branchContext}
      demo={!isLive}
      mobileOpen={mobileNavOpen}
      onCloseMobile={() => setMobileNavOpen(false)}
    >
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
              aria-label={`النطاق: ${branch}`}
            >
              <span className="branch-icon">
                <MapPin size={17} />
              </span>
              <span>{branch}</span>
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
                <strong>{displayName}</strong>
                <small>{roleTitle}</small>
              </span>
              <span className="profile-avatar">{displayName.slice(0, 2)}</span>
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
                <span className="eyebrow-dot" /> إدارة فريق الفرع ·{" "}
                {isLive ? (liveLoading ? "جاري التحميل..." : "بيانات حية") : "الأدوار والحسابات"}
              </div>
              <h1>الفريق والأدوار</h1>
              <p>
                إدارة حسابات الموظفين ومراجعة نطاق عمل كل دور داخل {branch}.
              </p>
            </div>
            <div className="welcome-actions">
              <button
                className="button button-secondary"
                onClick={() => navigate("/supervision-assignments")}
              >
                <UserPlus size={17} /> متابعة وتفويض المجموعات
              </button>
              <button className="button button-secondary" onClick={downloadCsv}>
                <ArrowDownToLine size={17} /> تصدير الفريق
              </button>
              <button className="button button-primary" onClick={openAddDialog}>
                <Plus size={18} /> إضافة حساب
              </button>
            </div>
          </section>
          {!isLive && (
            <section className="team-demo-note" role="note">
              <AlertCircle size={16} />
              <span>
                بيانات توضيحية محلية. لا يتم إرسال رمز دخول أو إنشاء حساب فعلي،
                والتغييرات لا تُحفظ بعد إغلاق المعاينة.
              </span>
              <span className="demo-tag">DEMO</span>
            </section>
          )}

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
    </RoleDashboardShell>
  );
}
