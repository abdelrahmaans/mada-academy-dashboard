import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpLeft,
  BookOpen,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  Filter,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "@/components/FeedbackStates";
import {
  apiClient,
  type ConsumerAccountLookupRecord,
  type ConsumerInvitationDelivery,
  type ConsumerLinksResponse,
  type StudentRecord,
} from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import {
  AddStudentDialog,
  StudentsTableSection,
} from "@/components/StudentsViews";

export type StudentStatus = "active" | "on_hold" | "inactive" | "graduated";
export type StudentSource =
  | "walk_in"
  | "landing_page"
  | "referral"
  | "social_media"
  | "event";
export type Student = {
  id: string;
  name: string;
  birthDate: string;
  gender: "male" | "female";
  parentName: string;
  parentPhone: string;
  relation: "الأب" | "الأم" | "ولي أمر";
  branch: string;
  course: string;
  source: StudentSource;
  status: StudentStatus;
  joined: string;
  initials: string;
  color: string;
};

const initialStudents: Student[] = [
  {
    id: "MAD-0248",
    name: "ياسين محمد علي",
    birthDate: "2015-05-12",
    gender: "male",
    parentName: "محمد علي",
    parentPhone: "01012345678",
    relation: "الأب",
    branch: "مدينة نصر",
    course: "روبوتكس مستوى 2",
    source: "landing_page",
    status: "active",
    joined: "12 سبتمبر 2026",
    initials: "يع",
    color: "teal",
  },
  {
    id: "MAD-0247",
    name: "ليلى أحمد محمود",
    birthDate: "2014-11-03",
    gender: "female",
    parentName: "أحمد محمود",
    parentPhone: "01123456789",
    relation: "الأب",
    branch: "المعادي",
    course: "برمجة للمبتدئين",
    source: "referral",
    status: "active",
    joined: "10 سبتمبر 2026",
    initials: "لم",
    color: "violet",
  },
  {
    id: "MAD-0246",
    name: "عمر خالد إبراهيم",
    birthDate: "2013-02-18",
    gender: "male",
    parentName: "نهى إبراهيم",
    parentPhone: "01234567890",
    relation: "الأم",
    branch: "مدينة نصر",
    course: "دوائر إلكترونية",
    source: "walk_in",
    status: "active",
    joined: "08 سبتمبر 2026",
    initials: "عإ",
    color: "blue",
  },
  {
    id: "MAD-0245",
    name: "ملك حسام الدين",
    birthDate: "2016-08-24",
    gender: "female",
    parentName: "حسام الدين",
    parentPhone: "01098765432",
    relation: "الأب",
    branch: "الشيخ زايد",
    course: "روبوتكس مستوى 1",
    source: "social_media",
    status: "on_hold",
    joined: "04 سبتمبر 2026",
    initials: "مح",
    color: "amber",
  },
  {
    id: "MAD-0244",
    name: "آدم شريف حسن",
    birthDate: "2012-01-30",
    gender: "male",
    parentName: "شريف حسن",
    parentPhone: "01109876543",
    relation: "الأب",
    branch: "مدينة نصر",
    course: "ذكاء اصطناعي للصغار",
    source: "event",
    status: "active",
    joined: "01 سبتمبر 2026",
    initials: "آح",
    color: "navy",
  },
  {
    id: "MAD-0243",
    name: "نور عمرو فؤاد",
    birthDate: "2015-07-17",
    gender: "female",
    parentName: "عمرو فؤاد",
    parentPhone: "01210987654",
    relation: "الأب",
    branch: "المعادي",
    course: "برمجة الألعاب",
    source: "landing_page",
    status: "inactive",
    joined: "28 أغسطس 2026",
    initials: "نف",
    color: "rose",
  },
  {
    id: "MAD-0242",
    name: "سيف مصطفى عادل",
    birthDate: "2011-10-06",
    gender: "male",
    parentName: "مصطفى عادل",
    parentPhone: "01087654321",
    relation: "الأب",
    branch: "الشيخ زايد",
    course: "الدوائر والروبوتات",
    source: "referral",
    status: "active",
    joined: "25 أغسطس 2026",
    initials: "سع",
    color: "teal",
  },
  {
    id: "MAD-0241",
    name: "جنى طارق سعيد",
    birthDate: "2014-04-09",
    gender: "female",
    parentName: "طارق سعيد",
    parentPhone: "01187654320",
    relation: "الأب",
    branch: "مدينة نصر",
    course: "مهارات التفكير الإبداعي",
    source: "walk_in",
    status: "graduated",
    joined: "20 أغسطس 2026",
    initials: "جس",
    color: "violet",
  },
];

