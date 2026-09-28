import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpLeft,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Clock3,
  FileText,
  Filter,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Users,
  UserRoundPlus,
  UserRoundSearch,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import { EmptyState, ErrorState, LockedState } from "@/components/FeedbackStates";

type SecretaryView = "overview" | "leads" | "registrations" | "operations";
type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "trial"
  | "enrolled"
  | "cold"
  | "lost";
type LeadSource =
  | "landing_page"
  | "referral"
  | "social_media"
  | "event"
  | "whatsapp"
  | "calls"
  | "ads";
type StudentSource =
  | "walk_in"
  | "landing_page"
  | "referral"
  | "social_media"
  | "event";
type Lead = {
  id: string;
  branch: string;
  childName: string;
  parentPhone: string;
  childAge: number | null;
  interestedCourseId: string | null;
  status: LeadStatus;
  source: LeadSource;
  assignedTo: string;
  notes: string;
  createdAt: string;
  activities?: LeadActivity[];
  convertedStudentId?: string;
};
type LeadActivity = {
  id: string;
  kind: "call" | "follow_up";
  date: string;
  scheduledFor?: string;
  note: string;
  outcome: string;
};
type Course = {
  id: string;
  name: string;
  ageGroup: string;
  level: string;
  basePricePiastres: number;
};
type Offering = {
  id: string;
  courseId: string;
  courseName: string;
  instructor: string;
  branch: string;
  classroom: string;
  startDate: string;
  schedule: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  maxStudents: number;
  enrolledStudents: number;
};
type Registration = {
  id: string;
  studentId: string;
  fullName: string;
  dateOfBirth: string;
  gender: "male" | "female";
  parentName: string;
  parentPhone: string;
  relation: "father" | "mother" | "guardian";
  source: StudentSource;
  offeringId: string;
  courseId: string;
  courseName: string;
  finalPricePiastres: number;
  discountCode?: string;
  discountLabel?: string;
  status: "active" | "completed" | "dropped" | "transferred";
  enrolledAt: string;
  convertedFromLeadId?: string;
};
type LeadDraft = {
  childName: string;
  parentPhone: string;
  childAge: string;
  interestedCourseId: string;
  source: LeadSource;
  notes: string;
};
type RegistrationDraft = {
  fullName: string;
  dateOfBirth: string;
  gender: "male" | "female";
  parentName: string;
  parentPhone: string;
  relation: "father" | "mother" | "guardian";
  source: StudentSource | "";
  offeringId: string;
  discountCode: string;
};

const BRANCH = "مدينة نصر";
const SECRETARY = "هبة محمود";
const WORKSPACE_VIEWS = [
  "overview",
  "leads",
  "registrations",
  "operations",
] as const;
const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  interested: "مهتم",
  trial: "حصة تجريبية",
  enrolled: "مسجل",
  cold: "متابعة لاحقًا",
  lost: "غير مهتم",
};
const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "interested",
  "trial",
  "enrolled",
  "cold",
  "lost",
];
const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: "new",
  contacted: "contacted",
  interested: "interested",
  trial: "trial",
  enrolled: "enrolled",
  cold: "cold",
  lost: "lost",
};
const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  landing_page: "صفحة الأكاديمية",
  referral: "ترشيح",
  social_media: "سوشيال ميديا",
  event: "فعالية",
  whatsapp: "واتساب",
  calls: "مكالمة واردة",
  ads: "إعلان مدفوع",
};
const STUDENT_SOURCE_LABELS: Record<StudentSource, string> = {
  walk_in: "زيارة مباشرة",
  landing_page: "صفحة الأكاديمية",
  referral: "ترشيح",
  social_media: "سوشيال ميديا",
  event: "فعالية",
};
const COURSE_CATALOG: Course[] = [
  {
    id: "CRS-018",
    name: "روبوتكس مستوى 2",
    ageGroup: "10–12 سنة",
    level: "متوسط",
    basePricePiastres: 360000,
  },
  {
    id: "CRS-017",
    name: "برمجة للمبتدئين",
    ageGroup: "7–9 سنوات",
    level: "تمهيدي",
    basePricePiastres: 280000,
  },
  {
    id: "CRS-016",
    name: "دوائر إلكترونية",
    ageGroup: "13–15 سنة",
    level: "متقدم",
    basePricePiastres: 420000,
  },
  {
    id: "CRS-014",
    name: "مهارات التفكير الإبداعي",
    ageGroup: "7–9 سنوات",
    level: "متوسط",
    basePricePiastres: 180000,
  },
];
const INITIAL_OFFERINGS: Offering[] = [
  {
    id: "GRP-042",
    courseId: "CRS-018",
    courseName: "روبوتكس مستوى 2",
    instructor: "مريم حسن",
    branch: BRANCH,
    classroom: "معمل 1",
    startDate: "2026-09-05",
    schedule: "السبت والثلاثاء · 10:00 ص",
    status: "ongoing",
    maxStudents: 16,
    enrolledStudents: 12,
  },
  {
    id: "GRP-041",
    courseId: "CRS-017",
    courseName: "برمجة للمبتدئين",
    instructor: "عمر سامح",
    branch: BRANCH,
    classroom: "معمل 2",
    startDate: "2026-09-12",
    schedule: "الأحد والأربعاء · 12:00 م",
    status: "upcoming",
    maxStudents: 12,
    enrolledStudents: 8,
  },
];
const INITIAL_LEADS: Lead[] = [
  {
    id: "LD-1068",
    branch: BRANCH,
    childName: "سليم أحمد فوزي",
    parentPhone: "01012345068",
    childAge: 8,
    interestedCourseId: "CRS-017",
    status: "new",
    source: "landing_page",
    assignedTo: SECRETARY,
    notes: "طلب معرفة مواعيد البرمجة للمبتدئين.",
    createdAt: "2026-09-26T10:05:00",
  },
  {
    id: "LD-1067",
    branch: BRANCH,
    childName: "مريم ياسر علي",
    parentPhone: "01123451067",
    childAge: 11,
    interestedCourseId: "CRS-018",
    status: "contacted",
    source: "referral",
    assignedTo: SECRETARY,
    notes: "تم إرسال تفاصيل المجموعة؛ ولي الأمر يفضّل مكالمة بعد ٤ م.",
    createdAt: "2026-09-26T09:30:00",
  },
  {
    id: "LD-1066",
    branch: BRANCH,
    childName: "زياد عمرو منصور",
    parentPhone: "01234561066",
    childAge: 14,
    interestedCourseId: "CRS-016",
    status: "trial",
    source: "event",
    assignedTo: SECRETARY,
    notes: "حضر اليوم التعريفي؛ تم اقتراح مجموعة الإلكترونيات.",
    createdAt: "2026-09-25T15:40:00",
  },
  {
    id: "LD-1065",
    branch: BRANCH,
    childName: "نور خالد سعيد",
    parentPhone: "01098765065",
    childAge: 9,
    interestedCourseId: "CRS-014",
    status: "interested",
    source: "whatsapp",
    assignedTo: SECRETARY,
    notes: "مهتمة بأنشطة التفكير والتعاون؛ انتظار تأكيد الموعد.",
    createdAt: "2026-09-25T12:15:00",
  },
  {
    id: "LD-1064",
    branch: BRANCH,
    childName: "آدم شريف حسن",
    parentPhone: "01109876543",
    childAge: 14,
    interestedCourseId: "CRS-016",
    status: "enrolled",
    source: "event",
    assignedTo: SECRETARY,
    notes: "أُنشئ تسجيل توضيحي للمجموعة.",
    createdAt: "2026-09-24T11:00:00",
    convertedStudentId: "ST-1064",
  },
  {
    id: "LD-1063",
    branch: BRANCH,
    childName: "جنى طارق سعيد",
    parentPhone: "01210987654",
    childAge: 10,
    interestedCourseId: "CRS-018",
    status: "cold",
    source: "social_media",
    assignedTo: SECRETARY,
    notes: "تأجيل القرار إلى الشهر القادم بناءً على رغبة ولي الأمر.",
    createdAt: "2026-09-23T14:20:00",
  },
  {
    id: "LD-1062",
    branch: BRANCH,
    childName: "فارس محمود عادل",
    parentPhone: "01087654062",
    childAge: 8,
    interestedCourseId: "CRS-017",
    status: "lost",
    source: "ads",
    assignedTo: SECRETARY,
    notes: "اعتذر ولي الأمر عن استكمال الاستفسار.",
    createdAt: "2026-09-21T09:10:00",
  },
  {
    id: "LD-1061",
    branch: BRANCH,
    childName: "مالك حسام الدين",
    parentPhone: "01187654061",
    childAge: 11,
    interestedCourseId: "CRS-018",
    status: "trial",
    source: "calls",
    assignedTo: SECRETARY,
    notes: "تم حجز زيارة تعريفية، مع انتظار تأكيد الأسرة.",
    createdAt: "2026-09-20T16:50:00",
  },
];
const INITIAL_REGISTRATIONS: Registration[] = [
  {
    id: "ENR-0582",
    studentId: "ST-1064",
    fullName: "آدم شريف حسن",
    dateOfBirth: "2012-01-30",
    gender: "male",
    parentName: "شريف حسن",
    parentPhone: "01109876543",
    relation: "father",
    source: "event",
    offeringId: "GRP-042",
    courseId: "CRS-018",
    courseName: "روبوتكس مستوى 2",
    finalPricePiastres: 360000,
    status: "active",
    enrolledAt: "2026-09-24T12:00:00",
    convertedFromLeadId: "LD-1064",
  },
  {
    id: "ENR-0579",
    studentId: "ST-1059",
    fullName: "بسملة أحمد حمدي",
    dateOfBirth: "2017-03-06",
    gender: "female",
    parentName: "أحمد حمدي",
    parentPhone: "01076543059",
    relation: "father",
    source: "referral",
    offeringId: "GRP-041",
    courseId: "CRS-017",
    courseName: "برمجة للمبتدئين",
    finalPricePiastres: 280000,
    status: "active",
    enrolledAt: "2026-09-19T11:00:00",
  },
];

