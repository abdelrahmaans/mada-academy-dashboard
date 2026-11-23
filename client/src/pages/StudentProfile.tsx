import React, { useEffect, useState, useMemo, type FormEvent } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowRight,
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  MapPin,
  Phone,
  MessageCircle,
  CreditCard,
  Trophy,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileText,
  Receipt,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Coins,
  Send,
  Check,
  Plus,
  Trash2,
  Search,
  UserPlus,
  Edit,
  X,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  apiClient,
  type ConsumerAccountLookupRecord,
  type ConsumerInvitationDelivery,
  type ConsumerLinksResponse,
  type StudentRecord,
} from "@/lib/apiClient";
import {
  type Student,
  type StudentStatus,
  initialStudents,
  mapLiveStudent,
  resolveBranchLabel,
  getStoredStudentExtras,
  saveStoredStudentExtras,
  statusLabels,
} from "./StudentsTypes";
import {
  StudentCertificatePrintModal,
  type CertificateData,
} from "@/components/certificates/StudentCertificatePrintModal";
import RoleSidebar from "@/components/RoleSidebar";
import FloatingLanguageToggle from "@/components/FloatingLanguageToggle";
import "./StudentProfile.css";

type TabKey = "OVERVIEW" | "FINANCE" | "COMPETITIONS" | "SKILLS" | "FAMILY";

