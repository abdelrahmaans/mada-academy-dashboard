import React, { useState } from "react";
import {
  X,
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
} from "lucide-react";
import { toast } from "sonner";
import type { Student } from "@/pages/StudentsTypes";
import type { Invoice } from "@/pages/FinanceDeskTypes";
import { InvoiceDetailsModal } from "@/components/finance/InvoiceDetailsModal";
import {
  StudentCertificatePrintModal,
  type CertificateData,
} from "@/components/certificates/StudentCertificatePrintModal";
import "./StudentDataHubModal.css";

interface Props {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onRecordPayment?: (studentId: string) => void;
  onCreateInvoice?: (studentId: string) => void;
  onEnrollGroup?: (studentId: string) => void;
}

type HubTab = "OVERVIEW" | "FINANCE" | "COMPETITIONS" | "SKILLS";

export function StudentDataHubModal({
  isOpen,
  student,
  onClose,
  onRecordPayment,
  onCreateInvoice,
  onEnrollGroup,
}: Props) {
  const [activeTab, setActiveTab] = useState<HubTab>("OVERVIEW");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [activeCert, setActiveCert] = useState<CertificateData | null>(null);
  const [installmentPlan, setInstallmentPlan] = useState<"annual_nursery" | "annual_diploma">("annual_nursery");
  const [paidInstallments, setPaidInstallments] = useState<string[]>(["inst-dp", "inst-1", "inst-2"]);
  const [childNotes, setChildNotes] = useState<Array<{ id: string; date: string; coach: string; text: string; tag: string }>>([
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
      text: "استجابة سريعة للأوامر اللفظية وثقة متزايدة بالنفس أثناء التحدث أمام زملائه في حلقة الصباح واستعراض أعماله.",
      tag: "مهارات تواصل 💡",
    },
  ]);
  const [newNoteInput, setNewNoteInput] = useState("");

  const nurseryInstallmentsSchedule = [
    { id: "inst-dp", name: "المقدم السنوي ورسوم حجز المقعد", amount: 5000, dueDate: "1 سبتمبر 2026", isDownPayment: true },
    { id: "inst-1", name: "قسط شهر أكتوبر 2026", amount: 1500, dueDate: "1 أكتوبر 2026" },
    { id: "inst-2", name: "قسط شهر نوفمبر 2026", amount: 1500, dueDate: "1 نوفمبر 2026" },
    { id: "inst-3", name: "قسط شهر ديسمبر 2026", amount: 1500, dueDate: "1 ديسمبر 2026" },
    { id: "inst-4", name: "قسط شهر يناير 2027", amount: 1500, dueDate: "1 يناير 2027" },
    { id: "inst-5", name: "قسط شهر فبراير 2027", amount: 1500, dueDate: "1 فبراير 2027" },
    { id: "inst-6", name: "قسط شهر مارس 2027", amount: 1500, dueDate: "1 مارس 2027" },
    { id: "inst-7", name: "قسط شهر أبريل 2027", amount: 1500, dueDate: "1 أبريل 2027" },
    { id: "inst-8", name: "قسط شهر مايو 2027", amount: 1500, dueDate: "1 مايو 2027" },
    { id: "inst-9", name: "قسط شهر يونيو 2027", amount: 1500, dueDate: "1 يونيو 2027" },
    { id: "inst-10", name: "قسط شهر يوليو 2027", amount: 1500, dueDate: "1 يوليو 2027" },
    { id: "inst-11", name: "قسط شهر أغسطس 2027", amount: 1500, dueDate: "1 أغسطس 2027" },
  ];

  const totalPlanAmount = nurseryInstallmentsSchedule.reduce((sum, item) => sum + item.amount, 0); // 21,500 ج.م
  const collectedPlanAmount = nurseryInstallmentsSchedule
    .filter(item => paidInstallments.includes(item.id))
    .reduce((sum, item) => sum + item.amount, 0);
  const remainingPlanAmount = totalPlanAmount - collectedPlanAmount;

  const handlePayInstallment = (item: { id: string; name: string; amount: number }) => {
    setPaidInstallments(prev => [...prev, item.id]);
    toast.success(`تم تسجيل سداد (${item.name}) بقيمة ${item.amount.toLocaleString()} ج.م في الخزينة بنجاح!`);
  };

  const handleSendInstallmentReminder = (instName: string, amount: number, dueDate: string) => {
    let clean = (student?.parentPhone || "").replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "2" + clean;
    if (!clean.startsWith("20") && clean.length === 10) clean = "20" + clean;
    const msg = encodeURIComponent(
      `مرحباً ${student?.parentName}، تحية طيبة من أكاديمية مدى 🌸\nنود تذكيركم بموعد استحقاق (${instName}) بقيمة ${amount.toLocaleString()} ج.م والمستحق بتاريخ ${dueDate} الخاص بالطالب/ة *${student?.name}*.\nيمكنكم السداد عبر الخزينة بالفرع أو عبر إنستاباي. شكراً لتعاونكم وثقتكم بنا.`
    );
    window.open(`https://web.whatsapp.com/send?phone=${clean}&text=${msg}`, "_blank");
  };

  if (!isOpen || !student) return null;

  // Mock / Derived financial records for the student
  const studentInvoices: Invoice[] = [
    {
      id: `INV-${student.id.slice(-4)}`,
      number: `MAD-${student.branch?.slice(0, 3) || "CAI"}-2026-${student.id.slice(-4).toUpperCase()}`,
      student: student.name,
      parent: student.parentName,
      branch: student.branch,
      course: student.course,
      total: 4800,
      collected: student.status === "active" ? 4800 : 2400,
      due: "28 نوفمبر 2026",
      status: student.status === "active" ? "paid" : "partial",
      payments: [
        {
          id: `p-${student.id}-1`,
          invoiceId: `INV-${student.id.slice(-4)}`,
          amountPiastres: student.status === "active" ? 480000 : 240000,
          method: "INSTAPAY",
          receivedOn: "2026-10-15",
          externalReference: "INSTA-887412",
          note: "قسط اشتراك معتمد",
          createdAt: "2026-10-15T12:00:00Z",
          evidenceStatus: "ATTACHED",
          evidenceFileName: "instapay_receipt.jpg",
        },
      ],
    },
  ];

  const handleSendWhatsApp = () => {
    let clean = (student.parentPhone || "").replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "2" + clean;
    if (!clean.startsWith("20") && clean.length === 10) clean = "20" + clean;
    const msg = encodeURIComponent(
      `مرحباً ${student.parentName}، تحية طيبة من أكاديمية مدى للروبوتكس والذكاء الاصطناعي بخصوص الطالب البطل *${student.name}*. يسعدنا تواصلكم الدائم معنا.`
    );
    window.open(`https://web.whatsapp.com/send?phone=${clean}&text=${msg}`, "_blank");
  };

  const handleOpenCertificate = () => {
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

  const handlePrintStudentCard = () => {
    window.print();
  };

  return (
    <>
      <div
        className="student-hub-backdrop"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="student-hub-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-hub-name"
        >
          {/* Header */}
          <div className="student-hub-header">
            <div className="student-hub-profile-row">
              <div className={`student-hub-avatar avatar-${student.color}`}>
                {student.initials}
              </div>
              <div>
                <div className="student-hub-name-row">
                  <h3 id="student-hub-name">{student.name}</h3>
                  <span className={`student-hub-status-badge status-${student.status}`}>
                    {student.status === "active"
                      ? "منتظم ونشط ✓"
                      : student.status === "on_hold"
                      ? "مجمد مؤقتاً"
                      : student.status === "graduated"
                      ? "خريج معتمد 🎓"
                      : "طالب جديد / استفسار"}
                  </span>
                  <span className="student-hub-code-badge">
                    #{student.id.slice(-4).toUpperCase()}
                  </span>
                </div>
                <p className="student-hub-sub">
                  ولي الأمر: <strong>{student.parentName}</strong> ({student.relation}) · الفرع:{" "}
                  <strong>{student.branch}</strong> · تاريخ التسجيل: {student.joined || "أكتوبر 2026"}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="student-hub-close-btn"
              onClick={onClose}
              aria-label="إغلاق"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Operations Action Bar (العمليات أولاً بشكل سهل وواضح) */}
          <div className="student-hub-actions-bar">
            <div className="student-hub-quick-actions">
              <button
                type="button"
                className="hub-action-btn whatsapp"
                onClick={handleSendWhatsApp}
                title="مراسلة ولي الأمر مباشرة عبر واتساب"
              >
                <MessageCircle size={15} />
                <span>مراسلة واتساب</span>
              </button>

              <button
                type="button"
                className="hub-action-btn phone"
                onClick={() => window.open(`tel:${student.parentPhone}`)}
                title="اتصال هاتفي بولي الأمر"
              >
                <Phone size={15} />
                <span>اتصال هاتف</span>
              </button>

              <button
                type="button"
                className="hub-action-btn payment"
                onClick={() => {
                  if (onRecordPayment) onRecordPayment(student.id);
                  else toast.info("توجه لقسم المالية لتحصيل دفعة");
                }}
              >
                <CreditCard size={15} />
                <span>تحصيل قسط / دفعة 💳</span>
              </button>

              <button
                type="button"
                className="hub-action-btn group"
                onClick={() => {
                  if (onEnrollGroup) onEnrollGroup(student.id);
                  else toast.info("توجه لجدول المجموعات لتسكين الطالب");
                }}
              >
                <Users size={15} />
                <span>تسكين بمجموعة / معسكر</span>
              </button>

              <button
                type="button"
                className="hub-action-btn cert"
                onClick={handleOpenCertificate}
                title="إصدار وطباعة الشهادة المعتمدة مع رمز التحقق الإلكتروني QR"
              >
                <Award size={15} />
                <span>شهادة معتمدة 📜</span>
              </button>

              <button
                type="button"
                className="hub-action-btn print"
                onClick={handlePrintStudentCard}
              >
                <Printer size={15} />
                <span>طباعة السجل (A4)</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation (الديتيلز والتحليل) */}
          <div className="student-hub-tabs">
            <button
              type="button"
              className={`student-hub-tab-btn ${activeTab === "OVERVIEW" ? "active" : ""}`}
              onClick={() => setActiveTab("OVERVIEW")}
            >
              <BookOpen size={16} />
              <span>مسار التعلم والحضور</span>
            </button>
            <button
              type="button"
              className={`student-hub-tab-btn ${activeTab === "FINANCE" ? "active" : ""}`}
              onClick={() => setActiveTab("FINANCE")}
            >
              <Receipt size={16} />
              <span>السجل المالي والفواتير</span>
            </button>
            <button
              type="button"
              className={`student-hub-tab-btn ${activeTab === "COMPETITIONS" ? "active" : ""}`}
              onClick={() => setActiveTab("COMPETITIONS")}
            >
              <Trophy size={16} />
              <span>المسابقات والمشاريع الموثقة</span>
            </button>
            <button
              type="button"
              className={`student-hub-tab-btn ${activeTab === "SKILLS" ? "active" : ""}`}
              onClick={() => setActiveTab("SKILLS")}
            >
              <Sparkles size={16} />
              <span>التقييمات والمهارات الأكاديمية</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="student-hub-body">
            {/* TAB 1: OVERVIEW */}
            {activeTab === "OVERVIEW" && (
              <div className="hub-tab-pane">
                {/* KPI Overview Grid */}
                <div className="hub-kpi-grid">
                  <div className="hub-kpi-card">
                    <span className="hub-kpi-label">نسبة الحضور والالتزام</span>
                    <strong className="hub-kpi-val" style={{ color: "#0d9488" }}>
                      {(student as any).attendance ?? 95}%
                    </strong>
                    <small>حضر 11 من أصل 12 جلسة معملية</small>
                  </div>
                  <div className="hub-kpi-card">
                    <span className="hub-kpi-label">المستوى والمسار التدريبي</span>
                    <strong className="hub-kpi-val" style={{ color: "#2563eb" }}>
                      المستوى الثاني
                    </strong>
                    <small>مسار الروبوتكس المتقدم (SPIKE Prime)</small>
                  </div>
                  <div className="hub-kpi-card">
                    <span className="hub-kpi-label">المشاريع المنجزة</span>
                    <strong className="hub-kpi-val" style={{ color: "#d97706" }}>
                      4 مشروعات
                    </strong>
                    <small>موثقة بروابط الدرايف في الأرشيف</small>
                  </div>
                </div>

                {/* Course Path & Completed Diplomas */}
                <div className="hub-section-box">
                  <h4 className="hub-box-title">
                    <BookOpen size={16} color="#0d9488" />
                    <span>الكورس الحالي والدورات المعتمدة:</span>
                  </h4>
                  <div className="hub-courses-list">
                    <div className="hub-course-pill current">
                      <span className="course-dot active" />
                      <div>
                        <strong>الكورس الحالي: {student.course}</strong>
                        <small>مجموعة السبت 12:00 م · قاعة أينشتاين</small>
                      </div>
                    </div>
                    {student.completedCourses?.map((c, idx) => (
                      <div key={idx} className="hub-course-pill completed">
                        <CheckCircle2 size={14} color="#10b981" />
                        <div>
                          <strong>{c}</strong>
                          <small>تم الاجتياز والحصول على الشهادة ✓</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Demographics & Guardian Contact */}
                <div className="hub-section-box">
                  <h4 className="hub-box-title">
                    <User size={16} color="#475569" />
                    <span>البيانات الشخصية وبيانات ولي الأمر:</span>
                  </h4>
                  <div className="hub-info-grid">
                    <div>
                      <small>رقم هاتف ولي الأمر:</small>
                      <strong dir="ltr">{student.parentPhone}</strong>
                    </div>
                    <div>
                      <small>تاريخ الميلاد:</small>
                      <strong dir="ltr">{student.birthDate}</strong>
                    </div>
                    <div>
                      <small>الفرع المعتمد:</small>
                      <strong>{student.branch}</strong>
                    </div>
                    <div>
                      <small>مصدر الاستقطاب:</small>
                      <strong>{student.source || "سوشيال ميديا"}</strong>
                    </div>
                  </div>
                </div>

                {/* Accredited Official Certificate Highlight */}
                <div className="hub-section-box hub-cert-highlight">
                  <div className="hub-box-head-with-action">
                    <h4 className="hub-box-title">
                      <Award size={16} color="#d97706" />
                      <span>الشهادة الإلكترونية الرسمية المعتمدة:</span>
                    </h4>
                    <button
                      type="button"
                      className="hub-sm-btn gold"
                      onClick={handleOpenCertificate}
                    >
                      <Printer size={13} />
                      <span>معاينة وطباعة الشهادة (A4 Landscape) 🎓</span>
                    </button>
                  </div>
                  <p className="hub-box-desc" style={{ fontSize: "12px", color: "#92400e", margin: "6px 0 0" }}>
                    شهادة تخرج وتفوق رسمية صادرة برقم تسلسلي موثق ومزودة برمز QR فريد يربط مباشرة بمنصة التحقق الإلكترونية للأكاديمية مع إمكانية مشاركتها المباشرة لولي الأمر عبر واتساب.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: FINANCE */}
            {activeTab === "FINANCE" && (
              <div className="hub-tab-pane">
                <div className="hub-finance-summary">
                  <div className="hub-finance-kpi">
                    <span>إجمالي الرسوم المفوترة:</span>
                    <strong>4,800 ج.م</strong>
                  </div>
                  <div className="hub-finance-kpi">
                    <span>المسدد في الخزينة:</span>
                    <strong style={{ color: "#16a34a" }}>
                      {student.status === "active" ? "4,800 ج.م" : "2,400 ج.م"}
                    </strong>
                  </div>
                  <div className="hub-finance-kpi">
                    <span>المتبقي المستحق:</span>
                    <strong style={{ color: student.status === "active" ? "#16a34a" : "#dc2626" }}>
                      {student.status === "active" ? "0 ج.م (خالص)" : "2,400 ج.م"}
                    </strong>
                  </div>
                </div>

                <div className="hub-section-box">
                  <div className="hub-box-head-with-action">
                    <h4 className="hub-box-title">
                      <Receipt size={16} color="#0d9488" />
                      <span>فواتير الطالب وسندات القبض:</span>
                    </h4>
                    {onCreateInvoice && (
                      <button
                        type="button"
                        className="hub-sm-btn"
                        onClick={() => {
                          onClose();
                          onCreateInvoice(student.id);
                        }}
                      >
                        + إصدار فاتورة جديدة
                      </button>
                    )}
                  </div>

                  <div className="hub-table-wrapper">
                    <table className="hub-table">
                      <thead>
                        <tr>
                          <th>رقم الفاتورة</th>
                          <th>الدورة</th>
                          <th>المبلغ</th>
                          <th>المسدد</th>
                          <th>الحالة</th>
                          <th>إجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentInvoices.map((inv) => (
                          <tr key={inv.id}>
                            <td>
                              <strong dir="ltr">{inv.number}</strong>
                            </td>
                            <td>{inv.course}</td>
                            <td>{inv.total.toLocaleString()} ج.م</td>
                            <td>
                              <strong style={{ color: "#16a34a" }}>
                                {inv.collected.toLocaleString()} ج.م
                              </strong>
                            </td>
                            <td>
                              <span className={`hub-pay-status ${inv.status}`}>
                                {inv.status === "paid" ? "مسددة ✓" : "سداد جزئي"}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="hub-action-btn-sm"
                                onClick={() => setSelectedInvoice(inv)}
                                title="عرض تفاصيل الفاتورة وسندات القبض"
                              >
                                <span>تفاصيل الفاتورة 👁️</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Annual Nursery & Diplomas Installments Section */}
                <div className="hub-section-box" style={{ border: "1.5px solid #0d9488", background: "#f0fdfa" }}>
                  <div className="hub-box-head-with-action">
                    <div>
                      <h4 className="hub-box-title" style={{ color: "#0f766e" }}>
                        <Coins size={17} color="#0f766e" />
                        <span>خطة الاشتراك السنوي ونظام الأقساط الشهرية (Installments Engine):</span>
                      </h4>
                      <small style={{ color: "#134e4a", fontSize: "11.5px" }}>
                        مقدم سنوي لحجز المقعد + أقساط شهرية متتابعة على مدار العام مع تتبع السداد والتذكير عبر واتساب.
                      </small>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        style={{
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: 700,
                          border: installmentPlan === "annual_nursery" ? "1.5px solid #0f766e" : "1px solid #cbd5e1",
                          background: installmentPlan === "annual_nursery" ? "#0f766e" : "#ffffff",
                          color: installmentPlan === "annual_nursery" ? "#ffffff" : "#475569",
                          cursor: "pointer",
                        }}
                        onClick={() => setInstallmentPlan("annual_nursery")}
                      >
                        حضانة سنوية (12 قسط)
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: 700,
                          border: installmentPlan === "annual_diploma" ? "1.5px solid #0f766e" : "1px solid #cbd5e1",
                          background: installmentPlan === "annual_diploma" ? "#0f766e" : "#ffffff",
                          color: installmentPlan === "annual_diploma" ? "#ffffff" : "#475569",
                          cursor: "pointer",
                        }}
                        onClick={() => setInstallmentPlan("annual_diploma")}
                      >
                        دبلومة روبوتكس سنوية
                      </button>
                    </div>
                  </div>

                  <div className="hub-finance-summary" style={{ background: "#ffffff", marginTop: "10px" }}>
                    <div className="hub-finance-kpi">
                      <span>إجمالي الاشتراك السنوي:</span>
                      <strong>{totalPlanAmount.toLocaleString()} ج.م</strong>
                    </div>
                    <div className="hub-finance-kpi">
                      <span>المسدد في الخزينة حتى الآن:</span>
                      <strong style={{ color: "#16a34a" }}>
                        {collectedPlanAmount.toLocaleString()} ج.م
                      </strong>
                    </div>
                    <div className="hub-finance-kpi">
                      <span>المتبقي للأقساط القادمة:</span>
                      <strong style={{ color: remainingPlanAmount === 0 ? "#16a34a" : "#d97706" }}>
                        {remainingPlanAmount.toLocaleString()} ج.م
                      </strong>
                    </div>
                  </div>

                  <div className="hub-table-wrapper" style={{ background: "#ffffff", marginTop: "10px" }}>
                    <table className="hub-table">
                      <thead>
                        <tr>
                          <th>الدفعة / القسط</th>
                          <th>تاريخ الاستحقاق</th>
                          <th>المبلغ</th>
                          <th>حالة السداد</th>
                          <th>إجراءات فورية</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nurseryInstallmentsSchedule.map(inst => {
                          const isPaid = paidInstallments.includes(inst.id);
                          return (
                            <tr key={inst.id} style={{ background: isPaid ? "#f8fafc" : "#ffffff" }}>
                              <td>
                                <strong style={{ color: inst.isDownPayment ? "#0f766e" : "#1e293b" }}>
                                  {inst.name}
                                  {inst.isDownPayment && (
                                    <span style={{ fontSize: "10.5px", marginRight: "6px", color: "#0f766e", background: "#ccfbf1", padding: "2px 6px", borderRadius: "4px" }}>
                                      دفعة مقدمة
                                    </span>
                                  )}
                                </strong>
                              </td>
                              <td dir="ltr" style={{ fontSize: "12px", color: "#64748b" }}>
                                {inst.dueDate}
                              </td>
                              <td>
                                <strong>{inst.amount.toLocaleString()} ج.م</strong>
                              </td>
                              <td>
                                {isPaid ? (
                                  <span className="hub-pay-status paid" style={{ fontSize: "11px" }}>
                                    <CheckCircle2 size={12} /> مسدد بالخزينة ✓
                                  </span>
                                ) : (
                                  <span className="hub-pay-status partial" style={{ fontSize: "11px", color: "#b45309", background: "#fef3c7" }}>
                                    <Clock size={12} /> مستحق السداد ⏳
                                  </span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                  {!isPaid ? (
                                    <>
                                      <button
                                        type="button"
                                        className="hub-action-btn-sm"
                                        style={{ background: "#0f766e", color: "#ffffff", border: "none" }}
                                        onClick={() => handlePayInstallment(inst)}
                                        title="تحصيل القسط في الخزينة وتسجيل سند قبض"
                                      >
                                        <CreditCard size={12} />
                                        <span>سداد الآن</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="hub-action-btn-sm"
                                        style={{ background: "#25d366", color: "#ffffff", border: "none" }}
                                        onClick={() => handleSendInstallmentReminder(inst.name, inst.amount, inst.dueDate)}
                                        title="إرسال رسالة تذكير بالقسط عبر واتساب"
                                      >
                                        <MessageCircle size={12} />
                                        <span>تذكير واتساب</span>
                                      </button>
                                    </>
                                  ) : (
                                    <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>
                                      إيصال #{inst.id.slice(-3).toUpperCase()}-2026
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: COMPETITIONS */}
            {activeTab === "COMPETITIONS" && (
              <div className="hub-tab-pane">
                <div className="hub-section-box">
                  <h4 className="hub-box-title">
                    <Trophy size={16} color="#d97706" />
                    <span>مشاركات الطالب في البطولات وفرق الأكاديمية:</span>
                  </h4>

                  <div className="hub-comp-cards">
                    <div className="hub-comp-card">
                      <div className="hub-comp-head">
                        <div>
                          <strong>فريق روبوتكس الأبطال (RoboHeroes)</strong>
                          <small>بطولة WRO 2026 الرسمية · فئة مهام الروبوت</small>
                        </div>
                        <span className="hub-comp-role-badge">كابتن الفريق 👑</span>
                      </div>
                      <div className="hub-comp-meta">
                        <span>الحقيبة: <strong>LEGO SPIKE Prime 🤖</strong></span>
                        <span>النتيجة: <strong style={{ color: "#d97706" }}>المركز الثاني والتأهل للإقليمي 🥈</strong></span>
                      </div>
                      <div className="hub-comp-archive-link">
                        <ExternalLink size={13} />
                        <a
                          href="https://drive.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          مجلد مشروع الفريق بالأرشيف السحابي (Google Drive ↗)
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Achievements and Badges */}
                <div className="hub-section-box">
                  <h4 className="hub-box-title">
                    <Award size={16} color="#f59e0b" />
                    <span>أوسمة وإنجازات لوحة الشرف (Hall of Fame):</span>
                  </h4>
                  <div className="hub-badges-grid">
                    <div className="hub-badge-item">
                      <span className="badge-icon">🥇</span>
                      <div>
                        <strong>الميدالية الذهبية بمسابقة البرمجة</strong>
                        <small>هاكاثون أكاديمية مدى الداخلي 2026</small>
                      </div>
                    </div>
                    <div className="hub-badge-item">
                      <span className="badge-icon">⚡</span>
                      <div>
                        <strong>درع الابتكار الميكانيكي السريع</strong>
                        <small>معسكر الروبوتكس الصيفي 2026</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SKILLS & EVALUATIONS */}
            {activeTab === "SKILLS" && (
              <div className="hub-tab-pane">
                <div className="hub-section-box">
                  <h4 className="hub-box-title">
                    <Sparkles size={16} color="#0d9488" />
                    <span>مصفوفة المهارات الأكاديمية والعملية (Skills Metrics):</span>
                  </h4>
                  <div className="hub-skills-bars">
                    <div className="hub-skill-row">
                      <div className="skill-label-row">
                        <span>التفكير المنطقي والخوارزميات (Logical Thinking):</span>
                        <strong>92%</strong>
                      </div>
                      <div className="skill-bar-track">
                        <div className="skill-bar-fill" style={{ width: "92%", background: "#0d9488" }} />
                      </div>
                    </div>

                    <div className="hub-skill-row">
                      <div className="skill-label-row">
                        <span>البناء والتصميم الميكانيكي (Mechanical Design):</span>
                        <strong>88%</strong>
                      </div>
                      <div className="skill-bar-track">
                        <div className="skill-bar-fill" style={{ width: "88%", background: "#2563eb" }} />
                      </div>
                    </div>

                    <div className="hub-skill-row">
                      <div className="skill-label-row">
                        <span>العمل الجماعي والقيادة (Teamwork & Leadership):</span>
                        <strong>95%</strong>
                      </div>
                      <div className="skill-bar-track">
                        <div className="skill-bar-fill" style={{ width: "95%", background: "#d97706" }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Early Childhood & Developmental Milestones */}
                <div className="hub-section-box">
                  <h4 className="hub-box-title">
                    <Sparkles size={16} color="#0f766e" />
                    <span>مؤشرات التطور الحركي والمعرفي والاجتماعي للطفل (Early Childhood Milestones):</span>
                  </h4>
                  <div className="hub-skills-bars">
                    <div className="hub-skill-row">
                      <div className="skill-label-row">
                        <span>التناسق الحركي الدقيق والأنشطة اليدوية (Fine Motor Coordination):</span>
                        <strong style={{ color: "#0f766e" }}>88%</strong>
                      </div>
                      <div className="skill-bar-track">
                        <div className="skill-bar-fill" style={{ width: "88%", background: "#0f766e" }} />
                      </div>
                    </div>

                    <div className="hub-skill-row">
                      <div className="skill-label-row">
                        <span>الاستكشاف المعرفي والفضول والتفكير (Cognitive Curiosity & Logic):</span>
                        <strong style={{ color: "#2563eb" }}>94%</strong>
                      </div>
                      <div className="skill-bar-track">
                        <div className="skill-bar-fill" style={{ width: "94%", background: "#2563eb" }} />
                      </div>
                    </div>

                    <div className="hub-skill-row">
                      <div className="skill-label-row">
                        <span>المشاركة الاجتماعية والتعاطف والتواصل (Social & Emotional):</span>
                        <strong style={{ color: "#d97706" }}>90%</strong>
                      </div>
                      <div className="skill-bar-track">
                        <div className="skill-bar-fill" style={{ width: "90%", background: "#d97706" }} />
                      </div>
                    </div>

                    <div className="hub-skill-row">
                      <div className="skill-label-row">
                        <span>الاستجابة للتعليمات والروتين اليومي للحضانة (Daily Routine):</span>
                        <strong style={{ color: "#16a34a" }}>85%</strong>
                      </div>
                      <div className="skill-bar-track">
                        <div className="skill-bar-fill" style={{ width: "85%", background: "#16a34a" }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Individual Child Observations Timeline */}
                <div className="hub-section-box" style={{ border: "1px solid #ccfbf1", background: "#f0fdfa" }}>
                  <div className="hub-box-head-with-action">
                    <h4 className="hub-box-title" style={{ color: "#0f766e" }}>
                      <FileText size={16} color="#0f766e" />
                      <span>سجل الملاحظات الفردية لكل طفل (Child Observations Log):</span>
                    </h4>
                    <span style={{ fontSize: "11px", color: "#0f766e", fontWeight: 700, background: "#ccfbf1", padding: "2px 8px", borderRadius: "6px" }}>
                      مربوط ببوابة الأسرة 👨‍👩‍👦
                    </span>
                  </div>

                  {/* Add New Observation Box */}
                  <div style={{ background: "#ffffff", padding: "12px", borderRadius: "10px", border: "1px solid #99f6e4", marginTop: "8px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      إضافة ملاحظة توجيهية جديدة للطفل:
                    </label>
                    <textarea
                      rows={2}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        fontSize: "12.5px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      placeholder="اكتب ملاحظة واضحة ومحددة عن نشاط الطفل وسلوكه اليوم…"
                      value={newNoteInput}
                      onChange={e => setNewNoteInput(e.target.value)}
                    />
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", flexWrap: "wrap", gap: "6px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                        {[
                          { label: "🌟 متفاعل ومبادر", text: "متفاعل ومبادر جداً في الأنشطة واستيعاب المفاهيم اليوم." },
                          { label: "🤖 أتقن التطبيق", text: "أتقن التطبيق العملي للنشاط والمهام المطلوبة بدقة عالية." },
                          { label: "🤝 متعاون مع زملائه", text: "متعاون وإيجابي جداً مع زملائه وشارك في نجاح الفريق." },
                          { label: "🧩 يحتاج دعم حركي", text: "يحتاج لمزيد من الدعم في التناسق الحركي واستخدام الأدوات." },
                        ].map((chip, i) => (
                          <button
                            key={i}
                            type="button"
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderRadius: "14px",
                              padding: "2px 8px",
                              fontSize: "11px",
                              color: "#475569",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              setNewNoteInput(prev => (prev.trim() ? `${prev.trim()}\n• ${chip.text}` : `• ${chip.text}`));
                            }}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        style={{
                          background: "#0f766e",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "6px 14px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                        disabled={!newNoteInput.trim()}
                        onClick={() => {
                          if (!newNoteInput.trim()) return;
                          const newRecord = {
                            id: `n-${Date.now()}`,
                            date: "اليوم",
                            coach: "معلمة الحضانة والمشرف الأكاديمي",
                            text: newNoteInput.trim(),
                            tag: "ملاحظة حديثة ⚡",
                          };
                          setChildNotes(prev => [newRecord, ...prev]);
                          setNewNoteInput("");
                          toast.success("تم تسجيل الملاحظة الفردية وإرسالها لبوابة الأسرة بنجاح!");
                        }}
                      >
                        <Plus size={14} />
                        <span>حفظ الملاحظة وإرسالها لبوابة الأسرة</span>
                      </button>
                    </div>
                  </div>

                  {/* Observations Timeline List */}
                  <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
                    {childNotes.map(note => (
                      <div
                        key={note.id}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          padding: "12px 14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#0f766e" }}>
                            {note.coach} · <span style={{ color: "#64748b" }}>{note.date}</span>
                          </span>
                          <span style={{ fontSize: "10.5px", fontWeight: 700, background: "#f1f5f9", color: "#334155", padding: "2px 8px", borderRadius: "6px" }}>
                            {note.tag}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "12.5px", color: "#334155", lineHeight: 1.6 }}>
                          {note.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hub-section-box">
                  <h4 className="hub-box-title">
                    <FileText size={16} color="#475569" />
                    <span>تقرير الكوتش العام:</span>
                  </h4>
                  <div className="hub-coach-review-box">
                    <p>
                      "الطالب يتمتع بذكاء تحليلي استثنائي وقدرة سريعة على اكتشاف أخطاء الحساسات
                      الضوئية أثناء جولات الميدان. نوصي باستمراره في معسكر إعداد بطولات الروبوتكس
                      الوطنية القادمة."
                    </p>
                    <small>— تقييم كوتش الروبوتكس المعتمد · فرع {student.branch}</small>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="student-hub-footer">
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              سجل الطالب الأكاديمي والمالي الموحد 360° · أكاديمية مدى
            </span>
            <button
              type="button"
              className="student-hub-footer-close"
              onClick={onClose}
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Invoice Details Modal if triggered from Financial tab */}
      {selectedInvoice && (
        <InvoiceDetailsModal
          isOpen={Boolean(selectedInvoice)}
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onRecordPayment={() => {
            if (onRecordPayment) onRecordPayment(student.id);
          }}
        />
      )}

      {/* Official Verifiable Certificate Print Modal */}
      {isCertModalOpen && (
        <StudentCertificatePrintModal
          isOpen={isCertModalOpen}
          certificate={activeCert}
          onClose={() => setIsCertModalOpen(false)}
        />
      )}
    </>
  );
}