const formatMoney = (piastres: number) =>
  new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(piastres / 100);
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
const studentSourceFromLead = (source: LeadSource): StudentSource | "" => {
  if (
    source === "landing_page" ||
    source === "referral" ||
    source === "social_media" ||
    source === "event"
  ) {
    return source;
  }
  // Student.source is narrower than Lead.source; require a deliberate choice
  // for ads, calls, and WhatsApp rather than silently translating the source.
  return "";
};
const createLeadDraft = (): LeadDraft => ({
  childName: "",
  parentPhone: "",
  childAge: "",
  interestedCourseId: "",
  source: "landing_page",
  notes: "",
});
const createRegistrationDraft = (
  lead?: Lead,
  offeringId = "GRP-041"
): RegistrationDraft => ({
  fullName: lead?.childName ?? "",
  dateOfBirth: "",
  gender: "male",
  parentName: "",
  parentPhone: lead?.parentPhone ?? "",
  relation: "father",
  source: lead ? studentSourceFromLead(lead.source) : "walk_in",
  offeringId,
  discountCode: "",
});
const FIXED_DISCOUNT_CODES = [
  { code: "SIBLINGS15", label: "خصم إخوة ثابت", percent: 15 },
  { code: "CAMPAIGN10", label: "خصم حملة معتمدة", percent: 10 },
] as const;

function SecretaryBrand() {
  return (
    <div className="secretary-brand" aria-label="مدى">
      <span className="secretary-brand-mark" aria-hidden="true">
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
      <span>مدى</span>
      <small>مساحة السكرتارية</small>
    </div>
  );
}