export default function StudentProfile() {
  const params = useParams<{ id: string }>();
  const [location, navigate] = useLocation();
  const { me } = useAuth();

  const studentId = params?.id || "";

  const [studentsList, setStudentsList] = useState<Student[]>(initialStudents);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    try {
      const urlTab = new URLSearchParams(window.location.search).get("tab")?.toUpperCase();
      if (urlTab === "FINANCE" || urlTab === "COMPETITIONS" || urlTab === "SKILLS" || urlTab === "FAMILY") {
        return urlTab as TabKey;
      }
    } catch {}
    return "OVERVIEW";
  });

  // Certificate Modal state
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [activeCert, setActiveCert] = useState<CertificateData | null>(null);

  // Installments state
  const [paidInstallments, setPaidInstallments] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`mada_paid_installments_${studentId}`);
      return stored ? JSON.parse(stored) : ["inst-dp", "inst-1", "inst-2"];
    } catch {
      return ["inst-dp", "inst-1", "inst-2"];
    }
  });

  // Observations / Coach notes
  const [coachNotes, setCoachNotes] = useState<Array<{ id: string; date: string; coach: string; text: string; tag: string }>>(() => {
    try {
      const stored = localStorage.getItem(`mada_student_notes_${studentId}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: "n-1",
        date: "18 نوفمبر 2026",
        coach: "أ. ميار حسني (معلمة الطفولة المبكرة)",
        text: "متفاعل ومبادر جداً في نشاط الفك والتركيب اليوم، أظهر استكشافاً معرفياً ممتازاً وتواصلاً هادئاً مع زملائه.",
        tag: "تطور معرفي وحركي 🌟",
      },
      {
        id: "n-2",
        date: "12 نوفمبر 2026",
        coach: "أ. ميار حسني",
        text: "التزام رائع بالروتين اليومي وأوقات الوجبات والأنشطة المشتركة. استجاب للتوجيهات بهدوء وسلاسة.",
        tag: "سلوك وروتين 🤝",
      },
      {
        id: "n-3",
        date: "5 نوفمبر 2026",
        coach: "د. هبة سالم (أخصائية المتابعة)",
        text: "استجابة سريعة للأوامر اللفظية وثقة متزايدة بالنفس أثناء التحدث أمام زملائه في حلقة الصباح.",
        tag: "مهارات تواصل 💡",
      },
    ];
  });
  const [newNoteText, setNewNoteText] = useState("");

  // Family & Consumer Accounts linking state
  const [consumerLinks, setConsumerLinks] = useState<ConsumerLinksResponse | null>(null);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linkPhone, setLinkPhone] = useState("");
  const [linkKind, setLinkKind] = useState<"guardian" | "student">("guardian");
  const [linkRelationship, setLinkRelationship] = useState("ولي أمر");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResults, setLookupResults] = useState<ConsumerAccountLookupRecord[] | null>(null);
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [invitationResult, setInvitationResult] = useState<ConsumerInvitationDelivery | null>(null);

  // Edit student modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editParentName, setEditParentName] = useState("");
  const [editParentPhone, setEditParentPhone] = useState("");
  const [editStatus, setEditStatus] = useState<StudentStatus>("active");

  // Load students directory from API
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const branchMap: Record<string, string> = {};
    if (me?.branches) {
      for (const b of me.branches) {
        branchMap[b.id] = b.name === "Main Branch" ? "الفرع الرئيسي" : b.name === "Heliopolis Branch" ? "فرع مصر الجديدة" : b.name;
      }
    }

    apiClient
      .listStudents()
      .then((res) => {
        if (cancelled) return;
        const liveMapped = res.items.map((r) => mapLiveStudent(r, branchMap));
        // Merge with initialStudents ensuring unique IDs
        const combined = [...liveMapped];
        for (const init of initialStudents) {
          if (!combined.some((s) => s.id === init.id)) {
            combined.push(init);
          }
        }
        setStudentsList(combined);
      })
      .catch(() => {
        if (!cancelled) setStudentsList(initialStudents);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [me?.branches]);

  // Current selected student
  const student = useMemo(() => {
    const found = studentsList.find((s) => s.id === studentId || s.id.toLowerCase() === studentId.toLowerCase());
    if (found) return found;
    // Fallback search by tail #0003 or code
    return (
      studentsList.find(
        (s) => s.id.slice(-4).toLowerCase() === studentId.slice(-4).toLowerCase() || s.name.toLowerCase().includes(studentId.toLowerCase())
      ) || studentsList[0] || null
    );
  }, [studentsList, studentId]);

  // Load consumer portal links for this student
  useEffect(() => {
    if (!student?.id) return;
    setLinksLoading(true);
    apiClient
      .studentConsumerLinks(student.id)
      .then((res) => setConsumerLinks(res))
      .catch(() => setConsumerLinks(null))
      .finally(() => setLinksLoading(false));
  }, [student?.id]);

  // Sync edit form when student changes
  useEffect(() => {
    if (student) {
      setEditName(student.name);
      setEditParentName(student.parentName);
      setEditParentPhone(student.parentPhone !== "—" ? student.parentPhone : "");
      setEditStatus(student.status);
    }
  }, [student]);

  // Save paid installments
  const handlePayInstallment = (item: { id: string; name: string; amount: number }) => {
    const updated = [...paidInstallments, item.id];
    setPaidInstallments(updated);
    if (student) {
      try {
        localStorage.setItem(`mada_paid_installments_${student.id}`, JSON.stringify(updated));
      } catch {}
    }
    toast.success(`تم تسجيل سداد (${item.name}) بقيمة ${item.amount.toLocaleString()} ج.م في الخزينة بنجاح!`);
  };

  // Send WhatsApp installment reminder
  const handleSendInstallmentReminder = (instName: string, amount: number, dueDate: string) => {
    if (!student) return;
    let clean = (student.parentPhone || "").replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "2" + clean;
    if (!clean.startsWith("20") && clean.length === 10) clean = "20" + clean;
    const msg = encodeURIComponent(
      `مرحباً ${student.parentName}، تحية طيبة من أكاديمية مدى 🌸\nنود تذكيركم بموعد استحقاق (${instName}) بقيمة ${amount.toLocaleString()} ج.م والمستحق بتاريخ ${dueDate} الخاص بالطالب/ة *${student.name}*.\nيمكنكم السداد عبر الخزينة بالفرع أو عبر التحويل البنكي / إنستاباي. شكراً لثقتكم بنا.`
    );
    window.open(`https://web.whatsapp.com/send?phone=${clean}&text=${msg}`, "_blank");
  };

  // General WhatsApp message
  const handleSendWhatsApp = () => {
    if (!student) return;
    let clean = (student.parentPhone || "").replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "2" + clean;
    if (!clean.startsWith("20") && clean.length === 10) clean = "20" + clean;
    const msg = encodeURIComponent(
      `مرحباً ${student.parentName}، تحية طيبة من أكاديمية مدى بخصوص الطالب المتميز *${student.name}*.\nيسعدنا تواصلكم الدائم معنا لأي استفسار أو متابعة أكاديمية.`
    );
    window.open(`https://web.whatsapp.com/send?phone=${clean}&text=${msg}`, "_blank");
  };

  // Add coach observation note
  const handleAddNote = (e: FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !student) return;
    const newNote = {
      id: `n-${Date.now()}`,
      date: new Date().toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }),
      coach: me?.user?.displayName || "المشرف الأكاديمي",
      text: newNoteText.trim(),
      tag: "متابعة دورية 📝",
    };
    const updated = [newNote, ...coachNotes];
    setCoachNotes(updated);
    try {
      localStorage.setItem(`mada_student_notes_${student.id}`, JSON.stringify(updated));
    } catch {}
    setNewNoteText("");
    toast.success("تمت إضافة ملاحظة المتابعة بنجاح إلى ملف الطالب.");
  };

  // Open Certificate Print Modal
  const handleOpenCertificate = () => {
    if (!student) return;
    const certCode = `MADA-CERT-${(student.branch?.slice(0, 3) || "CAI").toUpperCase()}-2026-${student.id.slice(-4).toUpperCase()}`;
    setActiveCert({
      certificateCode: certCode,
      studentName: student.name,
      courseName: student.course || "الروبوتكس والذكاء الاصطناعي (Advanced Robotics)",
      track: "ROBOTICS",
      branchName: student.branch || "الفرع الرئيسي",
      coachName: "م. أحمد الشناوي",
      directorName: "د. مروان الشريف",
      grade: student.status === "graduated" ? "امتياز مع مرتبة الشرف 🏆" : "امتياز (معدل متقدم)",
      scorePercent: 96,
      hoursCount: 36,
      issueDate: "نوفمبر 2026",
      parentPhone: student.parentPhone,
    });
    setIsCertModalOpen(true);
  };

  // Search accounts for linking
  const handleSearchAccounts = async (e: FormEvent) => {
    e.preventDefault();
    if (!student || !linkPhone.trim()) return;
    setLookupLoading(true);
    setLookupResults(null);
    setInvitationResult(null);
    try {
      const res = await apiClient.searchConsumerAccounts(
        student.id,
        linkPhone.trim(),
        linkKind === "guardian" ? "parent" : "student"
      );
      setLookupResults(res.items);
      if (res.items.length === 0) {
        toast.info("لم يتم العثور على حساب مسجل بهذا الرقم. يمكنك إرسال دعوة انضمام مباشرة.");
      }
    } catch (err: any) {
      toast.error(err?.message || "فشل البحث عن الحساب");
    } finally {
      setLookupLoading(false);
    }
  };

  // Link consumer account
  const handleLinkAccount = async (account: ConsumerAccountLookupRecord) => {
    if (!student) return;
    try {
      if (account.accountType === "student") {
        await apiClient.linkStudentAccount(student.id, account.id);
      } else {
        await apiClient.linkGuardian(student.id, {
          userAccountId: account.id,
          relationship: linkRelationship,
        });
      }
      toast.success(`تم ربط حساب ${account.name || account.maskedPhone} بملف الطالب بنجاح!`);
      const links = await apiClient.studentConsumerLinks(student.id);
      setConsumerLinks(links);
      setLookupResults(null);
      setLinkPhone("");
    } catch (err: any) {
      toast.error(err?.message || "تعذر ربط الحساب");
    }
  };

  // Unlink consumer account
  const handleUnlinkAccount = async (kind: "guardian" | "student", accountId: string) => {
    if (!student) return;
    try {
      if (kind === "student") {
        await apiClient.unlinkStudentAccount(student.id);
      } else {
        await apiClient.unlinkGuardian(student.id, accountId);
      }
      toast.success("تم إلغاء ربط الحساب بنجاح");
      const links = await apiClient.studentConsumerLinks(student.id);
      setConsumerLinks(links);
    } catch (err: any) {
      toast.error(err?.message || "تعذر إلغاء الربط");
    }
  };

  // Invite consumer
  const handleInviteConsumer = async () => {
    if (!student || !linkPhone.trim()) return;
    setInvitationLoading(true);
    try {
      const res = await apiClient.createConsumerInvitation(student.id, {
        phone: linkPhone.trim(),
        accountType: linkKind === "guardian" ? "parent" : "student",
        relationship: linkKind === "guardian" ? linkRelationship : undefined,
      });
      setInvitationResult(res);
      toast.success("تم إصدار رمز الدعوة بنجاح!");
    } catch (err: any) {
      toast.error(err?.message || "تعذر إصدار الدعوة");
    } finally {
      setInvitationLoading(false);
    }
  };

  // Save student edit
  const handleSaveStudentEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!student) return;
    const updated: Student = {
      ...student,
      name: editName.trim() || student.name,
      parentName: editParentName.trim() || student.parentName,
      parentPhone: editParentPhone.trim() || student.parentPhone,
      status: editStatus,
    };
    setStudentsList((prev) => prev.map((s) => (s.id === student.id ? updated : s)));
    setEditModalOpen(false);
    toast.success("تم تحديث بيانات الطالب بنجاح");
  };

  // Quick switcher indexes
  const currentIndex = studentsList.findIndex((s) => s.id === student?.id);
  const prevStudent = currentIndex > 0 ? studentsList[currentIndex - 1] : null;
  const nextStudent = currentIndex >= 0 && currentIndex < studentsList.length - 1 ? studentsList[currentIndex + 1] : null;

  // Installment Schedule definition
  const installmentSchedule = [
    { id: "inst-dp", name: "المقدم السنوي ورسوم حجز المقعد", amount: 5000, dueDate: "1 سبتمبر 2026", receipt: "DP-2026-01" },
    { id: "inst-1", name: "قسط شهر أكتوبر 2026", amount: 1500, dueDate: "1 أكتوبر 2026", receipt: "T-2026-10" },
    { id: "inst-2", name: "قسط شهر نوفمبر 2026", amount: 1500, dueDate: "1 نوفمبر 2026", receipt: "T-2026-11" },
    { id: "inst-3", name: "قسط شهر ديسمبر 2026", amount: 1500, dueDate: "1 ديسمبر 2026", receipt: null },
    { id: "inst-4", name: "قسط شهر يناير 2027", amount: 1500, dueDate: "1 يناير 2027", receipt: null },
    { id: "inst-5", name: "قسط شهر فبراير 2027", amount: 1500, dueDate: "1 فبراير 2027", receipt: null },
    { id: "inst-6", name: "قسط شهر مارس 2027", amount: 1500, dueDate: "1 مارس 2027", receipt: null },
    { id: "inst-7", name: "قسط شهر أبريل 2027", amount: 1500, dueDate: "1 أبريل 2027", receipt: null },
  ];

  const totalPlanAmount = installmentSchedule.reduce((sum, item) => sum + item.amount, 0);
  const collectedPlanAmount = installmentSchedule
    .filter((item) => paidInstallments.includes(item.id))
    .reduce((sum, item) => sum + item.amount, 0);
  const remainingPlanAmount = totalPlanAmount - collectedPlanAmount;

  if (loading && !student) {
    return (
      <div className="layout-shell">
        <RoleSidebar />
        <main className="content-area" dir="rtl">
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            جارٍ تحميل ملف الطالب الموحد…
          </div>
        </main>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="layout-shell">
        <RoleSidebar />
        <main className="content-area" dir="rtl">
          <div style={{ padding: "40px", textAlign: "center" }}>
            <h2>لم يتم العثور على الطالب</h2>
            <p>قد يكون الطالب غير موجود أو لا يقع ضمن نطاق صلاحيات حسابك.</p>
            <button className="primary-action-btn btn-teal-theme" onClick={() => navigate("/students")}>
              العودة لقائمة الطلاب
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="layout-shell">
      <RoleSidebar />

      <main className="content-area" dir="rtl">
        <div className="student-profile-page">
          {/* Top Navigation & Breadcrumbs */}
          <div className="student-profile-nav">
            <div className="student-profile-breadcrumbs">
              <button type="button" onClick={() => navigate("/students")}>
                <ArrowRight size={16} /> قائمة ودليل الطلاب
              </button>
              <span>/</span>
              <span>الملف الأكاديمي والمالي الشامل</span>
              <span>/</span>
              <strong>{student.name}</strong>
            </div>

            {/* Quick Student Switcher & Roster Navigation */}
            <div className="student-profile-switcher">
              <button
                type="button"
                className="student-switcher-btn"
                disabled={!prevStudent}
                onClick={() => prevStudent && navigate(`/students/${prevStudent.id}`)}
                title={prevStudent ? `السابق: ${prevStudent.name}` : "لا يوجد سابق"}
              >
                <ChevronRight size={15} /> السابق
              </button>

              <select
                className="student-switcher-select"
                value={student.id}
                onChange={(e) => navigate(`/students/${e.target.value}`)}
                aria-label="الانتقال السريع لطالب آخر"
              >
                {studentsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.branch}) - #{s.id.slice(-4).toUpperCase()}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="student-switcher-btn"
                disabled={!nextStudent}
                onClick={() => nextStudent && navigate(`/students/${nextStudent.id}`)}
                title={nextStudent ? `التالي: ${nextStudent.name}` : "لا يوجد تالي"}
              >
                التالي <ChevronLeft size={15} />
              </button>
            </div>
          </div>

          {/* Hero Profile Header Card */}
          <div className="student-profile-hero">
            <div className="student-profile-hero-top">
              <div className="student-profile-identity">
                <div className={`student-profile-avatar avatar-${student.color}`}>{student.initials}</div>
                <div className="student-profile-titles">
                  <div className="student-profile-title-row">
                    <h1>{student.name}</h1>
                    <span className="student-code-pill">#{student.id.slice(-4).toUpperCase()}</span>
                    <span className={`profile-badge badge-${student.status}`}>
                      <i /> {statusLabels[student.status]}
                    </span>
                  </div>
                  <div className="student-profile-badges-row">
                    <span className="profile-badge badge-branch">
                      <MapPin size={12} /> {student.branch}
                    </span>
                    <span className="profile-badge badge-course">
                      <BookOpen size={12} /> {student.course}
                    </span>
                    {student.birthDate && student.birthDate !== "—" && (
                      <span className="profile-badge badge-age">
                        <Calendar size={12} /> {student.birthDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Guardian Info Card */}
              <div className="student-profile-guardian-box">
                <div className="guardian-details">
                  <span>ولي الأمر المسؤول:</span>
                  <strong>
                    {student.parentName} ({student.relation})
                  </strong>
                  <span className="guardian-phone" dir="ltr">
                    {student.parentPhone}
                  </span>
                </div>
                <div className="guardian-actions">
                  {student.parentPhone && student.parentPhone !== "—" && (
                    <>
                      <button
                        type="button"
                        className="guardian-action-btn btn-whatsapp"
                        onClick={handleSendWhatsApp}
                        title="مراسلة واتساب فورية"
                      >
                        <MessageCircle size={18} />
                      </button>
                      <a
                        href={`tel:${student.parentPhone}`}
                        className="guardian-action-btn btn-call"
                        title="اتصال هاتفي مباشر"
                      >
                        <Phone size={16} />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics KPI Grid */}
            <div className="student-profile-kpis">
              <div className="student-kpi-card">
                <div className="kpi-icon-wrap icon-attendance">
                  <Clock size={22} />
                </div>
                <div className="kpi-content">
                  <label>نسبة الانتظام والحضور</label>
                  <strong>94% منتظم</strong>
                  <small>15 من أصل 16 جلسة مسجلة</small>
                </div>
              </div>

              <div className="student-kpi-card">
                <div className="kpi-icon-wrap icon-finance">
                  <CreditCard size={22} />
                </div>
                <div className="kpi-content">
                  <label>الموقف المالي والأقساط</label>
                  <strong>{collectedPlanAmount.toLocaleString()} ج.م مسدد</strong>
                  <small style={{ color: remainingPlanAmount > 0 ? "#b45309" : "#059669" }}>
                    المتبقي: {remainingPlanAmount.toLocaleString()} ج.م
                  </small>
                </div>
              </div>

              <div className="student-kpi-card">
                <div className="kpi-icon-wrap icon-academic">
                  <GraduationCap size={22} />
                </div>
                <div className="kpi-content">
                  <label>المستوى الأكاديمي والمسار</label>
                  <strong>المستوى المتقدم 🚀</strong>
                  <small>مؤهل لاختبار التصفيات القادمة</small>
                </div>
              </div>

              <div className="student-kpi-card">
                <div className="kpi-icon-wrap icon-trophy">
                  <Trophy size={22} />
                </div>
                <div className="kpi-content">
                  <label>الأوسمة والجوائز المعتمدة</label>
                  <strong>3 أوسمة موثقة 🏆</strong>
                  <small>مبتكر الأسبوع · الحضور المتميز</small>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Operations Action Bar */}
          <div className="student-profile-actions-bar">
            <div className="action-buttons-group">
              <button type="button" className="primary-action-btn btn-whatsapp-theme" onClick={handleSendWhatsApp}>
                <MessageCircle size={16} /> مراسلة واتساب
              </button>
              {student.parentPhone && student.parentPhone !== "—" && (
                <a href={`tel:${student.parentPhone}`} className="primary-action-btn btn-secondary-theme">
                  <Phone size={15} /> اتصال هاتف
                </a>
              )}
              <button
                type="button"
                className="primary-action-btn btn-teal-theme"
                onClick={() => setActiveTab("FINANCE")}
              >
                <CreditCard size={15} /> تحصيل قسط / دفعة
              </button>
              <button
                type="button"
                className="primary-action-btn btn-secondary-theme"
                onClick={handleOpenCertificate}
              >
                <Award size={15} /> إصدار شهادة معتمدة
              </button>
              <button
                type="button"
                className="primary-action-btn btn-secondary-theme"
                onClick={() => window.print()}
              >
                <Printer size={15} /> طباعة السجل الكامل (A4)
              </button>
            </div>

            <div className="action-buttons-group">
              <button
                type="button"
                className="primary-action-btn btn-secondary-theme"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit size={14} /> تعديل البيانات
              </button>
              <button
                type="button"
                className="primary-action-btn btn-secondary-theme"
                onClick={() => setActiveTab("FAMILY")}
              >
                <Users size={14} /> ربط حساب الأسرة
              </button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="student-profile-tabs">
            <button
              type="button"
              className={`student-profile-tab-btn ${activeTab === "OVERVIEW" ? "active" : ""}`}
              onClick={() => setActiveTab("OVERVIEW")}
            >
              <BookOpen size={16} /> مسار التعلم والحضور
            </button>
            <button
              type="button"
              className={`student-profile-tab-btn ${activeTab === "FINANCE" ? "active" : ""}`}
              onClick={() => setActiveTab("FINANCE")}
            >
              <Receipt size={16} /> السجل المالي والأقساط ({remainingPlanAmount > 0 ? "مستحق" : "خالص"})
            </button>
            <button
              type="button"
              className={`student-profile-tab-btn ${activeTab === "COMPETITIONS" ? "active" : ""}`}
              onClick={() => setActiveTab("COMPETITIONS")}
            >
              <Trophy size={16} /> المسابقات والمشاريع الموثقة
            </button>
            <button
              type="button"
              className={`student-profile-tab-btn ${activeTab === "SKILLS" ? "active" : ""}`}
              onClick={() => setActiveTab("SKILLS")}
            >
              <Sparkles size={16} /> التقييمات والمهارات
            </button>
            <button
              type="button"
              className={`student-profile-tab-btn ${activeTab === "FAMILY" ? "active" : ""}`}
              onClick={() => setActiveTab("FAMILY")}
            >
              <Users size={16} /> حسابات الأسرة والبوابة (
              {consumerLinks?.guardians?.length ? `${consumerLinks.guardians.length} مرتبط` : "غير مرتبط"}
              )
            </button>
          </div>

          {/* TAB 1: مسار التعلم والحضور */}
          {activeTab === "OVERVIEW" && (
            <div className="student-tab-panel">
              <div className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-title">
                    <BookOpen size={18} /> تفاصيل المجموعة والجدول التدريبي
                  </div>
                  <span className="profile-badge badge-active">مجموعة نشطة ومستمرة</span>
                </div>

                <div className="profile-data-table-wrap">
                  <table className="profile-data-table">
                    <thead>
                      <tr>
                        <th>الكورس / المسار</th>
                        <th>المجموعة التدريبية</th>
                        <th>المدرب المعتمد</th>
                        <th>القاعة والفرع</th>
                        <th>الموعد الأسبوعي</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>{student.course}</strong>
                        </td>
                        <td>مجموعة الأبطال (Robo-A2)</td>
                        <td>م. عمر سامح</td>
                        <td>قاعة الابتكار 1 · {student.branch}</td>
                        <td>السبت والثلاثاء (05:00 م - 07:00 م)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attendance & Session Timeline */}
              <div className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-title">
                    <Clock size={18} /> سجل حضور الجلسات وملاحظات المدربين
                  </div>
                  <span style={{ fontSize: "0.8125rem", color: "#0f766e", fontWeight: 700 }}>
                    نسبة الانتظام: 94%
                  </span>
                </div>

                <div className="profile-data-table-wrap">
                  <table className="profile-data-table">
                    <thead>
                      <tr>
                        <th>الجلسة</th>
                        <th>التاريخ</th>
                        <th>الموضوع التدريبي</th>
                        <th>حالة الحضور</th>
                        <th>تقييم الأداء</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>الجلسة 12</td>
                        <td>21 نوفمبر 2026</td>
                        <td>بناء حساس الموجات الصوتية ومستشعر المسافات</td>
                        <td>
                          <span style={{ color: "#059669", fontWeight: 700 }}>✓ حاضر بالموعد</span>
                        </td>
                        <td>98 / 100 ⭐ ممتاز</td>
                      </tr>
                      <tr>
                        <td>الجلسة 11</td>
                        <td>14 نوفمبر 2026</td>
                        <td>التحكم بالمحركات وبرمجة المسار التلقائي</td>
                        <td>
                          <span style={{ color: "#059669", fontWeight: 700 }}>✓ حاضر بالموعد</span>
                        </td>
                        <td>95 / 100 ⭐ ممتاز</td>
                      </tr>
                      <tr>
                        <td>الجلسة 10</td>
                        <td>7 نوفمبر 2026</td>
                        <td>مراجعة الحلقات التكرارية والمنطق البرمجي</td>
                        <td>
                          <span style={{ color: "#d97706", fontWeight: 700 }}>⏱️ متأخر (10 دقائق)</span>
                        </td>
                        <td>90 / 100 ⭐ جيد جداً</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Coach Observations Feed */}
              <div className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-title">
                    <Sparkles size={18} /> ملاحظات المتابعة والتطور السلوكي والمعرفي
                  </div>
                </div>

                <form onSubmit={handleAddNote} style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="أضف ملاحظة أو تقرير تطور جديد عن الطالب…"
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.875rem",
                    }}
                  />
                  <button type="submit" className="primary-action-btn btn-teal-theme">
                    <Plus size={16} /> إضافة ملاحظة
                  </button>
                </form>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {coachNotes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        padding: "14px",
                        background: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 800, fontSize: "0.875rem", color: "#1e293b" }}>
                          {note.coach}
                        </span>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "0.75rem", background: "#f0fdfa", color: "#0f766e", padding: "2px 8px", borderRadius: "99px", fontWeight: 700 }}>
                            {note.tag}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{note.date}</span>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.84rem", color: "#475569", lineHeight: 1.6 }}>{note.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: السجل المالي والأقساط */}
          {activeTab === "FINANCE" && (
            <div className="student-tab-panel">
              {/* Financial Summary */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "14px",
                }}
              >
                <div style={{ padding: "18px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>إجمالي خطة الرسوم السنوية</span>
                  <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f172a", marginTop: "4px" }}>
                    {totalPlanAmount.toLocaleString()} ج.م
                  </div>
                  <small style={{ color: "#64748b" }}>المقدم + 7 أقساط</small>
                </div>

                <div style={{ padding: "18px", background: "#f0fdf4", borderRadius: "16px", border: "1px solid #bbf7d0" }}>
                  <span style={{ fontSize: "0.8125rem", color: "#166534" }}>المسدد فعلياً بالخزينة</span>
                  <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#15803d", marginTop: "4px" }}>
                    {collectedPlanAmount.toLocaleString()} ج.م
                  </div>
                  <small style={{ color: "#166534" }}>{paidInstallments.length} دفعات مسددة بنجاح</small>
                </div>

                <div
                  style={{
                    padding: "18px",
                    background: remainingPlanAmount > 0 ? "#fffbeb" : "#f8fafc",
                    borderRadius: "16px",
                    border: remainingPlanAmount > 0 ? "1px solid #fde68a" : "1px solid #e2e8f0",
                  }}
                >
                  <span style={{ fontSize: "0.8125rem", color: remainingPlanAmount > 0 ? "#b45309" : "#64748b" }}>
                    المتبقي المستحق
                  </span>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 900,
                      color: remainingPlanAmount > 0 ? "#b45309" : "#0f172a",
                      marginTop: "4px",
                    }}
                  >
                    {remainingPlanAmount.toLocaleString()} ج.م
                  </div>
                  <small style={{ color: remainingPlanAmount > 0 ? "#b45309" : "#64748b" }}>
                    {remainingPlanAmount > 0 ? "أقساط قادمة" : "تم سداد كافة الرسوم"}
                  </small>
                </div>
              </div>

              {/* Installments Breakdown Card */}
              <div className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-title">
                    <Receipt size={18} /> جدول استحقاق وسداد الأقساط الشهرية (2026 - 2027)
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    سندات قبض معتمدة وتنبيهات فورية عبر الواتساب
                  </span>
                </div>

                <div className="installments-grid">
                  {installmentSchedule.map((inst) => {
                    const isPaid = paidInstallments.includes(inst.id);
                    return (
                      <div
                        key={inst.id}
                        className={`installment-row-item ${isPaid ? "paid" : "unpaid"}`}
                      >
                        <div className="installment-info">
                          <div>
                            <div className="installment-name">{inst.name}</div>
                            <div className="installment-due">تاريخ الاستحقاق: {inst.dueDate}</div>
                          </div>
                        </div>

                        <div className="installment-amount-block">
                          <div style={{ textAlign: "left" }}>
                            <div className="installment-amount">{inst.amount.toLocaleString()} ج.م</div>
                            {isPaid ? (
                              <span style={{ fontSize: "0.75rem", color: "#15803d", fontWeight: 700 }}>
                                ✓ مسدد بالخزينة {inst.receipt ? `· إيصال #${inst.receipt}` : ""}
                              </span>
                            ) : (
                              <span style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 700 }}>
                                ⏳ مستحق السداد
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", gap: "8px" }}>
                            {!isPaid && (
                              <>
                                <button
                                  type="button"
                                  className="primary-action-btn btn-teal-theme"
                                  onClick={() => handlePayInstallment(inst)}
                                  style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                                >
                                  <CreditCard size={13} /> سداد الآن
                                </button>
                                <button
                                  type="button"
                                  className="primary-action-btn btn-whatsapp-theme"
                                  onClick={() => handleSendInstallmentReminder(inst.name, inst.amount, inst.dueDate)}
                                  style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                                >
                                  <MessageCircle size={13} /> تذكير واتساب
                                </button>
                              </>
                            )}
                            {isPaid && (
                              <button
                                type="button"
                                className="primary-action-btn btn-secondary-theme"
                                onClick={() => toast.info(`طباعة إيصال السند ${inst.name}`)}
                                style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                              >
                                <Printer size={13} /> طباعة إيصال
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: المسابقات والمشاريع الموثقة */}
          {activeTab === "COMPETITIONS" && (
            <div className="student-tab-panel">
              {/* Badges & Medals */}
              <div className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-title">
                    <Trophy size={18} /> الأوسمة والجوائز المعتمدة للطالب
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
                  <div style={{ padding: "16px", background: "#f0fdfa", borderRadius: "14px", border: "1px solid #ccfbf1", display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ fontSize: "2rem" }}>⭐</div>
                    <div>
                      <strong style={{ display: "block", color: "#0f766e", fontSize: "0.9375rem" }}>وسام الحضور المتميز</strong>
                      <small style={{ color: "#64748b" }}>انتظام تام بالجلسات الأسبوعية بدون غياب</small>
                    </div>
                  </div>

                  <div style={{ padding: "16px", background: "#fffbeb", borderRadius: "14px", border: "1px solid #fef3c7", display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ fontSize: "2rem" }}>🏆</div>
                    <div>
                      <strong style={{ display: "block", color: "#b45309", fontSize: "0.9375rem" }}>بطل تحدي الروبوت الذكي</strong>
                      <small style={{ color: "#64748b" }}>المركز الثاني في مسابقة الأكاديمية الشتوية</small>
                    </div>
                  </div>

                  <div style={{ padding: "16px", background: "#eff6ff", borderRadius: "14px", border: "1px solid #dbeafe", display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ fontSize: "2rem" }}>💡</div>
                    <div>
                      <strong style={{ display: "block", color: "#1d4ed8", fontSize: "0.9375rem" }}>مبتكر الأسبوع</strong>
                      <small style={{ color: "#64748b" }}>تصميم نظام إنذار منزلي باستخدام الحساسات</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects Portfolio */}
              <div className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-title">
                    <Award size={18} /> محفظة المشاريع البرمجية والهندسية المنفذة
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
                  <div style={{ padding: "18px", background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "0.75rem", background: "#f1f5f9", padding: "2px 8px", borderRadius: "6px", fontWeight: 700 }}>Arduino & C++</span>
                      <span style={{ fontSize: "0.8125rem", color: "#059669", fontWeight: 800 }}>التقييم: 98/100</span>
                    </div>
                    <strong style={{ fontSize: "1rem", color: "#0f172a", display: "block", marginBottom: "6px" }}>
                      مشروع السيارة متتبعة المسار (Line Follower Robot)
                    </strong>
                    <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "0 0 12px 0", lineHeight: 1.5 }}>
                      روبوت ذاتي القيادة يعتمد على حساسات الأشعة تحت الحمراء لتتبع مسار مرسوم بدقة وسرعة قابلة للتعديل برمجياً.
                    </p>
                    <button type="button" className="primary-action-btn btn-secondary-theme" style={{ width: "100%", justifyContent: "center" }}>
                      <ExternalLink size={14} /> استعراض التوثيق والملف
                    </button>
                  </div>

                  <div style={{ padding: "18px", background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "0.75rem", background: "#f1f5f9", padding: "2px 8px", borderRadius: "6px", fontWeight: 700 }}>Python Game</span>
                      <span style={{ fontSize: "0.8125rem", color: "#059669", fontWeight: 800 }}>التقييم: 94/100</span>
                    </div>
                    <strong style={{ fontSize: "1rem", color: "#0f172a", display: "block", marginBottom: "6px" }}>
                      لعبة المتاهة الذكية (Space Maze Navigator)
                    </strong>
                    <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "0 0 12px 0", lineHeight: 1.5 }}>
                      تطبيق بلغة بايثون ومكتبة Pygame يحاكي حركة مركبة فضائية لتفادي العقبات وجمع النقاط وتوليد مستويات صعوبة.
                    </p>
                    <button type="button" className="primary-action-btn btn-secondary-theme" style={{ width: "100%", justifyContent: "center" }}>
                      <ExternalLink size={14} /> استعراض التوثيق والملف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: التقييمات والمهارات */}
          {activeTab === "SKILLS" && (
            <div className="student-tab-panel">
              <div className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-title">
                    <Sparkles size={18} /> مصفوفة المهارات التقنية والوجدانية
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                  <div className="skill-item-bar">
                    <div className="skill-header">
                      <span>التفكير المنطقي والخوارزميات</span>
                      <span>95%</span>
                    </div>
                    <div className="skill-track-bar">
                      <div className="skill-fill-bar" style={{ width: "95%" }} />
                    </div>
                  </div>

                  <div className="skill-item-bar">
                    <div className="skill-header">
                      <span>مهارات حل المشكلات (Troubleshooting)</span>
                      <span>90%</span>
                    </div>
                    <div className="skill-track-bar">
                      <div className="skill-fill-bar" style={{ width: "90%" }} />
                    </div>
                  </div>

                  <div className="skill-item-bar">
                    <div className="skill-header">
                      <span>العمل الجماعي وروح الفريق</span>
                      <span>92%</span>
                    </div>
                    <div className="skill-track-bar">
                      <div className="skill-fill-bar" style={{ width: "92%" }} />
                    </div>
                  </div>

                  <div className="skill-item-bar">
                    <div className="skill-header">
                      <span>الإبداع والابتكار في التصميم</span>
                      <span>88%</span>
                    </div>
                    <div className="skill-track-bar">
                      <div className="skill-fill-bar" style={{ width: "88%" }} />
                    </div>
                  </div>

                  <div className="skill-item-bar">
                    <div className="skill-header">
                      <span>الانضباط والالتزام بالوقت</span>
                      <span>96%</span>
                    </div>
                    <div className="skill-track-bar">
                      <div className="skill-fill-bar" style={{ width: "96%" }} />
                    </div>
                  </div>

                  <div className="skill-item-bar">
                    <div className="skill-header">
                      <span>عرض وتقديم المشاريع (Presentation)</span>
                      <span>85%</span>
                    </div>
                    <div className="skill-track-bar">
                      <div className="skill-fill-bar" style={{ width: "85%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: حسابات الأسرة وبوابة ولي الأمر */}
          {activeTab === "FAMILY" && (
            <div className="student-tab-panel">
              <div className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-title">
                    <Users size={18} /> حسابات ولي الأمر المرتبطة ببوابة الأسرة
                  </div>
                </div>

                <div className="linked-accounts-container">
                  {linksLoading ? (
                    <div style={{ color: "#64748b", padding: "12px" }}>جارٍ تحميل حسابات ولي الأمر…</div>
                  ) : consumerLinks?.guardians && consumerLinks.guardians.length > 0 ? (
                    consumerLinks.guardians.map((g) => (
                      <div key={g.id} className="linked-account-card">
                        <div className="account-card-left">
                          <div className="account-avatar">
                            <User size={20} />
                          </div>
                          <div>
                            <strong style={{ display: "block", fontSize: "0.9375rem" }}>{g.name || "ولي أمر"}</strong>
                            <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                              {g.relationship || "ولي أمر"} · <b dir="ltr">{g.phone}</b>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="unlink-btn"
                          onClick={() => handleUnlinkAccount("guardian", g.id)}
                        >
                          <Trash2 size={13} /> إلغاء الربط
                        </button>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: "16px",
                        background: "#fffbeb",
                        borderRadius: "12px",
                        border: "1px solid #fde68a",
                        color: "#b45309",
                        fontSize: "0.875rem",
                      }}
                    >
                      لا يوجد حساب ولي أمر مرتبط حالياً عبر البوابة. يمكنك البحث برقم الهاتف وربط الحساب أدناه.
                    </div>
                  )}
                </div>
              </div>

              {/* Search & Link Guardian Account */}
              <div className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-title">
                    <UserPlus size={18} /> ربط حساب جديد برقم الهاتف (بوابة ولي الأمر)
                  </div>
                </div>

                <form onSubmit={handleSearchAccounts} className="account-search-form">
                  <div className="form-group">
                    <label>رقم هاتف ولي الأمر (أو الطالب)</label>
                    <input
                      type="tel"
                      value={linkPhone}
                      onChange={(e) => setLinkPhone(e.target.value)}
                      placeholder="01012345678 أو +201012345678"
                      dir="ltr"
                    />
                  </div>

                  <div className="form-group">
                    <label>نوع الحساب</label>
                    <select
                      value={linkKind}
                      onChange={(e) => setLinkKind(e.target.value as "guardian" | "student")}
                    >
                      <option value="guardian">حساب ولي أمر</option>
                      <option value="student">حساب طالب</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>صلة القرابة</label>
                    <select value={linkRelationship} onChange={(e) => setLinkRelationship(e.target.value)}>
                      <option value="الأب">الأب</option>
                      <option value="الأم">الأم</option>
                      <option value="ولي أمر">ولي أمر</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>

                  <button type="submit" className="primary-action-btn btn-teal-theme" disabled={lookupLoading}>
                    <Search size={14} /> {lookupLoading ? "جارٍ البحث…" : "بحث عن الحساب"}
                  </button>
                </form>

                {/* Lookup Results */}
                {lookupResults !== null && (
                  <div style={{ marginTop: "14px" }}>
                    {lookupResults.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0f766e" }}>
                          ✓ تم العثور على {lookupResults.length} حساب مطابق:
                        </span>
                        {lookupResults.map((acc) => (
                          <div
                            key={acc.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "12px 16px",
                              background: "#f0fdfa",
                              borderRadius: "12px",
                              border: "1px solid #ccfbf1",
                            }}
                          >
                            <div>
                              <strong>{acc.name || "مستخدم مسجل"}</strong>
                              <div style={{ fontSize: "0.8125rem", color: "#64748b" }} dir="ltr">
                                {acc.maskedPhone} · {acc.accountType === "parent" ? "ولي أمر" : "طالب"}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="primary-action-btn btn-teal-theme"
                              onClick={() => handleLinkAccount(acc)}
                            >
                              <Check size={14} /> ربط هذا الحساب الآن
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "16px",
                          background: "#f8fafc",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <strong style={{ display: "block", color: "#0f172a" }}>
                            لم يتم العثور على حساب مسجل برقم ({linkPhone})
                          </strong>
                          <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                            يمكنك إرسال دعوة فورية لتفعيل حساب ولي الأمر على البوابة برابط مباشر.
                          </span>
                        </div>
                        <button
                          type="button"
                          className="primary-action-btn btn-teal-theme"
                          onClick={handleInviteConsumer}
                          disabled={invitationLoading}
                        >
                          <Send size={14} /> {invitationLoading ? "جارٍ الإرسال…" : "إرسال دعوة الآن"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Invitation Result Output */}
                {invitationResult && (
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "14px",
                      background: "#ecfdf5",
                      borderRadius: "12px",
                      border: "1px solid #a7f3d0",
                      color: "#065f46",
                    }}
                  >
                    <strong>✓ تم توليد رابط الدعوة بنجاح:</strong>
                    <div style={{ fontSize: "0.8125rem", marginTop: "4px" }}>
                      رمز التحقق المؤقت: <b>{invitationResult.developmentCode || "تم إرسال كود التحقق في رسالة"}</b> · الوجهة: {invitationResult.maskedPhone}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Certificate Print Modal */}
        {isCertModalOpen && activeCert && (
          <StudentCertificatePrintModal
            isOpen={isCertModalOpen}
            certificate={activeCert}
            onClose={() => setIsCertModalOpen(false)}
          />
        )}

        {/* Edit Student Modal */}
        {editModalOpen && (
          <div
            className="student-hub-backdrop"
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) setEditModalOpen(false);
            }}
          >
            <div className="student-hub-card" style={{ maxWidth: "540px" }} role="dialog">
              <div className="student-hub-header">
                <h3>تعديل بيانات الطالب #{student.id.slice(-4).toUpperCase()}</h3>
                <button type="button" className="student-hub-close-btn" onClick={() => setEditModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveStudentEdit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="form-group">
                  <label>اسم الطالب الكامل</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>اسم ولي الأمر</label>
                  <input type="text" value={editParentName} onChange={(e) => setEditParentName(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>رقم هاتف ولي الأمر</label>
                  <input type="tel" value={editParentPhone} onChange={(e) => setEditParentPhone(e.target.value)} dir="ltr" />
                </div>

                <div className="form-group">
                  <label>حالة القيد والانتظام</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as StudentStatus)}>
                    <option value="active">نشط ومقيد</option>
                    <option value="on_hold">معلق (Holding) / انتظار</option>
                    <option value="graduated">متخرج</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                  <button type="button" className="primary-action-btn btn-secondary-theme" onClick={() => setEditModalOpen(false)}>
                    إلغاء
                  </button>
                  <button type="submit" className="primary-action-btn btn-teal-theme">
                    حفظ التعديلات
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <FloatingLanguageToggle />
    </div>
  );
}
