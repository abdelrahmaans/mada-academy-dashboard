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
} from "lucide-react";
import { toast } from "sonner";
import type { Student } from "@/pages/StudentsTypes";
import type { Invoice } from "@/pages/FinanceDeskTypes";
import { InvoiceDetailsModal } from "@/components/finance/InvoiceDetailsModal";
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

                <div className="hub-section-box">
                  <h4 className="hub-box-title">
                    <FileText size={16} color="#475569" />
                    <span>آخر تقرير تقييم من كوتش الأكاديمية:</span>
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
    </>
  );
}