export default function Secretary() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<SecretaryView>(() => {
    const requested = new URLSearchParams(window.location.search).get("view");
    return WORKSPACE_VIEWS.includes(requested as SecretaryView)
      ? (requested as SecretaryView)
      : "overview";
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [registrations, setRegistrations] = useState(INITIAL_REGISTRATIONS);
  const [offerings, setOfferings] = useState(INITIAL_OFFERINGS);
  const [selectedLeadId, setSelectedLeadId] = useState(INITIAL_LEADS[0].id);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "all">("all");
  const [dialog, setDialog] = useState<"lead" | "registration" | null>(null);
  const [leadDraft, setLeadDraft] = useState<LeadDraft>(createLeadDraft);
  const [registrationDraft, setRegistrationDraft] = useState<RegistrationDraft>(
    createRegistrationDraft
  );
  const [registrationLeadId, setRegistrationLeadId] = useState<string | null>(
    null
  );
  const [studentSearch, setStudentSearch] = useState("");
  const [activityKind, setActivityKind] =
    useState<LeadActivity["kind"]>("call");
  const [activityNote, setActivityNote] = useState("");
  const [activityDate, setActivityDate] = useState("2026-09-27");
  const [activityOpen, setActivityOpen] = useState(false);

  const selectedLead =
    leads.find(lead => lead.id === selectedLeadId) ?? leads[0];
  const selectedLeadCourse = COURSE_CATALOG.find(
    course => course.id === selectedLead?.interestedCourseId
  );
  const availableOfferings = offerings.filter(
    offering =>
      offering.branch === BRANCH &&
      (offering.status === "upcoming" || offering.status === "ongoing") &&
      offering.enrolledStudents < offering.maxStudents
  );
  const chosenOffering = offerings.find(
    offering => offering.id === registrationDraft.offeringId
  );
  const chosenCourse = COURSE_CATALOG.find(
    course => course.id === chosenOffering?.courseId
  );
  const activeDiscount = FIXED_DISCOUNT_CODES.find(
    item => item.code === registrationDraft.discountCode.trim().toUpperCase()
  );
  const registrationPricePiastres = chosenCourse
    ? Math.round(
        chosenCourse.basePricePiastres *
          (1 - (activeDiscount?.percent ?? 0) / 100)
      )
    : 0;
  const activeLeadCount = leads.filter(lead =>
    ["new", "contacted", "interested"].includes(lead.status)
  ).length;
  const newLeadCount = leads.filter(lead => lead.status === "new").length;
  const trialCount = leads.filter(lead => lead.status === "trial").length;
  const enrolledLeadCount = leads.filter(
    lead => lead.status === "enrolled"
  ).length;
  const newTodayCount = leads.filter(lead =>
    lead.createdAt.startsWith("2026-09-26")
  ).length;
  const pipelineCounts = LEAD_STATUSES.map(status => ({
    status,
    count: leads.filter(lead => lead.status === status).length,
  }));
  const filteredLeads = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ar");
    return leads
      .filter(lead => {
        const course = COURSE_CATALOG.find(
          item => item.id === lead.interestedCourseId
        );
        const matchesSearch =
          !needle ||
          [lead.childName, lead.parentPhone, lead.id, course?.name ?? ""].some(
            value => value.toLocaleLowerCase("ar").includes(needle)
          );
        return (
          matchesSearch &&
          (statusFilter === "all" || lead.status === statusFilter) &&
          (sourceFilter === "all" || lead.source === sourceFilter)
        );
      })
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  }, [leads, query, sourceFilter, statusFilter]);
  const filteredRegistrations = useMemo(() => {
    const needle = studentSearch.trim().toLocaleLowerCase("ar");
    return registrations.filter(
      item =>
        !needle ||
        [item.fullName, item.parentName, item.parentPhone, item.id].some(
          value => value.toLocaleLowerCase("ar").includes(needle)
        )
    );
  }, [registrations, studentSearch]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (view === "overview") url.searchParams.delete("view");
    else url.searchParams.set("view", view);
    window.history.replaceState({}, "", url);
  }, [view]);

  const changeLeadStatus = (leadId: string, status: LeadStatus) => {
    setLeads(current =>
      current.map(lead => (lead.id === leadId ? { ...lead, status } : lead))
    );
  };

  const addLead = (event: FormEvent) => {
    event.preventDefault();
    if (
      !leadDraft.childName.trim() ||
      !/^01\d{9}$/.test(leadDraft.parentPhone.trim())
    ) {
      toast.error("راجع اسم الطفل ورقم ولي الأمر المكوّن من ١١ رقمًا");
      return;
    }
    const id = `LD-${1070 + leads.length - INITIAL_LEADS.length}`;
    const newLead: Lead = {
      id,
      branch: BRANCH,
      childName: leadDraft.childName.trim(),
      parentPhone: leadDraft.parentPhone.trim(),
      childAge: leadDraft.childAge ? Number(leadDraft.childAge) : null,
      interestedCourseId: leadDraft.interestedCourseId || null,
      status: "new",
      source: leadDraft.source,
      assignedTo: SECRETARY,
      notes: leadDraft.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    setLeads(current => [newLead, ...current]);
    setSelectedLeadId(id);
    setLeadDraft(createLeadDraft());
    setDialog(null);
    setView("leads");
    toast.success("تمت إضافة الاستفسار إلى قائمة المتابعة المحلية", {
      description: "لم يتم إرسال بيانات إلى النظام أو التواصل مع الأسرة.",
    });
  };

  const openRegistration = (lead?: Lead, offeringId?: string) => {
    const offeringMatch = lead?.interestedCourseId
      ? availableOfferings.find(
          item => item.courseId === lead.interestedCourseId
        )
      : undefined;
    const defaultOffering =
      offerings.find(item => item.id === offeringId) ??
      offeringMatch ??
      availableOfferings[0];
    setRegistrationLeadId(lead?.id ?? null);
    setRegistrationDraft(
      createRegistrationDraft(lead, defaultOffering?.id ?? "")
    );
    setView("registrations");
    setDialog("registration");
  };

  const submitRegistration = (event: FormEvent) => {
    event.preventDefault();
    const offering = offerings.find(
      item => item.id === registrationDraft.offeringId
    );
    if (
      !registrationDraft.fullName.trim() ||
      !registrationDraft.dateOfBirth ||
      !registrationDraft.parentName.trim() ||
      !/^01\d{9}$/.test(registrationDraft.parentPhone.trim()) ||
      !registrationDraft.source ||
      !offering ||
      offering.enrolledStudents >= offering.maxStudents
    ) {
      toast.error("أكمل البيانات المطلوبة واختر مجموعة متاحة في الفرع");
      return;
    }
    const course = COURSE_CATALOG.find(item => item.id === offering.courseId);
    if (!course) {
      toast.error("الكورس غير موجود في قائمة المعاينة");
      return;
    }
    const studentId = `ST-${1100 + registrations.length}`;
    const normalizedDiscountCode = registrationDraft.discountCode
      .trim()
      .toUpperCase();
    const discount = FIXED_DISCOUNT_CODES.find(
      item => item.code === normalizedDiscountCode
    );
    if (normalizedDiscountCode && !discount) {
      toast.error("كود الخصم غير معتمد", {
        description:
          "استخدم كودًا ثابتًا من قائمة السكرتارية أو ارفع طلب خصم استثنائي.",
      });
      return;
    }
    const registration: Registration = {
      id: `ENR-${590 + registrations.length}`,
      studentId,
      fullName: registrationDraft.fullName.trim(),
      dateOfBirth: registrationDraft.dateOfBirth,
      gender: registrationDraft.gender,
      parentName: registrationDraft.parentName.trim(),
      parentPhone: registrationDraft.parentPhone.trim(),
      relation: registrationDraft.relation,
      source: registrationDraft.source,
      offeringId: offering.id,
      courseId: course.id,
      courseName: course.name,
      finalPricePiastres: Math.round(
        course.basePricePiastres * (1 - (discount?.percent ?? 0) / 100)
      ),
      ...(discount
        ? { discountCode: discount.code, discountLabel: discount.label }
        : {}),
      status: "active",
      enrolledAt: new Date().toISOString(),
      ...(registrationLeadId
        ? { convertedFromLeadId: registrationLeadId }
        : {}),
    };
    setRegistrations(current => [registration, ...current]);
    setOfferings(current =>
      current.map(item =>
        item.id === offering.id
          ? { ...item, enrolledStudents: item.enrolledStudents + 1 }
          : item
      )
    );
    if (registrationLeadId) {
      changeLeadStatus(registrationLeadId, "enrolled");
      setLeads(current =>
        current.map(lead =>
          lead.id === registrationLeadId
            ? { ...lead, convertedStudentId: studentId }
            : lead
        )
      );
    }
    setDialog(null);
    setRegistrationLeadId(null);
    setRegistrationDraft(createRegistrationDraft());
    toast.success("اكتمل التسجيل في المعاينة المحلية", {
      description: `${registration.fullName} · ${course.name}${discount ? ` · ${discount.label} (${discount.percent}%)` : ""} · دون إنشاء حساب دخول أو فاتورة فعلية.`,
    });
  };

  const saveLeadNote = (leadId: string, note: string) => {
    const trimmed = note.trim();
    if (!trimmed) return;
    setLeads(current =>
      current.map(lead =>
        lead.id === leadId
          ? {
              ...lead,
              notes: lead.notes
                ? `${lead.notes}\n${new Date().toLocaleDateString("ar-EG")}: ${trimmed}`
                : trimmed,
            }
          : lead
      )
    );
    toast.success("أُضيفت الملاحظة لقائمة المتابعة المحلية");
  };

  const saveLeadActivity = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedLead || !activityNote.trim()) {
      toast.error("أضف ملخصًا قصيرًا للنشاط قبل الحفظ");
      return;
    }
    const activity: LeadActivity = {
      id: `ACT-${Date.now()}`,
      kind: activityKind,
      date: new Date().toISOString(),
      scheduledFor: activityKind === "follow_up" ? activityDate : undefined,
      note: activityNote.trim(),
      outcome:
        activityKind === "call" ? "تم تسجيل المكالمة" : "موعد متابعة مجدول",
    };
    setLeads(current =>
      current.map(lead =>
        lead.id === selectedLead.id
          ? { ...lead, activities: [activity, ...(lead.activities ?? [])] }
          : lead
      )
    );
    if (activityKind === "call" && selectedLead.status === "new") {
      changeLeadStatus(selectedLead.id, "contacted");
    }
    setActivityNote("");
    setActivityOpen(false);
    toast.success(
      activityKind === "call"
        ? "تم تسجيل المكالمة محليًا"
        : "تم جدولة موعد المتابعة محليًا",
      { description: "النشاط توضيحي ولا يرسل رسالة أو ينشئ تذكيرًا فعليًا." }
    );
  };

  const logContactAttempt = (lead: Lead) => {
    if (lead.status === "new") changeLeadStatus(lead.id, "contacted");
    setLeads(current =>
      current.map(item =>
        item.id === lead.id
          ? {
              ...item,
              notes: `${item.notes}${item.notes ? "\n" : ""}${new Date().toLocaleDateString("ar-EG")}: تم تسجيل محاولة تواصل محلية.`,
            }
          : item
      )
    );
    toast.success("سُجلت محاولة التواصل محليًا", {
      description: "هذا الإجراء لا يجري مكالمة ولا يرسل رسالة.",
    });
  };

  const copyFollowUpMessage = async (lead: Lead) => {
    const message = `مرحبًا، نتابع معكم استفسار ${lead.childName} عن ${COURSE_CATALOG.find(item => item.id === lead.interestedCourseId)?.name ?? "برامج الأكاديمية"} في فرع مدينة نصر. يسعدنا مساعدتكم في اختيار المجموعة المناسبة.`;
    try {
      await navigator.clipboard.writeText(message);
      toast.success("نُسخت رسالة المتابعة", {
        description: "أُنسخت فقط؛ لم يتم إرسالها إلى ولي الأمر.",
      });
    } catch {
      toast.error("تعذر النسخ من المتصفح", {
        description: "يمكنك تدوين ملاحظة المتابعة أو نسخ الرقم يدويًا.",
      });
    }
  };

  const setLeadView = (next: SecretaryView) => {
    setView(next);
    setMobileNavOpen(false);
  };

  const navItems = [
    { id: "overview" as const, label: "ملخص اليوم", icon: LayoutDashboard },
    {
      id: "leads" as const,
      label: "الاستفسارات والمتابعة",
      icon: UserRoundSearch,
    },
    {
      id: "registrations" as const,
      label: "التسجيلات والطلاب",
      icon: GraduationCap,
    },
  ];

  return (
    <RoleDashboardShell
      className="secretary-shell"
      roleCode="R05"
      roleLabel="السكرتارية"
      scopeLevel="branch"
      scopeLabel={`فرع ${BRANCH}`}
      branchName={BRANCH}
    >
      <div
        className={`secretary-mobile-backdrop ${mobileNavOpen ? "is-open" : ""}`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
      />
      <aside className={`secretary-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
        <SecretaryBrand />
        <div className="secretary-role-badge">
          <span className="secretary-avatar">هـ</span>
          <span>
            <strong>{SECRETARY}</strong>
            <small>سكرتارية · فرع {BRANCH}</small>
          </span>
          <ChevronDown size={14} />
        </div>
        <div className="secretary-nav-label">مساحة عملي</div>
        <nav className="secretary-nav" aria-label="قائمة السكرتارية">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={view === item.id ? "active" : ""}
                aria-current={view === item.id ? "page" : undefined}
                onClick={() => setLeadView(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.id === "leads" && activeLeadCount > 0 && (
                  <b className="secretary-nav-count">{activeLeadCount}</b>
                )}
              </button>
            );
          })}
          <button
            className={view === "operations" ? "active" : ""}
            aria-current={view === "operations" ? "page" : undefined}
            onClick={() => setLeadView("operations")}
          >
            <CalendarDays size={18} />
            <span>التقويم التشغيلي</span>
          </button>
          <button
            onClick={() =>
              toast("صلاحية منفصلة", {
                description: "التحصيل والفواتير من اختصاص المحاسب.",
              })
            }
          >
            <Wallet size={18} />
            <span>التحصيل والفواتير</span>
          </button>
        </nav>
        <div className="secretary-sidebar-spacer" />
        <button
          className="secretary-help"
          onClick={() =>
            toast("مركز المساعدة", {
              description: "أدلة التسجيل والتواصل قيد التجهيز.",
            })
          }
        >
          <span>
            <CircleHelp size={17} />
          </span>
          <span>
            <strong>محتاج مساعدة؟</strong>
            <small>إرشادات التسجيل والمتابعة</small>
          </span>
          <ChevronLeft size={14} />
        </button>
        <button className="secretary-back-admin" onClick={() => navigate("/")}>
          <ArrowLeft size={16} />
          <span>العودة للوحة الفرع</span>
        </button>
        <div className="secretary-scope-note">
          <CheckCircle2 size={15} />
          <span>
            <strong>نطاق صلاحيتك</strong>
            <small>فرع {BRANCH} · تسجيل ومتابعة فقط</small>
          </span>
        </div>
        <div className="secretary-sidebar-version">
          مدى لإدارة الأكاديميات <span>نسخة تجريبية</span>
        </div>
      </aside>

      <main className="secretary-main">
        <header className="secretary-topbar">
          <div className="secretary-topbar-start">
            <button
              className="secretary-icon-button secretary-mobile-menu"
              aria-label="فتح القائمة"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(value => !value)}
            >
              <Menu size={20} />
            </button>
            <span className="secretary-branch-pill">
              <MapPin size={15} /> فرع {BRANCH}
            </span>
            <div className="secretary-live-pill">
              <i /> خدمة العملاء والتسجيل
            </div>
          </div>
          <div className="secretary-topbar-end">
            <button
              className="secretary-icon-button"
              aria-label="الإشعارات"
              onClick={() => toast("لا توجد إشعارات جديدة")}
            >
              <Activity size={17} />
            </button>
            <span className="secretary-topbar-divider" />
            <button
              className="secretary-profile"
              onClick={() =>
                toast("إعدادات الحساب", {
                  description: "بيانات الحساب تجريبية محلية.",
                })
              }
            >
              <span>
                <strong>{SECRETARY}</strong>
                <small>سكرتارية</small>
              </span>
              <i>هـ</i>
              <ChevronDown size={13} />
            </button>
          </div>
        </header>

        <div className="secretary-content">
          <div className="secretary-breadcrumb">
            <button onClick={() => setLeadView("overview")}>
              مساحة السكرتارية
            </button>
            <ChevronLeft size={13} />
            <span>
              {navItems.find(item => item.id === view)?.label ?? "ملخص اليوم"}
            </span>
          </div>
          <section className="secretary-welcome">
            <div>
              <div className="secretary-eyebrow">
                <i /> مساحة السكرتارية · {SECRETARY} · {BRANCH}
              </div>
              <h1>
                {view === "overview"
                  ? "أهلًا هبة، نبدأ من هنا"
                  : view === "leads"
                    ? "الاستفسارات والمتابعة"
                    : view === "registrations"
                      ? "التسجيلات والطلاب"
                      : "التقويم التشغيلي"}
              </h1>
              <p>
                {view === "overview"
                  ? "استقبلي الاهتمامات، تابعي الأسر، وأكملي التسجيلات من قائمة عمل واحدة."
                  : view === "leads"
                    ? "سجلي كل استفسار وخطوة متابعة داخل نطاق فرعك."
                    : view === "registrations"
                      ? "راجعي التسجيلات النشطة أو ابدئي تسجيلًا جديدًا في مجموعة متاحة."
                      : "راجعي مواعيد مجموعات الفرع والطاقة المتاحة قبل بدء أي تسجيل."}
              </p>
            </div>
            <div className="secretary-welcome-actions">
              <span className="secretary-date-pill">
                <CalendarDays size={16} /> السبت، ٢٦ سبتمبر ٢٠٢٦
              </span>
              {view !== "registrations" && (
                <button
                  className="secretary-primary-button"
                  onClick={() => {
                    setLeadDraft(createLeadDraft());
                    setDialog("lead");
                  }}
                >
                  <Plus size={16} /> تسجيل استفسار
                </button>
              )}
              {view === "registrations" && (
                <button
                  className="secretary-primary-button"
                  onClick={() => openRegistration()}
                >
                  <UserRoundPlus size={16} /> تسجيل طالب
                </button>
              )}
            </div>
          </section>
          <section className="secretary-demo-note" role="note">
            <AlertCircle size={15} />
            <span>
              بيانات توضيحية محلية لفرع «{BRANCH}». التسجيل والملاحظات لا تُحفظ
              في قاعدة البيانات ولا تُرسل رسائل أو OTP.
            </span>
            <b>DEMO</b>
          </section>
          <RoleScopeCard className="secretary-role-scope-card" compact />

          {view === "overview" && (
            <section
              className="secretary-permission-card"
              aria-label="نطاق صلاحيات السكرتارية"
            >
              <span className="secretary-permission-icon">
                <CheckCircle2 size={17} />
              </span>
              <div>
                <strong>مساحة عملك تركز على خدمة الأسرة والتسجيل</strong>
                <p>
                  يمكنك إدارة استفسارات فرعك، متابعة التحويلات، وربط الطلاب
                  بالمجموعات المتاحة.
                </p>
              </div>
              <div className="secretary-permission-tags">
                <span>
                  <Check size={12} /> المتابعة
                </span>
                <span>
                  <Check size={12} /> التسجيل
                </span>
                <LockedState
                  compact
                  title="التحصيل للإدارة المالية"
                  description="السكرتارية تستخدم السعر النهائي فقط ولا تسجل تحصيلًا."
                />
              </div>
            </section>
          )}

          {view === "overview" && (
            <>
              <section
                className="secretary-stats-grid"
                aria-label="ملخص الاستفسارات والتسجيلات"
              >
                <button
                  className="secretary-stat-card stat-teal"
                  onClick={() => setLeadView("leads")}
                >
                  <span className="secretary-stat-icon">
                    <UserRoundSearch size={18} />
                  </span>
                  <small>استفسارات تحتاج متابعة</small>
                  <strong>{activeLeadCount}</strong>
                  <span>{newLeadCount} جديدة · ضمن عمل الفرع</span>
                </button>
                <button
                  className="secretary-stat-card stat-blue"
                  onClick={() => setLeadView("leads")}
                >
                  <span className="secretary-stat-icon">
                    <MessageCircle size={18} />
                  </span>
                  <small>استفسارات وصلت اليوم</small>
                  <strong>{newTodayCount}</strong>
                  <span>من مصادر مختلفة</span>
                </button>
                <button
                  className="secretary-stat-card stat-amber"
                  onClick={() => {
                    setStatusFilter("trial");
                    setLeadView("leads");
                  }}
                >
                  <span className="secretary-stat-icon">
                    <CalendarDays size={18} />
                  </span>
                  <small>حصة تجريبية بانتظار المتابعة</small>
                  <strong>{trialCount}</strong>
                  <span>تأكيد الموعد مع الأسرة</span>
                </button>
                <button
                  className="secretary-stat-card stat-violet"
                  onClick={() => setLeadView("registrations")}
                >
                  <span className="secretary-stat-icon">
                    <GraduationCap size={18} />
                  </span>
                  <small>تسجيلات نشطة</small>
                  <strong>{registrations.length}</strong>
                  <span>{enrolledLeadCount} استفسارات تحولت لتسجيل</span>
                </button>
              </section>

              <div className="secretary-overview-grid">
                <section className="secretary-panel secretary-lead-panel">
                  <div className="secretary-panel-heading">
                    <div>
                      <span className="secretary-panel-kicker">
                        قائمة المتابعة
                      </span>
                      <h2>آخر الاستفسارات</h2>
                    </div>
                    <button
                      className="secretary-text-link"
                      onClick={() => setLeadView("leads")}
                    >
                      عرض الكل <ChevronLeft size={14} />
                    </button>
                  </div>
                  <div className="secretary-lead-preview-list">
                    {leads
                      .filter(lead =>
                        ["new", "contacted", "interested", "trial"].includes(
                          lead.status
                        )
                      )
                      .slice(0, 5)
                      .map(lead => (
                        <button
                          key={lead.id}
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setLeadView("leads");
                          }}
                        >
                          <i
                            className={`secretary-lead-avatar ${LEAD_STATUS_COLORS[lead.status]}`}
                          >
                            {lead.childName.slice(0, 1)}
                          </i>
                          <span>
                            <strong>{lead.childName}</strong>
                            <small>
                              {COURSE_CATALOG.find(
                                item => item.id === lead.interestedCourseId
                              )?.name ?? "استفسار عام"}{" "}
                              · {LEAD_SOURCE_LABELS[lead.source]}
                            </small>
                          </span>
                          <span
                            className={`secretary-status-pill ${lead.status}`}
                          >
                            {LEAD_STATUS_LABELS[lead.status]}
                          </span>
                          <ChevronLeft size={14} />
                        </button>
                      ))}
                  </div>
                  <div className="secretary-panel-footer">
                    <span>
                      <Users size={14} /> كل السجلات مرتبطة بفرع {BRANCH}
                    </span>
                    <button onClick={() => setLeadView("leads")}>
                      فتح المتابعة <ArrowUpLeft size={14} />
                    </button>
                  </div>
                </section>
                <section className="secretary-panel secretary-pipeline-panel">
                  <div className="secretary-panel-heading">
                    <div>
                      <span className="secretary-panel-kicker">
                        مسار الاهتمام
                      </span>
                      <h2>رحلة الاستفسار</h2>
                    </div>
                    <span className="secretary-pipeline-total">
                      {leads.length} سجلات
                    </span>
                  </div>
                  <div className="secretary-pipeline-list">
                    {pipelineCounts
                      .filter(item => item.count > 0)
                      .map(item => (
                        <button
                          key={item.status}
                          onClick={() => {
                            setStatusFilter(item.status);
                            setLeadView("leads");
                          }}
                        >
                          <span
                            className={`secretary-pipeline-dot ${item.status}`}
                          />
                          <span>{LEAD_STATUS_LABELS[item.status]}</span>
                          <strong>{item.count}</strong>
                          <i>
                            <b
                              style={{
                                width: `${Math.max(8, (item.count / Math.max(leads.length, 1)) * 100)}%`,
                              }}
                            />
                          </i>
                        </button>
                      ))}
                  </div>
                  <div className="secretary-source-note">
                    <Filter size={14} />
                    <span>
                      المصدر يساعدك على فهم قناة وصول الأسرة، وليس لتغيير أولوية
                      التسجيل.
                    </span>
                  </div>
                </section>
              </div>
              <section className="secretary-quick-panel secretary-panel">
                <div className="secretary-panel-heading">
                  <div>
                    <span className="secretary-panel-kicker">
                      إجراءات عملية
                    </span>
                    <h2>اختصارات العمل</h2>
                  </div>
                </div>
                <div className="secretary-quick-grid">
                  <button
                    onClick={() => {
                      setLeadDraft(createLeadDraft());
                      setDialog("lead");
                    }}
                  >
                    <span className="secretary-quick-icon quick-teal">
                      <Plus size={18} />
                    </span>
                    <strong>إضافة استفسار جديد</strong>
                    <small>تسجيل بيانات الطفل وولي الأمر والمصدر</small>
                    <ArrowUpLeft size={15} />
                  </button>
                  <button onClick={() => setLeadView("leads")}>
                    <span className="secretary-quick-icon quick-blue">
                      <MessageCircle size={18} />
                    </span>
                    <strong>متابعة الأسر</strong>
                    <small>تحديث مرحلة الاهتمام وتدوين ملاحظة</small>
                    <ArrowUpLeft size={15} />
                  </button>
                  <button onClick={() => openRegistration()}>
                    <span className="secretary-quick-icon quick-violet">
                      <GraduationCap size={18} />
                    </span>
                    <strong>بدء تسجيل طالب</strong>
                    <small>ربط الطالب بمجموعة متاحة في الفرع</small>
                    <ArrowUpLeft size={15} />
                  </button>
                </div>
              </section>
            </>
          )}

          {view === "operations" && (
            <div className="secretary-operations-page">
              <section className="secretary-operations-summary">
                <div>
                  <span className="secretary-panel-kicker">
                    تشغيل الفرع · السبت ٢٦ سبتمبر
                  </span>
                  <h2>نظرة سريعة على مجموعات اليوم</h2>
                  <p>
                    استخدمي الطاقة المتاحة لاختيار المجموعة المناسبة قبل إكمال
                    التسجيل.
                  </p>
                </div>
                <span className="secretary-operations-mark">
                  <CalendarDays size={23} />
                </span>
              </section>
              <section className="secretary-operations-kpis">
                <article>
                  <span>
                    <CalendarDays size={16} />
                  </span>
                  <small>مجموعات نشطة</small>
                  <strong>
                    {offerings.filter(item => item.status === "ongoing").length}
                  </strong>
                </article>
                <article>
                  <span>
                    <Clock3 size={16} />
                  </span>
                  <small>مجموعات قادمة</small>
                  <strong>
                    {
                      offerings.filter(item => item.status === "upcoming")
                        .length
                    }
                  </strong>
                </article>
                <article>
                  <span>
                    <Users size={16} />
                  </span>
                  <small>مقاعد متاحة</small>
                  <strong>
                    {offerings.reduce(
                      (total, item) =>
                        total + item.maxStudents - item.enrolledStudents,
                      0
                    )}
                  </strong>
                </article>
              </section>
              <section className="secretary-panel secretary-schedule-panel">
                <div className="secretary-panel-heading">
                  <div>
                    <span className="secretary-panel-kicker">
                      مجموعات فرع {BRANCH}
                    </span>
                    <h2>الجدول والطاقة الاستيعابية</h2>
                  </div>
                  <span className="secretary-pipeline-total">
                    {offerings.length} مجموعات
                  </span>
                </div>
                <div className="secretary-schedule-list">
                  {offerings.map(offering => {
                    const available =
                      offering.maxStudents - offering.enrolledStudents;
                    const fill = Math.round(
                      (offering.enrolledStudents / offering.maxStudents) * 100
                    );
                    return (
                      <article
                        key={offering.id}
                        className="secretary-schedule-card"
                      >
                        <span
                          className={`secretary-schedule-status ${offering.status}`}
                        >
                          <i />
                          {offering.status === "ongoing" ? "جارية" : "قادمة"}
                        </span>
                        <div className="secretary-schedule-main">
                          <strong>{offering.courseName}</strong>
                          <small>
                            {offering.id} · {offering.schedule}
                          </small>
                          <span>
                            <MapPin size={13} /> {offering.classroom} · المدرب{" "}
                            {offering.instructor}
                          </span>
                        </div>
                        <div className="secretary-capacity">
                          <div>
                            <span>الطاقة</span>
                            <strong>
                              {offering.enrolledStudents}/{offering.maxStudents}
                            </strong>
                          </div>
                          <div className="secretary-capacity-bar">
                            <i style={{ width: `${fill}%` }} />
                          </div>
                          <small>
                            {available > 0
                              ? `${available} مقاعد متاحة`
                              : "المجموعة مكتملة"}
                          </small>
                        </div>
                        <button
                          className="secretary-secondary-button"
                          disabled={available === 0}
                          onClick={() =>
                            openRegistration(undefined, offering.id)
                          }
                        >
                          <UserRoundPlus size={14} /> تسجيل طالب
                        </button>
                      </article>
                    );
                  })}
                </div>
                <div className="secretary-schedule-note">
                  <AlertCircle size={14} />
                  <span>
                    التقويم للعرض التشغيلي فقط؛ تعديل مواعيد الجلسات من اختصاص
                    الإدارة الأكاديمية.
                  </span>
                </div>
              </section>
            </div>
          )}

          {view === "leads" && (
            <>
              <section className="secretary-lead-kpis">
                <span>
                  <b>{leads.length}</b> إجمالي الاستفسارات
                </span>
                <span>
                  <i className="lead-indicator new" />
                  <b>{newLeadCount}</b> جديد
                </span>
                <span>
                  <i className="lead-indicator trial" />
                  <b>{trialCount}</b> حصة تجريبية
                </span>
                <span>
                  <i className="lead-indicator enrolled" />
                  <b>{enrolledLeadCount}</b> مسجل
                </span>
              </section>
              <div className="secretary-workspace-grid">
                <section className="secretary-panel secretary-leads-table-panel">
                  <div className="secretary-panel-heading lead-table-heading">
                    <div>
                      <span className="secretary-panel-kicker">
                        CRM الفرع · {BRANCH}
                      </span>
                      <h2>
                        قائمة الاستفسارات{" "}
                        <small>{filteredLeads.length} نتيجة</small>
                      </h2>
                    </div>
                    <button
                      className="secretary-secondary-button"
                      onClick={() => {
                        setLeadDraft(createLeadDraft());
                        setDialog("lead");
                      }}
                    >
                      <Plus size={15} /> إضافة استفسار
                    </button>
                  </div>
                  <div className="secretary-filter-row">
                    <label className="secretary-search">
                      <Search size={15} />
                      <input
                        aria-label="بحث في الاستفسارات"
                        placeholder="الاسم أو الهاتف أو الكورس..."
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                      />
                    </label>
                    <label className="secretary-select-filter">
                      <Filter size={14} />
                      <select
                        aria-label="تصفية الحالة"
                        value={statusFilter}
                        onChange={event =>
                          setStatusFilter(
                            event.target.value as LeadStatus | "all"
                          )
                        }
                      >
                        <option value="all">كل المراحل</option>
                        {LEAD_STATUSES.map(status => (
                          <option key={status} value={status}>
                            {LEAD_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="secretary-select-filter">
                      <select
                        aria-label="تصفية المصدر"
                        value={sourceFilter}
                        onChange={event =>
                          setSourceFilter(
                            event.target.value as LeadSource | "all"
                          )
                        }
                      >
                        <option value="all">كل المصادر</option>
                        {Object.entries(LEAD_SOURCE_LABELS).map(
                          ([source, label]) => (
                            <option key={source} value={source}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  </div>
                  <div className="secretary-leads-table-wrap">
                    <table className="secretary-leads-table">
                      <thead>
                        <tr>
                          <th>الطفل</th>
                          <th>ولي الأمر</th>
                          <th>المصدر</th>
                          <th>الكورس المهتم به</th>
                          <th>المرحلة</th>
                          <th>تاريخ الوصول</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map(lead => (
                          <tr
                            key={lead.id}
                            tabIndex={0}
                            aria-label={`فتح ملف الاستفسار ${lead.childName}`}
                            aria-current={
                              selectedLeadId === lead.id ? "true" : undefined
                            }
                            className={
                              selectedLeadId === lead.id ? "selected" : ""
                            }
                            onClick={() => setSelectedLeadId(lead.id)}
                            onKeyDown={event => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedLeadId(lead.id);
                              }
                            }}
                          >
                            <td>
                              <span className="secretary-lead-name">
                                <i
                                  className={`secretary-lead-avatar ${LEAD_STATUS_COLORS[lead.status]}`}
                                >
                                  {lead.childName.slice(0, 1)}
                                </i>
                                <span>
                                  <strong>{lead.childName}</strong>
                                  <small>
                                    {lead.id}
                                    {lead.childAge
                                      ? ` · ${lead.childAge} سنة`
                                      : ""}
                                  </small>
                                </span>
                              </span>
                            </td>
                            <td>
                              <bdi dir="ltr" className="secretary-phone">
                                {lead.parentPhone}
                              </bdi>
                            </td>
                            <td>
                              <span className="secretary-source-badge">
                                {LEAD_SOURCE_LABELS[lead.source]}
                              </span>
                            </td>
                            <td>
                              {COURSE_CATALOG.find(
                                item => item.id === lead.interestedCourseId
                              )?.name ?? "لم يحدد"}
                            </td>
                            <td>
                              <span
                                className={`secretary-status-pill ${lead.status}`}
                              >
                                {LEAD_STATUS_LABELS[lead.status]}
                              </span>
                            </td>
                            <td>{formatDate(lead.createdAt)}</td>
                          </tr>
                        ))}
                        {filteredLeads.length === 0 && (
                          <tr>
                            <td colSpan={6}>
                            <EmptyState
                              compact
                              className="secretary-empty"
                              title="لا توجد استفسارات مطابقة"
                              action={
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuery("");
                                    setStatusFilter("all");
                                    setSourceFilter("all");
                                  }}
                                >
                                  مسح الفلاتر
                                </button>
                              }
                            />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="secretary-table-footer">
                    <span>عرض بيانات توضيحية محلية · لا يوجد إرسال فعلي</span>
                    <span>
                      {filteredLeads.length} من {leads.length} استفسارات
                    </span>
                  </div>
                </section>
                <aside className="secretary-panel secretary-lead-detail">
                  {selectedLead ? (
                    <>
                      <div className="secretary-detail-top">
                        <div>
                          <span className="secretary-panel-kicker">
                            ملف الاستفسار
                          </span>
                          <small>{selectedLead.id}</small>
                        </div>
                        <span
                          className={`secretary-status-pill ${selectedLead.status}`}
                        >
                          {LEAD_STATUS_LABELS[selectedLead.status]}
                        </span>
                      </div>
                      <div className="secretary-detail-person">
                        <i
                          className={`secretary-lead-avatar large ${LEAD_STATUS_COLORS[selectedLead.status]}`}
                        >
                          {selectedLead.childName.slice(0, 1)}
                        </i>
                        <h3>{selectedLead.childName}</h3>
                        <span>
                          {selectedLead.childAge
                            ? `${selectedLead.childAge} سنة · `
                            : ""}{" "}
                          فرع {selectedLead.branch}
                        </span>
                      </div>
                      <div className="secretary-contact-line">
                        <span>رقم ولي الأمر</span>
                        <bdi dir="ltr">{selectedLead.parentPhone}</bdi>
                      </div>
                      <div className="secretary-contact-line">
                        <span>مصدر الاستفسار</span>
                        <strong>
                          {LEAD_SOURCE_LABELS[selectedLead.source]}
                        </strong>
                      </div>
                      <div className="secretary-contact-line">
                        <span>الكورس</span>
                        <strong>{selectedLeadCourse?.name ?? "لم يحدد"}</strong>
                      </div>
                      <div className="secretary-contact-line">
                        <span>المسؤول عن المتابعة</span>
                        <strong>{selectedLead.assignedTo}</strong>
                      </div>
                      <label className="secretary-stage-select">
                        <span>مرحلة الاهتمام</span>
                        <select
                          value={selectedLead.status}
                          disabled={selectedLead.status === "enrolled"}
                          onChange={event =>
                            changeLeadStatus(
                              selectedLead.id,
                              event.target.value as LeadStatus
                            )
                          }
                        >
                          {LEAD_STATUSES.filter(
                            status => status !== "enrolled"
                          ).map(status => (
                            <option key={status} value={status}>
                              {LEAD_STATUS_LABELS[status]}
                            </option>
                          ))}
                          {selectedLead.status === "enrolled" && (
                            <option value="enrolled">مسجل</option>
                          )}
                        </select>
                      </label>
                      <div className="secretary-notes-block">
                        <div>
                          <strong>ملاحظات المتابعة</strong>
                          <small>جزء من بيانات توضيحية محلية</small>
                        </div>
                        <p>
                          {selectedLead.notes || "لا توجد ملاحظة حتى الآن."}
                        </p>
                        <NoteComposer
                          key={selectedLead.id}
                          onSave={note => saveLeadNote(selectedLead.id, note)}
                        />
                      </div>
                      <div className="secretary-activity-block">
                        <div className="secretary-activity-heading">
                          <div>
                            <strong>سجل التواصل والمتابعة</strong>
                            <small>
                              {selectedLead.activities?.length ?? 0} نشاطات
                              مسجلة
                            </small>
                          </div>
                          <button
                            className="secretary-copy-button"
                            onClick={() => {
                              setActivityKind("call");
                              setActivityOpen(open => !open);
                            }}
                          >
                            <Clock3 size={14} /> إضافة نشاط
                          </button>
                        </div>
                        {activityOpen && (
                          <form
                            className="secretary-activity-form"
                            onSubmit={saveLeadActivity}
                          >
                            <div
                              className="secretary-activity-type"
                              role="group"
                              aria-label="نوع النشاط"
                            >
                              <button
                                type="button"
                                className={
                                  activityKind === "call" ? "active" : ""
                                }
                                onClick={() => setActivityKind("call")}
                              >
                                <MessageCircle size={13} /> مكالمة
                              </button>
                              <button
                                type="button"
                                className={
                                  activityKind === "follow_up" ? "active" : ""
                                }
                                onClick={() => setActivityKind("follow_up")}
                              >
                                <CalendarDays size={13} /> موعد متابعة
                              </button>
                            </div>
                            {activityKind === "follow_up" && (
                              <label>
                                <span>موعد المتابعة</span>
                                <input
                                  type="date"
                                  value={activityDate}
                                  onChange={event =>
                                    setActivityDate(event.target.value)
                                  }
                                />
                              </label>
                            )}
                            <label>
                              <span>
                                {activityKind === "call"
                                  ? "ملخص المكالمة"
                                  : "هدف المتابعة"}
                              </span>
                              <textarea
                                rows={2}
                                placeholder="مثال: طلب ولي الأمر الاتصال بعد انتهاء الدوام"
                                value={activityNote}
                                onChange={event =>
                                  setActivityNote(event.target.value)
                                }
                              />
                            </label>
                            <div className="secretary-activity-form-actions">
                              <button
                                type="button"
                                className="secretary-copy-button"
                                onClick={() => setActivityOpen(false)}
                              >
                                إلغاء
                              </button>
                              <button
                                className="secretary-primary-button"
                                type="submit"
                              >
                                <Check size={14} /> حفظ النشاط
                              </button>
                            </div>
                          </form>
                        )}
                        <div className="secretary-activity-timeline">
                          {(selectedLead.activities ?? [])
                            .slice(0, 3)
                            .map(activity => (
                              <div
                                key={activity.id}
                                className="secretary-activity-item"
                              >
                                <span
                                  className={
                                    activity.kind === "call"
                                      ? "call"
                                      : "follow-up"
                                  }
                                >
                                  {activity.kind === "call" ? (
                                    <MessageCircle size={12} />
                                  ) : (
                                    <CalendarDays size={12} />
                                  )}
                                </span>
                                <div>
                                  <strong>{activity.outcome}</strong>
                                  <small>
                                    {activity.note}
                                    {activity.scheduledFor
                                      ? ` · ${formatDate(activity.scheduledFor)}`
                                      : ""}
                                  </small>
                                </div>
                              </div>
                            ))}
                          {!selectedLead.activities?.length && (
                            <p className="secretary-activity-empty">
                              لم يتم تسجيل مكالمات أو مواعيد متابعة بعد.
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="secretary-detail-actions">
                        <button
                          className="secretary-secondary-button"
                          onClick={() => logContactAttempt(selectedLead)}
                          disabled={
                            selectedLead.status === "enrolled" ||
                            selectedLead.status === "lost"
                          }
                        >
                          <MessageCircle size={15} /> تسجيل محاولة تواصل
                        </button>
                        <button
                          className="secretary-copy-button"
                          onClick={() => copyFollowUpMessage(selectedLead)}
                        >
                          <FileText size={15} /> نسخ رسالة متابعة
                        </button>
                        {selectedLead.status !== "enrolled" &&
                          selectedLead.status !== "lost" && (
                            <button
                              className="secretary-primary-button"
                              onClick={() => openRegistration(selectedLead)}
                            >
                              <GraduationCap size={15} /> تحويل إلى تسجيل{" "}
                              <ChevronLeft size={14} />
                            </button>
                          )}
                        {selectedLead.status === "enrolled" &&
                          selectedLead.convertedStudentId && (
                            <span className="secretary-converted-tag">
                              <CheckCircle2 size={14} /> رقم الطالب{" "}
                              {selectedLead.convertedStudentId}
                            </span>
                          )}
                      </div>
                    </>
                  ) : (
                    <ErrorState
                      compact
                      className="secretary-empty"
                      title="تعذر العثور على الاستفسار"
                      description="اختاري سجلًا آخر من قائمة المتابعة لإكمال العمل."
                    />
                  )}
                </aside>
              </div>
            </>
          )}

          {view === "registrations" && (
            <>
              <section className="secretary-registration-summary">
                <div>
                  <span className="secretary-panel-kicker">
                    التسجيل داخل فرع {BRANCH}
                  </span>
                  <h2>التسجيلات النشطة</h2>
                  <p>تسجيل الطالب وربطه بعرض مجموعة متاح في الفرع.</p>
                </div>
                <div className="secretary-registration-summary-stats">
                  <span>
                    <strong>{registrations.length}</strong>
                    <small>تسجيلات بالمعاينة</small>
                  </span>
                  <span>
                    <strong>{availableOfferings.length}</strong>
                    <small>مجموعات متاحة</small>
                  </span>
                  <button
                    className="secretary-primary-button"
                    onClick={() => openRegistration()}
                  >
                    <UserRoundPlus size={16} /> تسجيل جديد
                  </button>
                </div>
              </section>
              <section className="secretary-panel secretary-registrations-panel">
                <div className="secretary-panel-heading">
                  <div>
                    <span className="secretary-panel-kicker">
                      سجلات student_enrollments · نموذج محلي
                    </span>
                    <h2>
                      قائمة الطلاب المسجلين{" "}
                      <small>{filteredRegistrations.length}</small>
                    </h2>
                  </div>
                  <label className="secretary-search registrations-search">
                    <Search size={15} />
                    <input
                      aria-label="بحث في التسجيلات"
                      placeholder="الطالب أو ولي الأمر أو رقم الهاتف..."
                      value={studentSearch}
                      onChange={event => setStudentSearch(event.target.value)}
                    />
                  </label>
                </div>
                <div className="secretary-registration-cards">
                  {filteredRegistrations.map(registration => (
                    <article
                      className="secretary-registration-card"
                      key={registration.id}
                    >
                      <i className="secretary-registration-avatar">
                        {registration.fullName.slice(0, 1)}
                      </i>
                      <div className="secretary-registration-person">
                        <strong>{registration.fullName}</strong>
                        <small>
                          {registration.studentId} ·{" "}
                          {registration.gender === "male" ? "ذكر" : "أنثى"} ·{" "}
                          {formatDate(registration.dateOfBirth)}
                        </small>
                      </div>
                      <div className="secretary-registration-course">
                        <BookOpen size={15} />
                        <span>
                          <strong>{registration.courseName}</strong>
                          <small>
                            {offerings.find(
                              item => item.id === registration.offeringId
                            )?.schedule ?? "مجموعة"}{" "}
                            · {registration.offeringId}
                          </small>
                        </span>
                      </div>
                      <div className="secretary-registration-parent">
                        <span>ولي الأمر · {registration.parentName}</span>
                        <bdi dir="ltr">{registration.parentPhone}</bdi>
                      </div>
                      <div className="secretary-registration-price">
                        <small>السعر التوضيحي قبل الخصومات</small>
                        <strong>
                          {formatMoney(registration.finalPricePiastres)}
                        </strong>
                      </div>
                      <span className="secretary-registration-state">
                        <CheckCircle2 size={14} /> نشط
                      </span>
                    </article>
                  ))}
                  {filteredRegistrations.length === 0 && (
                    <div className="secretary-empty">
                      <Search size={19} />
                      <strong>لا توجد تسجيلات مطابقة</strong>
                      <button onClick={() => setStudentSearch("")}>
                        مسح البحث
                      </button>
                    </div>
                  )}
                </div>
                <div className="secretary-registration-footnote">
                  <AlertCircle size={14} />
                  <span>
                    لا يتم إنشاء فاتورة أو حساب ولي أمر/OTP هنا. الخصومات
                    والتحصيل عند المحاسب؛ البيانات محلية للمعاينة فقط.
                  </span>
                  <button onClick={() => navigate("/students")}>
                    فتح ملفات الطلاب <ArrowUpLeft size={14} />
                  </button>
                </div>
              </section>
              <section className="secretary-panel secretary-offerings-panel">
                <div className="secretary-panel-heading">
                  <div>
                    <span className="secretary-panel-kicker">
                      العروض المتاحة داخل الفرع
                    </span>
                    <h2>مجموعات يمكن التسجيل بها</h2>
                  </div>
                </div>
                <div className="secretary-offerings-list">
                  {availableOfferings.map(offering => (
                    <article key={offering.id}>
                      <span className="secretary-offering-icon">
                        <BookOpen size={17} />
                      </span>
                      <div>
                        <strong>{offering.courseName}</strong>
                        <small>
                          {offering.id} · {offering.schedule}
                        </small>
                      </div>
                      <span>
                        <MapPin size={13} />
                        {offering.classroom}
                      </span>
                      <span>
                        <Users size={13} />
                        {offering.enrolledStudents} / {offering.maxStudents}
                      </span>
                      <b>
                        {formatMoney(
                          COURSE_CATALOG.find(
                            course => course.id === offering.courseId
                          )?.basePricePiastres ?? 0
                        )}
                      </b>
                      <button
                        onClick={() => openRegistration(undefined, offering.id)}
                        aria-label={`تسجيل طالب في ${offering.courseName}`}
                      >
                        <Plus size={15} /> تسجيل
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          <footer className="secretary-footer-note">
            <span>
              <AlertCircle size={14} />
            </span>
            <p>
              صلاحية السكرتارية هنا تقتصر على تسجيل الاهتمامات والمتابعة وبيانات
              الطلاب؛ الأسعار توضيحية، ولا يوجد اتصال حقيقي أو تحصيل أو إنشاء
              حسابات دخول.
            </p>
          </footer>
        </div>
      </main>

      {dialog === "lead" && (
        <div
          className="secretary-dialog-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setDialog(null);
          }}
        >
          <section
            className="secretary-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="secretary-lead-title"
          >
            <div className="secretary-dialog-top">
              <span>
                <UserRoundSearch size={18} />
              </span>
              <button aria-label="إغلاق" onClick={() => setDialog(null)}>
                <X size={17} />
              </button>
            </div>
            <span className="secretary-dialog-kicker">
              سجل `leads` · الفرع: {BRANCH}
            </span>
            <h2 id="secretary-lead-title">تسجيل استفسار جديد</h2>
            <p>
              أضيفي بيانات الطفل ووسيلة وصول الأسرة، ثم اختاري الكورس إن كان
              محددًا.
            </p>
            <form onSubmit={addLead}>
              <label className="secretary-field">
                <span>
                  اسم الطفل <b>*</b>
                </span>
                <input
                  autoFocus
                  value={leadDraft.childName}
                  onChange={event =>
                    setLeadDraft(current => ({
                      ...current,
                      childName: event.target.value,
                    }))
                  }
                  placeholder="الاسم بالكامل"
                  required
                />
              </label>
              <div className="secretary-field-row">
                <label className="secretary-field">
                  <span>
                    رقم ولي الأمر <b>*</b>
                  </span>
                  <input
                    value={leadDraft.parentPhone}
                    onChange={event =>
                      setLeadDraft(current => ({
                        ...current,
                        parentPhone: event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 11),
                      }))
                    }
                    placeholder="01XXXXXXXXX"
                    inputMode="tel"
                    dir="ltr"
                    required
                  />
                </label>
                <label className="secretary-field">
                  <span>عمر الطفل</span>
                  <input
                    type="number"
                    min="4"
                    max="18"
                    value={leadDraft.childAge}
                    onChange={event =>
                      setLeadDraft(current => ({
                        ...current,
                        childAge: event.target.value,
                      }))
                    }
                    placeholder="سنوات"
                  />
                </label>
              </div>
              <div className="secretary-field-row">
                <label className="secretary-field">
                  <span>الكورس المهتم به</span>
                  <select
                    value={leadDraft.interestedCourseId}
                    onChange={event =>
                      setLeadDraft(current => ({
                        ...current,
                        interestedCourseId: event.target.value,
                      }))
                    }
                  >
                    <option value="">لم يحدد بعد</option>
                    {COURSE_CATALOG.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name} · {course.ageGroup}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="secretary-field">
                  <span>
                    مصدر الاستفسار <b>*</b>
                  </span>
                  <select
                    value={leadDraft.source}
                    onChange={event =>
                      setLeadDraft(current => ({
                        ...current,
                        source: event.target.value as LeadSource,
                      }))
                    }
                  >
                    {Object.entries(LEAD_SOURCE_LABELS).map(
                      ([source, label]) => (
                        <option key={source} value={source}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>
              <label className="secretary-field">
                <span>ملاحظة أولية</span>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={leadDraft.notes}
                  onChange={event =>
                    setLeadDraft(current => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="السؤال أو الوقت المناسب للتواصل..."
                />
              </label>
              <div className="secretary-form-note">
                <AlertCircle size={14} />
                <span>
                  سيُسند الاستفسار محليًا إلى {SECRETARY}، دون إجراء مكالمة أو
                  إرسال رسالة.
                </span>
              </div>
              <div className="secretary-dialog-actions">
                <button
                  type="button"
                  className="secretary-secondary-button"
                  onClick={() => setDialog(null)}
                >
                  إلغاء
                </button>
                <button type="submit" className="secretary-primary-button">
                  <Check size={15} /> إضافة للمتابعة
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {dialog === "registration" && (
        <div
          className="secretary-dialog-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setDialog(null);
              setRegistrationLeadId(null);
            }
          }}
        >
          <section
            className="secretary-dialog secretary-registration-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="secretary-registration-title"
          >
            <div className="secretary-dialog-top">
              <span>
                <GraduationCap size={18} />
              </span>
              <button
                aria-label="إغلاق"
                onClick={() => {
                  setDialog(null);
                  setRegistrationLeadId(null);
                }}
              >
                <X size={17} />
              </button>
            </div>
            <span className="secretary-dialog-kicker">
              ملفا `students` و`student_enrollments` · {BRANCH}
            </span>
            <h2 id="secretary-registration-title">تسجيل طالب في مجموعة</h2>
            <p>
              {registrationLeadId
                ? `تحويل الاستفسار ${registrationLeadId} إلى تسجيل محلي.`
                : "سجلي بيانات الطالب والأسرة واختاري مجموعة متاحة."}
            </p>
            <form onSubmit={submitRegistration}>
              <label className="secretary-field">
                <span>
                  اسم الطالب بالكامل <b>*</b>
                </span>
                <input
                  autoFocus
                  value={registrationDraft.fullName}
                  onChange={event =>
                    setRegistrationDraft(current => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  placeholder="الاسم بالكامل"
                  required
                />
              </label>
              <div className="secretary-field-row">
                <label className="secretary-field">
                  <span>
                    تاريخ الميلاد <b>*</b>
                  </span>
                  <input
                    type="date"
                    value={registrationDraft.dateOfBirth}
                    onChange={event =>
                      setRegistrationDraft(current => ({
                        ...current,
                        dateOfBirth: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="secretary-field">
                  <span>النوع</span>
                  <select
                    value={registrationDraft.gender}
                    onChange={event =>
                      setRegistrationDraft(current => ({
                        ...current,
                        gender: event.target.value as "male" | "female",
                      }))
                    }
                  >
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </label>
              </div>
              <div className="secretary-field-row">
                <label className="secretary-field">
                  <span>
                    اسم ولي الأمر <b>*</b>
                  </span>
                  <input
                    value={registrationDraft.parentName}
                    onChange={event =>
                      setRegistrationDraft(current => ({
                        ...current,
                        parentName: event.target.value,
                      }))
                    }
                    placeholder="اسم ولي الأمر"
                    required
                  />
                </label>
                <label className="secretary-field">
                  <span>
                    رقم الهاتف <b>*</b>
                  </span>
                  <input
                    value={registrationDraft.parentPhone}
                    onChange={event =>
                      setRegistrationDraft(current => ({
                        ...current,
                        parentPhone: event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 11),
                      }))
                    }
                    placeholder="01XXXXXXXXX"
                    inputMode="tel"
                    dir="ltr"
                    required
                  />
                </label>
              </div>
              <div className="secretary-field-row">
                <label className="secretary-field">
                  <span>صلة القرابة</span>
                  <select
                    value={registrationDraft.relation}
                    onChange={event =>
                      setRegistrationDraft(current => ({
                        ...current,
                        relation: event.target
                          .value as RegistrationDraft["relation"],
                      }))
                    }
                  >
                    <option value="father">الأب</option>
                    <option value="mother">الأم</option>
                    <option value="guardian">ولي أمر</option>
                  </select>
                </label>
                <label className="secretary-field">
                  <span>
                    مصدر تسجيل الطالب <b>*</b>
                  </span>
                  <select
                    value={registrationDraft.source}
                    onChange={event =>
                      setRegistrationDraft(current => ({
                        ...current,
                        source: event.target.value as StudentSource | "",
                      }))
                    }
                    required
                  >
                    <option value="">اختاري المصدر المناسب</option>
                    {Object.entries(STUDENT_SOURCE_LABELS).map(
                      ([source, label]) => (
                        <option key={source} value={source}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>
              <label className="secretary-field">
                <span>
                  المجموعة <b>*</b>
                </span>
                <select
                  value={registrationDraft.offeringId}
                  onChange={event =>
                    setRegistrationDraft(current => ({
                      ...current,
                      offeringId: event.target.value,
                    }))
                  }
                  required
                >
                  {availableOfferings.map(offering => (
                    <option key={offering.id} value={offering.id}>
                      {offering.courseName} · {offering.schedule}
                    </option>
                  ))}
                </select>
              </label>
              <label className="secretary-field secretary-discount-code-field">
                <span>
                  كود خصم ثابت <small>اختياري · لا يحتاج طلب اعتماد</small>
                </span>
                <input
                  value={registrationDraft.discountCode}
                  onChange={event =>
                    setRegistrationDraft(current => ({
                      ...current,
                      discountCode: event.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="مثال: SIBLINGS15"
                  dir="ltr"
                  list="secretary-discount-codes"
                />
                <datalist id="secretary-discount-codes">
                  {FIXED_DISCOUNT_CODES.map(item => (
                    <option key={item.code} value={item.code}>
                      {item.label} · {item.percent}%
                    </option>
                  ))}
                </datalist>
                <small className="secretary-field-hint">
                  {activeDiscount
                    ? `${activeDiscount.label} · ${activeDiscount.percent}% · يسمع في الفاتورة والماليات تلقائيًا.`
                    : "الأكواد الثابتة مثل خصم الأخوات تُفعل من السكرتارية دون موافقة منفصلة."}
                </small>
              </label>
              <div className="secretary-price-summary">
                <span>
                  <small>المجموعة</small>
                  <strong>
                    {chosenOffering?.id ?? "غير متاحة"} ·{" "}
                    {chosenOffering?.classroom ?? "—"}
                  </strong>
                </span>
                <span>
                  <small>السعر بعد الخصم</small>
                  <strong>
                    {chosenCourse
                      ? formatMoney(registrationPricePiastres)
                      : "—"}
                  </strong>
                </span>
              </div>
              <div className="secretary-form-note">
                <AlertCircle size={14} />
                <span>
                  السعر قبل الخصومات. لا تُنشأ فاتورة أو حساب دخول أو OTP،
                  والتسجيل محلي مؤقت.
                </span>
              </div>
              <div className="secretary-dialog-actions">
                <button
                  type="button"
                  className="secretary-secondary-button"
                  onClick={() => {
                    setDialog(null);
                    setRegistrationLeadId(null);
                  }}
                >
                  إلغاء
                </button>
                <button type="submit" className="secretary-primary-button">
                  <Check size={15} /> تأكيد التسجيل للمعاينة
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </RoleDashboardShell>
  );
}

function NoteComposer({ onSave }: { onSave: (note: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="secretary-note-composer"
      onSubmit={event => {
        event.preventDefault();
        onSave(value);
        setValue("");
      }}
    >
      <input
        aria-label="إضافة ملاحظة متابعة"
        value={value}
        onChange={event => setValue(event.target.value)}
        placeholder="أضيفي ملاحظة متابعة..."
        maxLength={180}
      />
      <button type="submit" disabled={!value.trim()} aria-label="حفظ الملاحظة">
        <Plus size={15} />
      </button>
    </form>
  );
}