const statusLabels: Record<StudentStatus, string> = {
  active: "نشط",
  on_hold: "موقوف مؤقتًا",
  inactive: "غير نشط",
  graduated: "متخرج",
};
const sourceLabels: Record<StudentSource, string> = {
  walk_in: "زيارة مباشرة",
  landing_page: "صفحة الأكاديمية",
  referral: "ترشيح",
  social_media: "سوشيال ميديا",
  event: "فعالية",
};
const branches = ["كل الفروع", "مدينة نصر", "المعادي", "الشيخ زايد"];
const PAGE_SIZE = 6;
const LIVE_BRANCH_LABELS: Record<string, string> = {
  "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb": "مدينة نصر",
  "cccccccc-cccc-cccc-cccc-cccccccccccc": "مصر الجديدة",
};
function mapLiveStudent(record: StudentRecord): Student {
  const status: StudentStatus =
    record.status === "ACTIVE"
      ? "active"
      : record.status === "SUSPENDED"
        ? "on_hold"
        : record.status === "GRADUATED"
          ? "graduated"
          : "inactive";
  const initials = record.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join("");
  return {
    id: record.id,
    name: record.fullName,
    birthDate: record.dateOfBirth ?? "—",
    gender: "male",
    parentName: "غير متاح من عقد الطلاب الحالي",
    parentPhone: "—",
    relation: "ولي أمر",
    branch:
      LIVE_BRANCH_LABELS[record.branchId] ??
      `فرع ${record.branchId.slice(0, 8)}`,
    course:
      record.activeEnrollmentCount > 0
        ? "يوجد تسجيل نشط"
        : "لم يتم التسجيل في كورس",
    source: "walk_in",
    status,
    joined: "من قاعدة البيانات",
    initials,
    color: status === "active" ? "teal" : "amber",
  };
}

export type StudentJourneySummary = {
  attendance: string;
  attendanceNote: string;
  nextSession: string;
  nextSessionNote: string;
  payment: string;
  paymentNote: string;
  progress: number;
};

function getStudentJourney(student: Student): StudentJourneySummary {
  if (student.course === "لم يتم التسجيل في كورس") {
    return {
      attendance: "—",
      attendanceNote: "لا توجد جلسات مسجلة",
      nextSession: "غير محددة",
      nextSessionNote: "يحتاج تسجيل في مجموعة",
      payment: "لا توجد فاتورة",
      paymentNote: "سيظهر بعد التسجيل",
      progress: 0,
    };
  }

  if (student.status === "graduated") {
    return {
      attendance: "94%",
      attendanceNote: "انتظام ممتاز",
      nextSession: "اكتمل المسار",
      nextSessionNote: "جاهز للشهادة",
      payment: "مدفوع بالكامل",
      paymentNote: "لا توجد مستحقات",
      progress: 100,
    };
  }

  if (student.status === "on_hold") {
    return {
      attendance: "71%",
      attendanceNote: "يحتاج متابعة",
      nextSession: "موقوف مؤقتًا",
      nextSessionNote: "راجع حالة التسجيل",
      payment: "قسط مستحق",
      paymentNote: "يحتاج تواصل مع الأسرة",
      progress: 46,
    };
  }

  return {
    attendance: student.id.endsWith("248") ? "88%" : "86%",
    attendanceNote: "من آخر ٨ جلسات",
    nextSession: "الأحد · ١٢:٠٠ م",
    nextSessionNote: "معمل ١ · الجلسة ٩",
    payment: student.id.endsWith("247") ? "قسطان متبقيان" : "مدفوع حتى أكتوبر",
    paymentNote: student.id.endsWith("247")
      ? "أقرب استحقاق ١ أكتوبر"
      : "آخر تحصيل ١ سبتمبر",
    progress: student.id.endsWith("248") ? 72 : 64,
  };
}

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

