import React, { useState } from "react";
import {
  Baby,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  CreditCard,
  FileText,
  Heart,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Smile,
  Sparkles,
  Sun,
  Users,
  Utensils,
  Moon,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleSurfaceTopbar from "@/components/RoleSurfaceTopbar";
import { formatSystemDate } from "@/components/RoleDateBadge";
import { StudentDataHubModal } from "@/components/students/StudentDataHubModal";
import type { Student } from "@/pages/StudentsTypes";
import { featureFlags } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import "./NurseryDeskLive.css";

type CohortAgeGroup = "toddlers" | "pre_k" | "kg";
type ActiveDeskTab = "roster" | "schedule" | "installments";

interface ChildDailyState {
  id: string;
  name: string;
  age: string;
  avatarColor: string;
  initials: string;
  parentName: string;
  parentPhone: string;
  isPresent: boolean;
  temp: string;
  mood: "happy" | "calm" | "tired" | "needs_care";
  meal: "full" | "half" | "refused";
  nap: "full" | "light" | "none";
  note: string;
  planStatus: "paid" | "due";
}

const INITIAL_CHILDREN: Record<CohortAgeGroup, ChildDailyState[]> = {
  toddlers: [
    {
      id: "ch-01",
      name: "ليلى أحمد عثمان",
      age: "سنتان ونصف",
      avatarColor: "#0f766e",
      initials: "ل ع",
      parentName: "أحمد عثمان",
      parentPhone: "+201012345671",
      isPresent: true,
      temp: "36.7°",
      mood: "happy",
      meal: "full",
      nap: "full",
      note: "متفاعلة ومبتهجة جداً في حلقة الألوان واستكشاف المكعبات الإسفنجية.",
      planStatus: "paid",
    },
    {
      id: "ch-02",
      name: "حمزة كريم الشناوي",
      age: "سنتان و8 أشهر",
      avatarColor: "#2563eb",
      initials: "ح ش",
      parentName: "م. كريم الشناوي",
      parentPhone: "+201012345672",
      isPresent: true,
      temp: "36.8°",
      mood: "calm",
      meal: "half",
      nap: "light",
      note: "هادئ ومنتظم، استجاب لتوجيهات المعلمة عند ترتيب سلة الألعاب.",
      planStatus: "paid",
    },
    {
      id: "ch-03",
      name: "سيلين تامر فاروق",
      age: "سنتان وشهرين",
      avatarColor: "#d97706",
      initials: "س ف",
      parentName: "تامر فاروق",
      parentPhone: "+201012345673",
      isPresent: false,
      temp: "—",
      mood: "calm",
      meal: "full",
      nap: "full",
      note: "غائبة اليوم بإذن مسبق (موعد تطعيم دوري).",
      planStatus: "due",
    },
    {
      id: "ch-04",
      name: "زين عمر القاضي",
      age: "سنتان و10 أشهر",
      avatarColor: "#7c3aed",
      initials: "ز ق",
      parentName: "عمر القاضي",
      parentPhone: "+201012345674",
      isPresent: true,
      temp: "36.6°",
      mood: "happy",
      meal: "full",
      nap: "full",
      note: "أظهر فضولاً رائعاً في تمييز ملامس الأقمشة والأشكال الهندسية.",
      planStatus: "paid",
    },
  ],
  pre_k: [
    {
      id: "ch-10",
      name: "آدم خالد عبد الرحمن",
      age: "3 سنوات ونصف",
      avatarColor: "#0f766e",
      initials: "آ خ",
      parentName: "خالد عبد الرحمن",
      parentPhone: "+201012345675",
      isPresent: true,
      temp: "36.8°",
      mood: "happy",
      meal: "full",
      nap: "light",
      note: "متعاون جداً مع أصدقائه في تركيب مسار القطار الخشبي وتشارك المكعبات.",
      planStatus: "paid",
    },
    {
      id: "ch-11",
      name: "فريدة مصطفى النجار",
      age: "3 سنوات و9 أشهر",
      avatarColor: "#db2777",
      initials: "ف ن",
      parentName: "مصطفى النجار",
      parentPhone: "+201012345676",
      isPresent: true,
      temp: "36.6°",
      mood: "calm",
      meal: "full",
      nap: "full",
      note: "إتقان ممتاز في التلوين داخل الحدود والتعرف على أصوات الحروف.",
      planStatus: "paid",
    },
  ],
  kg: [
    {
      id: "ch-20",
      name: "ياسين شريف الألفي",
      age: "5 سنوات",
      avatarColor: "#0d9488",
      initials: "ي أ",
      parentName: "شريف الألفي",
      parentPhone: "+201012345677",
      isPresent: true,
      temp: "36.7°",
      mood: "happy",
      meal: "full",
      nap: "light",
      note: "أبدع في نشاط الروبوت المبسط وبرمجة حركة السلحفاة الذكية على اللوح.",
      planStatus: "paid",
    },
    {
      id: "ch-21",
      name: "مريم حسن الديب",
      age: "4 سنوات ونصف",
      avatarColor: "#e11d48",
      initials: "م د",
      parentName: "حسن الديب",
      parentPhone: "+201012345678",
      isPresent: true,
      temp: "36.9°",
      mood: "happy",
      meal: "full",
      nap: "full",
      note: "استيعاب منطقي سريع لحل المتاهة الذكية وقدرة قيادية في العمل الجماعي.",
      planStatus: "due",
    },
  ],
};

const SCHEDULE_BLOCKS = [
  {
    time: "08:00 ص - 09:00 ص",
    title: "الاستقبال والفحص الصباحي وحلقة الترحيب ☀️",
    desc: "فحص قياس الحرارة السريع، تنظيم الحقائب، وأذكار الصباح مع قصة استكشافية قصيرة.",
    state: "done",
  },
  {
    time: "09:00 ص - 10:15 ص",
    title: "نشاط المنهج الإدراكي وبناء التفكير المنطقي 🧩",
    desc: "موضوع اليوم: استكشاف الألوان الأساسية، تركيب الأشكال والمكعبات المغناطيسية، والربط الحركي.",
    state: "current",
  },
  {
    time: "10:15 ص - 11:00 ص",
    title: "وجبة الإفطار الصحية وتدريب العادات المستقلة 🍎",
    desc: "تناول وجبة صحية متوازنة، غسل اليدين باستقلالية، وترتيب طاولة الطعام.",
    state: "upcoming",
  },
  {
    time: "11:00 ص - 12:30 م",
    title: "الفنون التعبيرية والنشاط الحركي والحديقة 🎨",
    desc: "التلوين بالأصابع الصحية، اللعب الحركي في الحديقة الخارجية لتقوية التوازن والنشاط البدني.",
    state: "upcoming",
  },
  {
    time: "12:30 م - 01:30 م",
    title: "وقت القيلولة والراحة الهادئة 💤",
    desc: "موسيقى بيضاء هادئة وقيلولة مريحة لاستعادة النشاط والطاقة في بيئة معقمة ومريحة.",
    state: "upcoming",
  },
  {
    time: "01:30 م - 02:30 م",
    title: "النشاط الختامي والانصراف الآمن وتسليم أولياء الأمور 🏡",
    desc: "مراجعة اليوم، تسليم المستلزمات الشخصية، وتوثيق استلام ولي الأمر أو الحافلة المدرسية.",
    state: "upcoming",
  },
];

export default function NurseryDeskLive() {
  const { me } = useAuth();
  const isDemoAcademy = me?.tenantId === "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const [activeCohort, setActiveCohort] = useState<CohortAgeGroup>("toddlers");
  const [activeTab, setActiveTab] = useState<ActiveDeskTab>("roster");
  const [childrenMap, setChildrenMap] = useState<Record<CohortAgeGroup, ChildDailyState[]>>(() => {
    if (isDemoAcademy) return INITIAL_CHILDREN;
    return {
      toddlers: [],
      pre_k: [],
      kg: [],
    };
  });
  const [selectedHubStudent, setSelectedHubStudent] = useState<Student | null>(null);
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(() =>
    featureFlags.isFeatureEnabled("nursery_early_childhood", true)
  );

  const handleToggleFeature = () => {
    const next = !isFeatureEnabled;
    setIsFeatureEnabled(next);
    featureFlags.setFeatureEnabled("nursery_early_childhood", next);
    if (next) {
      toast.success("تم تفعيل منظومة الحضانة لهذه الأكاديمية بنجاح! 🚀");
    } else {
      toast.info("تم تعطيل منظومة الحضانة لهذه الأكاديمية.");
    }
  };

  const currentChildren = childrenMap[activeCohort];
  const presentCount = currentChildren.filter((c) => c.isPresent).length;
  const totalCount = currentChildren.length;
  const paidCount = currentChildren.filter((c) => c.planStatus === "paid").length;

  const updateChild = (id: string, updates: Partial<ChildDailyState>) => {
    setChildrenMap((prev) => ({
      ...prev,
      [activeCohort]: prev[activeCohort].map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const handleSendWhatsAppDigest = (child: ChildDailyState) => {
    let clean = child.parentPhone.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "2" + clean;
    if (!clean.startsWith("20") && clean.length === 10) clean = "20" + clean;

    const moodArabic =
      child.mood === "happy"
        ? "مبتهج وسعيد جداً 😄"
        : child.mood === "calm"
        ? "هادئ ومستقر 😌"
        : child.mood === "tired"
        ? "أظهر بعض التعب 🥱"
        : "احتاج رعاية خاصة ومتابعة 🥺";

    const mealArabic =
      child.meal === "full"
        ? "أنهى وجبته بالكامل بشهية ممتازة 🍽️"
        : child.meal === "half"
        ? "تناول نصف الوجبة 🥣"
        : "لم يرغب في تناول طعامه ❌";

    const napArabic =
      child.nap === "full"
        ? "قيلولة هادئة ومريحة 💤"
        : child.nap === "light"
        ? "نوم خفيف متقطع ⏳"
        : "لم ينم ولعب بأنشطة هادئة 🧸";

    const msg = encodeURIComponent(
      `مرحباً ${child.parentName}، تحية طيبة من أكاديمية ومدارس مدى للطفولة المبكرة 🌸\n` +
        `يسعدنا مشاركتكم التقرير اليومي للبطل/ة *${child.name}* ليوم الأربعاء:\n\n` +
        `• الحضور والصحة: ${child.isPresent ? `حاضر/ة (الحرارة ${child.temp})` : "غائب/ة"}\n` +
        `• المزاج والنشاط: ${moodArabic}\n` +
        `• الوجبة الغذائية: ${mealArabic}\n` +
        `• القيلولة والراحة: ${napArabic}\n` +
        `• ملاحظة المعلمة: ${child.note || "يوم حافل بالنشاط والاستكشاف"}\n\n` +
        `دمتم ودام أبطالنا بخير دائماً ❤️`
    );

    window.open(`https://web.whatsapp.com/send?phone=${clean}&text=${msg}`, "_blank");
    toast.success(`تم تجهيز وإرسال التقرير اليومي لولي أمر ${child.name} عبر واتساب بنجاح!`);
  };

  const handleOpenStudentHub = (child: ChildDailyState) => {
    const studentObj: Student = {
      id: child.id,
      name: child.name,
      parentName: child.parentName,
      parentPhone: child.parentPhone,
      relation: "ولي أمر",
      branch: "الفرع الرئيسي (المعادي)",
      course: "الحضانات وتنمية مهارات الطفولة المبكرة",
      source: "social_media",
      status: "active",
      gender: child.name.includes("ليلى") || child.name.includes("سيلين") || child.name.includes("فريدة") || child.name.includes("مريم") ? "female" : "male",
      birthDate: "2023-04-12",
      joined: "سبتمبر 2026",
      initials: child.initials,
      color: "teal",
    };
    setSelectedHubStudent(studentObj);
  };

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <RoleDashboardShell
      className="app-shell has-sidebar nursery-desk-shell"
      roleCode="R04"
      roleLabel="معلمة الحضانة والطفولة المبكرة"
      scopeLevel="branch"
      scopeLabel="قسم الحضانة والطفولة المبكرة"
      demo={false}
      branchName="فرع المعادي"
      tenantName="أكاديمية مدى"
      mobileOpen={mobileNavOpen}
      onCloseMobile={() => setMobileNavOpen(false)}
    >
      <main className="main-panel nursery-desk-page" dir="rtl">
        <RoleSurfaceTopbar
          onMenu={() => setMobileNavOpen(true)}
          scopeLabel="قسم الحضانة والطفولة المبكرة"
          roleLabel="معلمة الحضانة"
        />

        {/* Header Section */}
        <section className="nursery-header">
          <div className="nursery-header-left">
            <span className="nursery-kicker">
              <Baby size={15} /> منظومة الحضانات والطفولة المبكرة (Early Childhood Suite)
            </span>
            <h1 className="nursery-title">مكتب متابعة الحضانة والمنهج اليومي</h1>
            <p className="nursery-subtitle">
              إدارة اليوم التعليمي، الفحص الصباحي، الأنشطة الإدراكية والحركية، ومتابعة الوجبات والقيلولة مع إرسال التقارير الفورية لأولياء الأمور.
            </p>
          </div>

          <div className="nursery-header-actions">
            <button
              type="button"
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                border: isFeatureEnabled ? "1.5px solid #0f766e" : "1.5px solid #cbd5e1",
                background: isFeatureEnabled ? "#f0fdfa" : "#f8fafc",
                color: isFeatureEnabled ? "#0f766e" : "#64748b",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
              onClick={handleToggleFeature}
              title="تحكم الأدمن في تفعيل أو تعطيل ميزة الحضانة للأكاديمية الحالية"
            >
              <span>تحكم الأدمن بالميزة: {isFeatureEnabled ? "مفعلة للأكاديمية ✓" : "معطلة للأكاديمية ✕"}</span>
            </button>

            {isFeatureEnabled && (
              <button
                type="button"
                className="button button-primary"
                style={{ background: "#0f766e", display: "inline-flex", alignItems: "center", gap: "6px" }}
                onClick={() => toast.success("تم تحديث وحفظ بيانات أطفال الحضانة بنجاح!")}
              >
                <RefreshCw size={15} />
                <span>تحديث وحفظ اليوم</span>
              </button>
            )}
          </div>
        </section>

        {!isFeatureEnabled ? (
          <section style={{ background: "#ffffff", border: "1.5px dashed #cbd5e1", borderRadius: "16px", padding: "48px 24px", textAlign: "center", display: "grid", placeItems: "center", gap: "12px", margin: "20px 0" }}>
            <span style={{ fontSize: "2.5rem" }}>👶</span>
            <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#1e293b" }}>
              منظومة الحضانات والطفولة المبكرة ميزة إضافية (Add-on Module)
            </h3>
            <p style={{ margin: 0, color: "#64748b", maxWidth: "580px", fontSize: "0.92rem", lineHeight: 1.7 }}>
              هذه الميزة اختيارية تماماً ويتحكم فيها الأدمن حسب نشاط الأكاديمية. الأكاديميات التي تركز على الروبوتكس أو البرمجة فقط تكون الميزة معطلة لديها لمنع ازدحام النظام، بينما الأكاديميات التي تدير فروع حضانات وطفولة مبكرة يمكن للأدمن تفعيلها لها بضغطة زر.
            </p>
            <button
              type="button"
              className="button button-primary"
              style={{ background: "#0f766e", marginTop: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={handleToggleFeature}
            >
              <Sparkles size={16} />
              <span>تفعيل منظومة الحضانة لهذه الأكاديمية الآن 🚀</span>
            </button>
          </section>
        ) : (
          <>
            {/* Toolbar: Cohort Switcher & Date Navigation */}
        <section className="nursery-toolbar">
          <div className="nursery-filter-group">
            <div className="nursery-select-field">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <Users size={15} color="#0f766e" /> الفصل والفئة العمرية:
              </span>
              <select
                value={activeCohort}
                onChange={(e) => setActiveCohort(e.target.value as CohortAgeGroup)}
              >
                <option value="toddlers">فصل الفراشات (براعم مبكرة: 1.5 - 3 سنوات) 🦋</option>
                <option value="pre_k">فصل النجوم (تمهيدي روضة: 3 - 4 سنوات) ⭐</option>
                <option value="kg">فصل المبتكرين الصغار (KG1 - KG2: 4 - 6 سنوات) 🚀</option>
              </select>
            </div>

            <div className="nursery-date-nav">
              <button type="button" className="nursery-date-btn" title="اليوم السابق">
                <ChevronRight size={15} />
              </button>
              <span className="nursery-date-label">
                <CalendarDays size={14} style={{ display: "inline-block", marginLeft: "4px", verticalAlign: "middle" }} />
                اليوم، {formatSystemDate()}
              </span>
              <button type="button" className="nursery-date-btn" title="اليوم التالي">
                <ChevronLeft size={15} />
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
              معلمة الفصل: <strong style={{ color: "#0f172a" }}>أ. ميار حسني</strong>
            </span>
          </div>
        </section>

        {/* KPI Summary Cards */}
        <section className="nursery-kpi-grid">
          <div className="nursery-kpi-card">
            <div className="nursery-kpi-icon" style={{ background: "#f0fdfa", color: "#0f766e" }}>
              <Users size={24} />
            </div>
            <div className="nursery-kpi-info">
              <span>نسبة الحضور الصباحي للفصل</span>
              <strong>
                {presentCount} / {totalCount} طفل
              </strong>
              <small>
                {Math.round((presentCount / totalCount) * 100)}% التزام بالحضور اليوم
              </small>
            </div>
          </div>

          <div className="nursery-kpi-card">
            <div className="nursery-kpi-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
              <Sun size={24} />
            </div>
            <div className="nursery-kpi-info">
              <span>خطة المنهج اليومي المعتمدة</span>
              <strong style={{ fontSize: "1.1rem" }}>الألوان والمكعبات الذكية</strong>
              <small>نشاط إدراكي وحركي متكامل</small>
            </div>
          </div>

          <div className="nursery-kpi-card">
            <div className="nursery-kpi-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
              <Coins size={24} />
            </div>
            <div className="nursery-kpi-info">
              <span>أقساط واشتراكات شهر نوفمبر</span>
              <strong>
                {paidCount} / {totalCount} مسدد
              </strong>
              <small>
                {totalCount - paidCount > 0 ? `${totalCount - paidCount} بانتظار السداد` : "جميع الأقساط مسددة بالكامل ✓"}
              </small>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <nav className="nursery-tabs-nav">
          <button
            type="button"
            className={`nursery-tab-btn ${activeTab === "roster" ? "active" : ""}`}
            onClick={() => setActiveTab("roster")}
          >
            <Baby size={16} />
            <span>سجل المتابعة والتقارير اليومية للأطفال</span>
            <span className="nursery-tab-badge">{currentChildren.length}</span>
          </button>

          <button
            type="button"
            className={`nursery-tab-btn ${activeTab === "schedule" ? "active" : ""}`}
            onClick={() => setActiveTab("schedule")}
          >
            <Clock size={16} />
            <span>جدول فترات اليوم والمنهج السنوي</span>
            <span className="nursery-tab-badge">6 فترات</span>
          </button>

          <button
            type="button"
            className={`nursery-tab-btn ${activeTab === "installments" ? "active" : ""}`}
            onClick={() => setActiveTab("installments")}
          >
            <Coins size={16} />
            <span>كشف الأقساط والاشتراكات السنوية للفصل</span>
            <span className="nursery-tab-badge">{paidCount} مسدد</span>
          </button>
        </nav>

        {/* TAB 1: Children Daily Roster */}
        {activeTab === "roster" && (
          <section className="nursery-children-grid">
            {currentChildren.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "48px 16px",
                  background: "#ffffff",
                  borderRadius: "14px",
                  border: "1px dashed #cbd5e1",
                  color: "#64748b",
                }}
              >
                <Baby size={42} color="#0f766e" style={{ margin: "0 auto 12px" }} />
                <h3 style={{ fontSize: "16px", color: "#0f172a", marginBottom: "6px" }}>
                  لا توجد سجلات أطفال مسجلة في هذا الفصل بعد
                </h3>
                <p style={{ fontSize: "13px", maxWidth: "420px", margin: "0 auto 16px" }}>
                  هذه الأكاديمية مهيأة حديثاً. يمكنك البدء بإضافة الأطفال أو تسكينهم لتفعيل سجل المتابعة اليومي.
                </p>
              </div>
            ) : (
              currentChildren.map((child) => (
                <article key={child.id} className="nursery-child-card">
                <div className="child-card-head">
                  <div className="child-avatar-info">
                    <span className="child-avatar" style={{ background: child.avatarColor }}>
                      {child.initials}
                    </span>
                    <div className="child-names">
                      <strong>{child.name}</strong>
                      <small>
                        العمر: {child.age} · ولي الأمر: {child.parentName}
                      </small>
                    </div>
                  </div>

                  <div className="child-status-toggle">
                    <button
                      type="button"
                      className={`status-chip-btn ${child.isPresent ? "active present" : ""}`}
                      onClick={() => updateChild(child.id, { isPresent: true, temp: "36.7°" })}
                    >
                      حاضر
                    </button>
                    <button
                      type="button"
                      className={`status-chip-btn ${!child.isPresent ? "active absent" : ""}`}
                      onClick={() => updateChild(child.id, { isPresent: false, temp: "—" })}
                    >
                      غائب
                    </button>
                  </div>
                </div>

                {/* Metrics Row (Mood, Meal, Nap) */}
                <div className="child-metrics-row">
                  <div className="child-metric-box">
                    <span className="child-metric-label">
                      <Smile size={12} style={{ display: "inline", verticalAlign: "middle" }} /> المزاج والنشاط
                    </span>
                    <div className="child-metric-control">
                      <select
                        value={child.mood}
                        disabled={!child.isPresent}
                        onChange={(e) =>
                          updateChild(child.id, {
                            mood: e.target.value as ChildDailyState["mood"],
                          })
                        }
                      >
                        <option value="happy">😄 مبتهج وسعيد</option>
                        <option value="calm">😌 هادئ ومنتظم</option>
                        <option value="tired">🥱 نعسان ومرهق</option>
                        <option value="needs_care">🥺 يحتاج رعاية</option>
                      </select>
                    </div>
                  </div>

                  <div className="child-metric-box">
                    <span className="child-metric-label">
                      <Utensils size={12} style={{ display: "inline", verticalAlign: "middle" }} /> الوجبة الغذائية
                    </span>
                    <div className="child-metric-control">
                      <select
                        value={child.meal}
                        disabled={!child.isPresent}
                        onChange={(e) =>
                          updateChild(child.id, {
                            meal: e.target.value as ChildDailyState["meal"],
                          })
                        }
                      >
                        <option value="full">🍽️ أنهى وجبته (100%)</option>
                        <option value="half">🥣 نصف الوجبة (50%)</option>
                        <option value="refused">❌ لم يرغب بالأكل</option>
                      </select>
                    </div>
                  </div>

                  <div className="child-metric-box">
                    <span className="child-metric-label">
                      <Moon size={12} style={{ display: "inline", verticalAlign: "middle" }} /> القيلولة والراحة
                    </span>
                    <div className="child-metric-control">
                      <select
                        value={child.nap}
                        disabled={!child.isPresent}
                        onChange={(e) =>
                          updateChild(child.id, {
                            nap: e.target.value as ChildDailyState["nap"],
                          })
                        }
                      >
                        <option value="full">💤 قيلولة هادئة</option>
                        <option value="light">⏳ نوم خفيف</option>
                        <option value="none">🧸 لم ينم (لعب هادئ)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Individual Note with Quick Chips */}
                <div className="child-note-wrap">
                  <label>
                    <span>ملاحظة المعلمة وتقييم النشاط الفردي:</span>
                    {child.isPresent && (
                      <span style={{ fontSize: "11px", color: "#0f766e" }}>
                        الحرارة: <strong>{child.temp}</strong>
                      </span>
                    )}
                  </label>
                  <textarea
                    rows={2}
                    value={child.note}
                    disabled={!child.isPresent}
                    onChange={(e) => updateChild(child.id, { note: e.target.value })}
                    placeholder="اكتب ملاحظة واضحة ومحددة عن نشاط الطفل وسلوكه اليوم…"
                  />

                  {child.isPresent && (
                    <div className="child-quick-chips">
                      {[
                        { label: "🌟 نشاط حركي رائع", text: "أظهر نشاطاً حركياً وتناسقاً رائعاً في استخدام الأدوات اليوم." },
                        { label: "🤝 متعاون ومشارك", text: "متعاون جداً مع زملائه ومبادر في مشاركة الألعاب والترتيب." },
                        { label: "🥣 شهية ممتازة", text: "تناول وجبته كاملة بشهية ممتازة وبشكل مستقل." },
                        { label: "💡 فضول واستكشاف", text: "يتمتع بفضول استكشافي مبهر وسرعة بديهة في الأنشطة." },
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="child-chip-btn"
                          onClick={() => {
                            const next = child.note.trim() ? `${child.note.trim()}\n• ${chip.text}` : `• ${chip.text}`;
                            updateChild(child.id, { note: next });
                          }}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="child-card-actions">
                  <button
                    type="button"
                    className="btn-whatsapp-digest"
                    onClick={() => handleSendWhatsAppDigest(child)}
                    title="توليد وإرسال التقرير اليومي الشامل لولي الأمر عبر واتساب"
                  >
                    <MessageCircle size={14} />
                    <span>إرسال تقرير اليوم (واتساب)</span>
                  </button>

                  <button
                    type="button"
                    className="btn-child-hub"
                    onClick={() => handleOpenStudentHub(child)}
                    title="فتح سجل الطفل الأكاديمي والمالي الشامل 360°"
                  >
                    <Sparkles size={14} color="#0f766e" />
                    <span>السجل الشامل 360°</span>
                  </button>
                </div>
              </article>
            )))}
          </section>
        )}

        {/* TAB 2: Daily Schedule & Curriculum */}
        {activeTab === "schedule" && (
          <section className="nursery-schedule-timeline">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>
                  الجدول الزمني المعتمد لليوم الدراسي (منهج الطفولة المبكرة)
                </h3>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.88rem" }}>
                  توزيع متوازن بين الأنشطة الإدراكية، التطور الحركي، التغذية، والراحة المستحقة.
                </p>
              </div>

              <span style={{ fontSize: "12px", color: "#0f766e", background: "#f0fdfa", padding: "4px 10px", borderRadius: "8px", fontWeight: 700, border: "1px solid #ccfbf1" }}>
                منهج معتمد · العام الدراسي 2026/2027
              </span>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              {SCHEDULE_BLOCKS.map((block, idx) => (
                <div
                  key={idx}
                  className={`schedule-block-item ${
                    block.state === "current" ? "is-current" : block.state === "done" ? "is-done" : ""
                  }`}
                >
                  <div className="block-time-col">
                    <strong>{block.time}</strong>
                    <small>المدة: 60 - 75 دقيقة</small>
                  </div>

                  <div className="block-content-col">
                    <h4>{block.title}</h4>
                    <p>{block.desc}</p>
                  </div>

                  <div>
                    {block.state === "done" && (
                      <span className="block-badge-status done">
                        <CheckCircle2 size={12} style={{ display: "inline", verticalAlign: "middle" }} /> مكتملة ✓
                      </span>
                    )}
                    {block.state === "current" && (
                      <span className="block-badge-status current">
                        <Clock size={12} style={{ display: "inline", verticalAlign: "middle" }} /> جارية الآن ⚡
                      </span>
                    )}
                    {block.state === "upcoming" && (
                      <span className="block-badge-status upcoming">قادمة ⏳</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: Installments & Contracts Tracker */}
        {activeTab === "installments" && (
          <section className="nursery-installments-table-wrap">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>
                  متابعة الاشتراكات والأقساط السنوية لأطفال الفصل
                </h3>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                  نظام الاشتراك السنوي المعتمد: مقدم سنوي 5,000 ج.م + أقساط شهرية 1,500 ج.م على مدار 11 شهراً.
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <span style={{ fontSize: "12px", background: "#f0fdf4", color: "#166534", padding: "4px 10px", borderRadius: "8px", fontWeight: 700, border: "1px solid #bbf7d0" }}>
                  المسدد: {paidCount * 1500} ج.م
                </span>
                <span style={{ fontSize: "12px", background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: "8px", fontWeight: 700, border: "1px solid #fde68a" }}>
                  المستحق: {(totalCount - paidCount) * 1500} ج.م
                </span>
              </div>
            </div>

            <table className="nursery-table">
              <thead>
                <tr>
                  <th>اسم الطفل</th>
                  <th>ولي الأمر</th>
                  <th>نوع الخطة السنوية</th>
                  <th>قسط شهر نوفمبر 2026</th>
                  <th>حالة السداد</th>
                  <th>إجراءات فورية</th>
                </tr>
              </thead>
              <tbody>
                {currentChildren.map((child) => (
                  <tr key={child.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="child-avatar" style={{ width: "32px", height: "32px", fontSize: "0.78rem", background: child.avatarColor }}>
                          {child.initials}
                        </span>
                        <strong>{child.name}</strong>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span>{child.parentName}</span>
                        <small style={{ display: "block", color: "#64748b", direction: "ltr", textAlign: "right" }}>
                          {child.parentPhone}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", background: "#f0fdfa", color: "#0f766e", padding: "3px 8px", borderRadius: "6px", fontWeight: 700 }}>
                        حضانة سنوية (مقدم + 11 قسط)
                      </span>
                    </td>
                    <td>
                      <strong>1,500 ج.م</strong>
                    </td>
                    <td>
                      {child.planStatus === "paid" ? (
                        <span style={{ fontSize: "11.5px", background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: "6px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <CheckCircle2 size={13} /> مسدد بالخزينة ✓
                        </span>
                      ) : (
                        <span style={{ fontSize: "11.5px", background: "#fef3c7", color: "#b45309", padding: "3px 8px", borderRadius: "6px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={13} /> مستحق السداد ⏳
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {child.planStatus !== "paid" ? (
                          <>
                            <button
                              type="button"
                              style={{
                                background: "#0f766e",
                                color: "#ffffff",
                                border: "none",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              onClick={() => {
                                updateChild(child.id, { planStatus: "paid" });
                                toast.success(`تم تحصيل قسط شهر نوفمبر للبطل/ة ${child.name} بنجاح!`);
                              }}
                            >
                              <CreditCard size={12} /> سداد بالخزينة
                            </button>
                            <button
                              type="button"
                              style={{
                                background: "#25d366",
                                color: "#ffffff",
                                border: "none",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              onClick={() => {
                                let clean = child.parentPhone.replace(/\D/g, "");
                                if (clean.startsWith("0")) clean = "2" + clean;
                                if (!clean.startsWith("20") && clean.length === 10) clean = "20" + clean;
                                const msg = encodeURIComponent(
                                  `مرحباً ${child.parentName}، تحية طيبة من أكاديمية ومدارس مدى للطفولة المبكرة 🌸\nنود تذكيركم بموعد استحقاق قسط شهر نوفمبر بقيمة 1,500 ج.م الخاص بالطفل/ة *${child.name}*.\nشاكرين لتعاونكم وثقتكم بنا دائماً.`
                                );
                                window.open(`https://web.whatsapp.com/send?phone=${clean}&text=${msg}`, "_blank");
                              }}
                            >
                              <MessageCircle size={12} /> تذكير واتساب
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            style={{
                              background: "#f1f5f9",
                              color: "#475569",
                              border: "1px solid #cbd5e1",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                            onClick={() => handleOpenStudentHub(child)}
                          >
                            عرض الإيصال بالسجل 360°
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
          </>
        )}
      </main>

      {/* Embedded Student Data Hub Modal */}
      {selectedHubStudent && (
        <StudentDataHubModal
          isOpen={Boolean(selectedHubStudent)}
          student={selectedHubStudent}
          onClose={() => setSelectedHubStudent(null)}
        />
      )}
    </RoleDashboardShell>
  );
}