function StudentPage() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [students, setStudents] = useState<Student[]>(
    apiClient.hasSession() ? [] : initialStudents
  );
  const [dataMode, setDataMode] = useState<"demo" | "live">(
    apiClient.hasSession() ? "live" : "demo"
  );
  const [dataLoading, setDataLoading] = useState(apiClient.hasSession());
  const [dataError, setDataError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "all">(
    "all"
  );
  const [branchFilter, setBranchFilter] = useState("كل الفروع");
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [detailsStudent, setDetailsStudent] = useState<Student | null>(null);
  const [consumerLinks, setConsumerLinks] =
    useState<ConsumerLinksResponse | null>(null);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linksError, setLinksError] = useState<string | null>(null);
  const [linkPhone, setLinkPhone] = useState("");
  const [lookupResults, setLookupResults] = useState<
    ConsumerAccountLookupRecord[] | null
  >(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [invitationResult, setInvitationResult] =
    useState<ConsumerInvitationDelivery | null>(null);
  const [linkingAccountId, setLinkingAccountId] = useState<string | null>(null);
  const [linkKind, setLinkKind] = useState<"guardian" | "student">("guardian");
  const [linkRelationship, setLinkRelationship] = useState("ولي أمر");
  const [studentName, setStudentName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [source, setSource] = useState<StudentSource>("walk_in");
  const [newBranch, setNewBranch] = useState("مدينة نصر");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!apiClient.hasSession()) return;
    let cancelled = false;
    setDataLoading(true);
    apiClient
      .listStudents()
      .then(response => {
        if (cancelled) return;
        setStudents(response.items.map(mapLiveStudent));
        setDataMode("live");
        setDataError(null);
        setPage(1);
      })
      .catch(error => {
        if (cancelled) return;
        setDataMode("live");
        setStudents([]);
        setDataError(
          error instanceof Error ? error.message : "تعذر الاتصال ببيانات الطلاب"
        );
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setLookupResults(null);
    setLookupError(null);
    setLinkPhone("");
    if (dataMode !== "live" || !detailsStudent) {
      setConsumerLinks(null);
      setLinksError(null);
      return;
    }
    let cancelled = false;
    setLinksLoading(true);
    setLinksError(null);
    apiClient
      .studentConsumerLinks(detailsStudent.id)
      .then(result => {
        if (!cancelled) setConsumerLinks(result);
      })
      .catch(error => {
        if (!cancelled)
          setLinksError(
            error instanceof Error ? error.message : "تعذر تحميل روابط الحسابات"
          );
      })
      .finally(() => {
        if (!cancelled) setLinksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dataMode, detailsStudent]);

  const filteredStudents = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ar");
    return students.filter(student => {
      const matchesQuery =
        !needle ||
        [
          student.name,
          student.id,
          student.parentName,
          student.parentPhone,
          student.course,
        ].some(value => value.toLocaleLowerCase("ar").includes(needle));
      const matchesStatus =
        statusFilter === "all" || student.status === statusFilter;
      const matchesBranch =
        branchFilter === "كل الفروع" || student.branch === branchFilter;
      return matchesQuery && matchesStatus && matchesBranch;
    });
  }, [students, query, statusFilter, branchFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const visibleStudents = filteredStudents.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );
  const branchOptions =
    dataMode === "live"
      ? [
          "كل الفروع",
          ...Array.from(new Set(students.map(student => student.branch))),
        ]
      : branches;
  const pausedCount = students.filter(
    student => student.status === "on_hold"
  ).length;
  const monthCount = students.filter(student =>
    student.joined.includes("سبتمبر 2026")
  ).length;

  const comingSoon = (feature: string) => {
    toast("القسم قيد التجهيز", {
      description: `هنبدأ في تطوير «${feature}» في المرحلة التالية.`,
    });
    setMobileNavOpen(false);
  };

  const resetForm = () => {
    setStudentName("");
    setBirthDate("");
    setGender("male");
    setParentName("");
    setParentPhone("");
    setSource("walk_in");
    setNewBranch("مدينة نصر");
  };

  const submitStudent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (dataMode === "live") {
      toast("إضافة الطالب تحتاج endpoint التسجيل", {
        description:
          "تم ربط القراءة الحية أولًا؛ لن يتم إيهامك بأن الإضافة حُفظت.",
      });
      return;
    }
    if (
      !studentName.trim() ||
      !birthDate ||
      !parentName.trim() ||
      !parentPhone.trim()
    ) {
      toast.error("أكمل البيانات المطلوبة الأول");
      return;
    }
    const initials = studentName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0])
      .join("");
    const next: Student = {
      id: `MAD-${String(249 + students.length - initialStudents.length).padStart(4, "0")}`,
      name: studentName.trim(),
      birthDate,
      gender,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      relation: "ولي أمر",
      branch: newBranch,
      course: "لم يتم التسجيل في كورس",
      source,
      status: "active",
      joined: "اليوم، سبتمبر 2026",
      initials,
      color: gender === "female" ? "violet" : "teal",
    };
    setStudents(current => [next, ...current]);
    setStatusFilter("all");
    setBranchFilter("كل الفروع");
    setQuery("");
    setPage(1);
    setAddOpen(false);
    resetForm();
    toast.success("اتضاف الطالب بنجاح", {
      description: "تمت الإضافة في بيانات العرض التجريبية فقط.",
    });
  };

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setBranchFilter("كل الفروع");
    setPage(1);
  };

  const searchConsumerAccounts = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detailsStudent || !linkPhone.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupResults(null);
    setInvitationResult(null);
    try {
      const result = await apiClient.searchConsumerAccounts(
        detailsStudent.id,
        linkPhone.trim(),
        linkKind === "student" ? "student" : "parent"
      );
      setLookupResults(result.items);
    } catch (error) {
      setLookupError(
        error instanceof Error ? error.message : "تعذر البحث عن الحساب"
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const inviteConsumerAccount = async () => {
    if (!detailsStudent || !linkPhone.trim()) return;
    setInvitationLoading(true);
    setLookupError(null);
    setInvitationResult(null);
    try {
      const result = await apiClient.createConsumerInvitation(
        detailsStudent.id,
        {
          phone: linkPhone.trim(),
          accountType: linkKind === "student" ? "student" : "parent",
          relationship: linkKind === "guardian" ? linkRelationship : undefined,
        }
      );
      setInvitationResult(result);
      toast.success("تم إنشاء دعوة الحساب", {
        description: result.developmentCode
          ? "رمز الاختبار ظاهر أسفل البحث."
          : "ستصل الرسالة إذا كان إرسال SMS مفعّلًا في بيئة التشغيل.",
      });
    } catch (error) {
      setLookupError(
        error instanceof Error ? error.message : "تعذر إرسال دعوة الحساب"
      );
    } finally {
      setInvitationLoading(false);
    }
  };

  const linkConsumerAccount = async (account: ConsumerAccountLookupRecord) => {
    if (!detailsStudent) return;
    setLinkingAccountId(account.id);
    try {
      if (account.accountType === "student")
        await apiClient.linkStudentAccount(detailsStudent.id, account.id);
      else
        await apiClient.linkGuardian(detailsStudent.id, {
          userAccountId: account.id,
          relationship: linkRelationship,
        });
      setConsumerLinks(await apiClient.studentConsumerLinks(detailsStudent.id));
      setLookupResults(null);
      setLinkPhone("");
      toast.success(
        account.accountType === "student"
          ? "تم ربط حساب الطالب"
          : "تم ربط حساب ولي الأمر"
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر ربط الحساب");
    } finally {
      setLinkingAccountId(null);
    }
  };

  const unlinkConsumerAccount = async (
    kind: "guardian" | "student",
    accountId: string
  ) => {
    if (
      !detailsStudent ||
      !window.confirm(
        "هل تريد إزالة هذا الربط؟ سيفقد الحساب وصوله إلى بيانات الطالب عبر بوابته."
      )
    )
      return;
    try {
      if (kind === "student")
        await apiClient.unlinkStudentAccount(detailsStudent.id);
      else await apiClient.unlinkGuardian(detailsStudent.id, accountId);
      setConsumerLinks(await apiClient.studentConsumerLinks(detailsStudent.id));
      toast.success("تم إلغاء ربط الحساب");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إلغاء الربط");
    }
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
          <button className="nav-link" onClick={() => setLocation("/")}>
            <LayoutDashboard size={19} />
            <span>الرئيسية</span>
          </button>
          <button className="nav-link active" aria-current="page">
            <Users size={19} />
            <span>الطلاب</span>
            <span className="nav-count">
              {248 + students.length - initialStudents.length}
            </span>
          </button>
          <button className="nav-link" onClick={() => setLocation("/schedule")}>
            <CalendarDays size={19} />
            <span>الجدول</span>
          </button>
          <button className="nav-link" onClick={() => setLocation("/classes")}>
            <BookOpen size={19} />
            <span>الحصص والكورسات</span>
          </button>
          <button className="nav-link" onClick={() => comingSoon("المسابقات")}>
            <Sparkles size={19} />
            <span>المسابقات</span>
          </button>
        </nav>
        <div className="nav-caption nav-caption-spaced">الإدارة</div>
        <nav className="primary-nav" aria-label="قائمة الإدارة">
          <button className="nav-link" onClick={() => setLocation("/finance")}>
            <Wallet size={19} />
            <span>المالية والتحصيل</span>
          </button>
          <button className="nav-link" onClick={() => setLocation("/team")}>
            <Users size={19} />
            <span>الفريق والأدوار</span>
          </button>
          <button
            className="nav-link"
            onClick={() => setLocation("/approvals")}
          >
            <CheckCircle2 size={19} />
            <span>الموافقات</span>
          </button>
          <button className="nav-link" onClick={() => setLocation("/reports")}>
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
          <button className="nav-link" onClick={() => comingSoon("الإعدادات")}>
            <Settings size={19} />
            <span>الإعدادات</span>
          </button>
          <button
            className="nav-link"
            onClick={() => {
              void logout().then(() => setLocation("/login"));
            }}
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
                aria-expanded={branchMenuOpen}
                onClick={() => setBranchMenuOpen(open => !open)}
              >
                <span className="branch-icon">
                  <MapPin size={17} />
                </span>
                <span>
                  {branchFilter === "كل الفروع"
                    ? "كل الفروع"
                    : `فرع ${branchFilter}`}
                </span>
                <ChevronDown size={15} />
              </button>
              {branchMenuOpen && (
                <div className="branch-menu">
                  {branches.slice(1).map(branch => (
                    <button
                      key={branch}
                      onClick={() => {
                        setBranchFilter(branch);
                        setBranchMenuOpen(false);
                        setPage(1);
                      }}
                    >
                      <MapPin size={15} />
                      {branch}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setBranchFilter("كل الفروع");
                      setBranchMenuOpen(false);
                      setPage(1);
                    }}
                  >
                    كل الفروع
                  </button>
                </div>
              )}
            </div>
            <label className="top-search">
              <Search size={18} />
              <input
                placeholder="ابحث عن طالب أو ولي أمر..."
                aria-label="ابحث عن طالب أو ولي أمر"
                value={query}
                onChange={event => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
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

        <div className="workspace students-workspace">
          <div className="students-breadcrumb">
            <button onClick={() => setLocation("/")}>الرئيسية</button>
            <ChevronLeft size={13} />
            <span>الطلاب</span>
          </div>
          <section className="students-welcome">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" /> إدارة قاعدة بيانات الفرع
              </div>
              <h1>الطلاب</h1>
              <p>تابع بيانات الطلاب والتسجيلات وأولياء الأمور من مكان واحد.</p>
            </div>
            <div className="welcome-actions">
              <button
                className="button button-secondary"
                onClick={() =>
                  toast("تصدير ملف الطلاب متاح عند ربط البيانات الحقيقية")
                }
              >
                <ArrowDownToLine size={17} /> تصدير القائمة
              </button>
              <button
                className="button button-primary"
                onClick={() => setAddOpen(true)}
              >
                <Plus size={18} /> إضافة طالب
              </button>
            </div>
          </section>

          {dataLoading && (
            <LoadingState label="جارٍ تحميل الطلاب من الـAPI…" compact />
          )}
          {dataError && (
            <ErrorState
              compact
              title="تعذر تحميل الطلاب من الـAPI"
              description={`${dataError} · لم يتم استبدال بيانات الخادم ببيانات تجريبية.`}
            />
          )}
          {!dataLoading && !dataError && dataMode === "live" && (
            <div
              className="role-feedback-state role-feedback-success role-feedback-compact"
              role="status"
            >
              البيانات LIVE من PostgreSQL · القراءة مقيدة بنطاق الحساب الحالي
            </div>
          )}

          <section className="student-stats-grid" aria-label="ملخص الطلاب">
            <article className="student-stat">
              <span className="student-stat-icon icon-teal">
                <Users size={18} />
              </span>
              <span className="student-stat-label">إجمالي الطلاب</span>
              <div>
                <strong>{students.length}</strong>
                <span>طالب مسجل</span>
              </div>
              <small>
                <ArrowUpLeft size={13} /> 12 طالب جديد الشهر ده
              </small>
            </article>
            <article className="student-stat">
              <span className="student-stat-icon icon-blue">
                <CheckCircle2 size={18} />
              </span>
              <span className="student-stat-label">طلاب نشطون</span>
              <div>
                <strong>
                  {
                    students.filter(student => student.status === "active")
                      .length
                  }
                </strong>
                <span>طالب</span>
              </div>
              <small className="stat-neutral">في كورس أو مجموعة حاليًا</small>
            </article>
            <article className="student-stat">
              <span className="student-stat-icon icon-amber">
                <UserPlus size={18} />
              </span>
              <span className="student-stat-label">تسجيلات الشهر</span>
              <div>
                <strong>
                  {String(Math.max(14, monthCount)).padStart(2, "0")}
                </strong>
                <span>تسجيل جديد</span>
              </div>
              <small>
                <ArrowUpLeft size={13} /> مقارنة بالشهر الماضي
              </small>
            </article>
            <article className="student-stat">
              <span className="student-stat-icon icon-violet">
                <Clock3 size={18} />
              </span>
              <span className="student-stat-label">موقوفون مؤقتًا</span>
              <div>
                <strong>{String(pausedCount).padStart(2, "0")}</strong>
                <span>طلاب</span>
              </div>
              <small className="stat-neutral">يحتاجون متابعة من الفرع</small>
            </article>
          </section>

          <StudentsTableSection
            students={students}
            filteredStudents={filteredStudents}
            visibleStudents={visibleStudents}
            dataMode={dataMode}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            pausedCount={pausedCount}
            query={query}
            setQuery={setQuery}
            branchFilter={branchFilter}
            setBranchFilter={setBranchFilter}
            branchOptions={branchOptions}
            setPage={setPage}
            page={page}
            pageCount={pageCount}
            pageSize={PAGE_SIZE}
            setDetailsStudent={setDetailsStudent}
            clearFilters={clearFilters}
            statusLabels={statusLabels}
          />
          <div className="students-demo-note">
            <FileText size={14} />
            <span>
              {dataMode === "live"
                ? "الطلاب المعروضون من قاعدة البيانات. بيانات ولي الأمر والكورس التفصيلي ستضاف مع عقود التسجيل والأسرة القادمة."
                : "بيانات الطلاب المعروضة تجريبية ومبنية على حقول الـSchema؛ لا يتم حفظها في قاعدة بيانات."}
            </span>
          </div>
          <footer className="workspace-footer">
            <span>© مدى 2026</span>
            <span>
              {dataMode === "live"
                ? "واجهة تشغيلية — بيانات الخادم"
                : "واجهة تجريبية — إصدار 0.1"}
            </span>
          </footer>
        </div>
      </main>

      {addOpen && (
        <AddStudentDialog
          studentName={studentName}
          birthDate={birthDate}
          gender={gender}
          parentName={parentName}
          parentPhone={parentPhone}
          source={source}
          newBranch={newBranch}
          branches={branches}
          sourceLabels={sourceLabels}
          setStudentName={setStudentName}
          setBirthDate={setBirthDate}
          setGender={setGender}
          setParentName={setParentName}
          setParentPhone={setParentPhone}
          setSource={setSource}
          setNewBranch={setNewBranch}
          onClose={() => {
            setAddOpen(false);
            resetForm();
          }}
          onSubmit={submitStudent}
        />
      )}

      {detailsStudent && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setDetailsStudent(null);
          }}
        >
          <section
            className="student-dialog student-details-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-detail-name"
          >
            <div className="dialog-top">
              <span className="dialog-mark">
                <Users size={20} />
              </span>
              <button
                className="icon-button"
                aria-label="إغلاق"
                onClick={() => setDetailsStudent(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="detail-profile">
              <span className={`student-avatar avatar-${detailsStudent.color}`}>
                {detailsStudent.initials}
              </span>
              <div>
                <h2 id="student-detail-name">{detailsStudent.name}</h2>
                <span>
                  <span
                    className={`student-status status-${detailsStudent.status}`}
                  >
                    <i />
                    {statusLabels[detailsStudent.status]}
                  </span>
                </span>
              </div>
            </div>
            <div className="detail-grid">
              <div>
                <small>الكورس الحالي</small>
                <strong>
                  <BookOpen size={14} />
                  {detailsStudent.course}
                </strong>
              </div>
              <div>
                <small>الفرع</small>
                <strong>
                  <MapPin size={14} />
                  {detailsStudent.branch}
                </strong>
              </div>
              <div>
                <small>ولي الأمر</small>
                <strong>
                  {detailsStudent.parentName} ({detailsStudent.relation})
                </strong>
              </div>
              <div>
                <small>هاتف ولي الأمر</small>
                <strong dir="ltr">{detailsStudent.parentPhone}</strong>
              </div>
              <div>
                <small>تاريخ الميلاد</small>
                <strong dir="ltr">{detailsStudent.birthDate}</strong>
              </div>
              <div>
                <small>مصدر التسجيل</small>
                <strong>{sourceLabels[detailsStudent.source]}</strong>
              </div>
            </div>
            {dataMode === "live" && (
              <section className="student-link-panel">
                <div className="student-journey-heading">
                  <div>
                    <strong>حسابات الطالب والأسرة</strong>
                    <span>إدارة الوصول إلى بوابتي الطالب وولي الأمر</span>
                  </div>
                </div>
                <div className="dialog-info">
                  <ShieldCheck size={15} />
                  <span>
                    نسخة MVP بلا تكلفة SMS: في Development يظهر رمز عشوائي
                    للاختبار فقط؛ لا يُقبل رمز ثابت في الإنتاج، ويظل الإرسال
                    الحي مغلقًا حتى إعداد مزود رسائل.
                  </span>
                </div>
                {linksLoading && (
                  <div className="dialog-info">جارٍ تحميل الروابط الحالية…</div>
                )}
                {linksError && (
                  <div className="dialog-info" role="alert">
                    تعذر قراءة الروابط: {linksError}
                  </div>
                )}
                {consumerLinks && (
                  <div className="detail-grid">
                    <div>
                      <small>حساب الطالب</small>
                      <strong>
                        {consumerLinks.studentAccount
                          ? `${consumerLinks.studentAccount.name ?? "حساب الطالب"} · ${consumerLinks.studentAccount.phone}`
                          : "غير مرتبط"}
                      </strong>
                      {consumerLinks.studentAccount && (
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() =>
                            void unlinkConsumerAccount(
                              "student",
                              consumerLinks.studentAccount!.id
                            )
                          }
                        >
                          إلغاء الربط
                        </button>
                      )}
                    </div>
                    <div>
                      <small>أولياء الأمور</small>
                      {consumerLinks.guardians.length ? (
                        consumerLinks.guardians.map(guardian => (
                          <div key={guardian.id}>
                            <strong>
                              {guardian.name ?? guardian.phone} ·{" "}
                              {guardian.relationship}
                            </strong>
                            <button
                              type="button"
                              className="button button-secondary"
                              onClick={() =>
                                void unlinkConsumerAccount(
                                  "guardian",
                                  guardian.id
                                )
                              }
                            >
                              إلغاء الربط
                            </button>
                          </div>
                        ))
                      ) : (
                        <strong>لا يوجد حساب ولي أمر مرتبط</strong>
                      )}
                    </div>
                  </div>
                )}
                <form onSubmit={searchConsumerAccounts}>
                  <div className="form-row">
                    <label className="form-field">
                      <span>نوع الربط</span>
                      <select
                        value={linkKind}
                        disabled={lookupLoading || invitationLoading}
                        onChange={event => {
                          setLinkKind(
                            event.target.value as "guardian" | "student"
                          );
                          setLookupResults(null);
                          setLookupError(null);
                          setInvitationResult(null);
                        }}
                      >
                        <option value="guardian">حساب ولي أمر</option>
                        <option value="student">حساب الطالب نفسه</option>
                      </select>
                    </label>
                    <label className="form-field">
                      <span>رقم الهاتف</span>
                      <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={linkPhone}
                        disabled={lookupLoading || invitationLoading}
                        onChange={event => {
                          setLinkPhone(event.target.value);
                          setLookupResults(null);
                          setLookupError(null);
                          setInvitationResult(null);
                        }}
                        placeholder="01012345678 أو +201012345678"
                        dir="ltr"
                        required
                      />
                    </label>
                  </div>
                  {linkKind === "guardian" && (
                    <label className="form-field">
                      <span>صلة القرابة</span>
                      <select
                        value={linkRelationship}
                        onChange={event =>
                          setLinkRelationship(event.target.value)
                        }
                      >
                        <option>ولي أمر</option>
                        <option>الأب</option>
                        <option>الأم</option>
                        <option>وصي</option>
                      </select>
                    </label>
                  )}
                  <div className="dialog-info">
                    <FileText size={15} />
                    <span>
                      بحث دقيق داخل الحسابات النشطة من نفس الأكاديمية فقط. تظهر
                      بيانات محدودة، ولا يتم كشف UUID أو بيانات حسابات أكاديميات
                      أخرى.
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={lookupLoading || !linkPhone.trim()}
                  >
                    <Search size={15} />{" "}
                    {lookupLoading ? "جارٍ البحث…" : "بحث عن الحساب"}
                  </button>
                </form>
                {lookupError && (
                  <div className="dialog-info" role="alert">
                    تعذر البحث أو إرسال الدعوة: {lookupError}
                  </div>
                )}
                {lookupResults !== null &&
                  (lookupResults.length ? (
                    <div className="student-link-results" aria-live="polite">
                      {lookupResults.map(account => (
                        <article key={account.id}>
                          <div>
                            <strong>
                              {account.name ||
                                (account.accountType === "parent"
                                  ? "حساب ولي أمر"
                                  : "حساب طالب")}
                            </strong>
                            <span dir="ltr">{account.maskedPhone}</span>
                          </div>
                          <button
                            type="button"
                            className="button button-secondary"
                            disabled={linkingAccountId !== null || linksLoading}
                            onClick={() => void linkConsumerAccount(account)}
                          >
                            <UserPlus size={15} />{" "}
                            {linkingAccountId === account.id
                              ? "جارٍ الربط…"
                              : account.accountType === "parent"
                                ? "ربط بولي الأمر"
                                : "ربط بحساب الطالب"}
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="dialog-info" role="status">
                      <span>
                        لم يوجد حساب نشط مؤهل بهذا الرقم داخل الأكاديمية.
                      </span>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => void inviteConsumerAccount()}
                        disabled={invitationLoading || !linkPhone.trim()}
                      >
                        <Send size={15} />{" "}
                        {invitationLoading
                          ? "جارٍ تجهيز الدعوة…"
                          : "إرسال دعوة تفعيل OTP"}
                      </button>
                    </div>
                  ))}
                {invitationResult && (
                  <div className="dialog-info" role="status">
                    <span>
                      حالة الدعوة:{" "}
                      {invitationResult.delivery === "development://sms"
                        ? "اختبار محلي فقط — لا توجد رسالة SMS فعلية"
                        : "تم إرسال الرسالة"}
                      {invitationResult.developmentCode && (
                        <>
                          {" "}
                          · رمز الاختبار:{" "}
                          <b dir="ltr">{invitationResult.developmentCode}</b>
                        </>
                      )}
                      {invitationResult.debugAcceptUrl && (
                        <>
                          {" "}
                          ·{" "}
                          <a href={invitationResult.debugAcceptUrl}>
                            فتح صفحة قبول الدعوة التجريبية
                          </a>
                        </>
                      )}
                    </span>
                  </div>
                )}
              </section>
            )}
            {dataMode !== "live" &&
              (() => {
                const journey = getStudentJourney(detailsStudent);
                return (
                  <>
                    <div className="student-journey-heading">
                      <div>
                        <strong>رحلة الطالب</strong>
                        <span>ملخص تشغيلي سريع مبني على بيانات العرض</span>
                      </div>
                      <span className="journey-progress-label">
                        {journey.progress}% مكتمل
                      </span>
                    </div>
                    <div
                      className="student-journey-progress"
                      aria-label={`نسبة تقدم الطالب ${journey.progress}%`}
                    >
                      <span style={{ width: `${journey.progress}%` }} />
                    </div>
                    <div className="student-journey-grid">
                      <article>
                        <span className="journey-icon journey-icon-teal">
                          <CheckCircle2 size={15} />
                        </span>
                        <div>
                          <small>انتظام الحضور</small>
                          <strong>{journey.attendance}</strong>
                          <span>{journey.attendanceNote}</span>
                        </div>
                      </article>
                      <article>
                        <span className="journey-icon journey-icon-blue">
                          <CalendarDays size={15} />
                        </span>
                        <div>
                          <small>الجلسة القادمة</small>
                          <strong>{journey.nextSession}</strong>
                          <span>{journey.nextSessionNote}</span>
                        </div>
                      </article>
                      <article>
                        <span className="journey-icon journey-icon-amber">
                          <Wallet size={15} />
                        </span>
                        <div>
                          <small>حالة التحصيل</small>
                          <strong>{journey.payment}</strong>
                          <span>{journey.paymentNote}</span>
                        </div>
                      </article>
                    </div>
                    <div className="student-journey-actions">
                      <button
                        className="button button-secondary"
                        onClick={() => setLocation("/schedule")}
                      >
                        <CalendarDays size={15} /> عرض الجدول
                      </button>
                      <button
                        className="button button-secondary"
                        onClick={() => setLocation("/finance")}
                      >
                        <Wallet size={15} /> فتح التحصيل
                      </button>
                    </div>
                  </>
                );
              })()}
            <div className="dialog-info">
              <FileText size={15} />
              <span>
                {dataMode === "live"
                  ? "البيانات الأساسية من قاعدة البيانات؛ معلومات الحضور والفواتير غير متاحة في عقد هذا الملف."
                  : "تفاصيل توضيحية للعرض، غير مرتبطة بملف طالب حقيقي."}
              </span>
            </div>
            <div className="dialog-actions">
              <button
                className="button button-secondary"
                onClick={() => setDetailsStudent(null)}
              >
                إغلاق
              </button>
              <button
                className="button button-primary"
                onClick={() => toast("تعديل بيانات الطالب قيد التجهيز")}
              >
                <FileText size={15} /> تعديل البيانات
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default StudentPage;
