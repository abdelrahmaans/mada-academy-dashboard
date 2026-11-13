import React from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Percent,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import type {
  DirectStudentInput,
  SchedulingGroupRecord,
  StudentRecord,
} from "@/lib/apiClient";

export interface SecretaryRegistrationTabProps {
  directRegistration: DirectStudentInput;
  setDirectRegistration: React.Dispatch<React.SetStateAction<DirectStudentInput>>;
  groups: SchedulingGroupRecord[];
  students: StudentRecord[];
  onSubmit: (e: React.FormEvent) => void;
}

export function SecretaryRegistrationTab({
  directRegistration,
  setDirectRegistration,
  groups,
  students,
  onSubmit,
}: SecretaryRegistrationTabProps) {
  const selectedGrp = groups.find(
    (g) => g.id === directRegistration.courseOfferingId
  );
  const isWaitlist =
    selectedGrp && selectedGrp.enrolledStudents >= selectedGrp.maxStudents;

  return (
    <section
      className="secretary-panel registration-panel"
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        padding: "26px 30px",
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
        direction: "rtl",
      }}
    >
      {/* Header */}
      <div
        className="registration-header"
        style={{
          borderBottom: "1px solid #f1f5f9",
          paddingBottom: "18px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#0d9488",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "4px",
            }}
          >
            <Sparkles size={14} /> تسجيل فوري معتمد
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            تسجيل طالب جديد فوري
          </h2>
          <p
            style={{
              margin: "4px 0 0",
              color: "#64748b",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            تسجيل فوري مع إنشاء ملف الطالب في المنظومة، تسكينه في المجموعة التدريبية،
            وتوليد الفاتورة المالية وإرسال إشعار الترحيب لولي الأمر.
          </p>
        </div>

        <div
          style={{
            background: "#e6f7f5",
            border: "1px solid #ccfbf1",
            borderRadius: "999px",
            padding: "6px 14px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "#0f766e",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          <CheckCircle2 size={15} />
          <span>ربط مباشر بقاعدة الطلاب</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="registration-form" style={{ display: "grid", gap: "20px" }}>
        <div
          className="form-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
          }}
        >
          {/* Full Name */}
          <label style={{ display: "grid", gap: "6px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#334155",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <User size={15} color="#0d9488" />
              <span>اسم الطالب رباعيًا *</span>
            </span>
            <input
              type="text"
              required
              placeholder="مثال: يوسف حسام الدين علي"
              value={directRegistration.fullName}
              onChange={(e) =>
                setDirectRegistration({
                  ...directRegistration,
                  fullName: e.target.value,
                })
              }
              style={{
                padding: "11px 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                outline: "none",
                background: "#f8fafc",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
              onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
            />
          </label>

          {/* Parent Phone */}
          <label style={{ display: "grid", gap: "6px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#334155",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Phone size={15} color="#0d9488" />
              <span>رقم هاتف ولي الأمر للتواصل والواتساب *</span>
            </span>
            <input
              type="tel"
              required
              dir="ltr"
              placeholder="+20 10 1234 5678"
              value={directRegistration.phone}
              onChange={(e) =>
                setDirectRegistration({
                  ...directRegistration,
                  phone: e.target.value,
                })
              }
              style={{
                padding: "11px 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                outline: "none",
                background: "#f8fafc",
                textAlign: "right",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
              onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
            />
          </label>

          {/* Group Offering */}
          <label style={{ display: "grid", gap: "6px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#334155",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <BookOpen size={15} color="#0d9488" />
              <span>المجموعة التدريبية والكورس *</span>
            </span>
            <select
              required
              value={directRegistration.courseOfferingId}
              onChange={(e) =>
                setDirectRegistration({
                  ...directRegistration,
                  courseOfferingId: e.target.value,
                })
              }
              style={{
                padding: "11px 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                outline: "none",
                background: "#f8fafc",
                cursor: "pointer",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
              onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
            >
              <option value="">اختر المجموعة المتاحة...</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.courseName} · {g.classroomName} · {g.instructorName} (
                  {g.enrolledStudents}/{g.maxStudents})
                  {g.enrolledStudents >= g.maxStudents
                    ? " [مكتملة 100% - ستتحول لقائمة انتظار]"
                    : ""}
                </option>
              ))}
            </select>
          </label>

          {/* Discount Percent */}
          <label style={{ display: "grid", gap: "6px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#334155",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Percent size={15} color="#0d9488" />
              <span>نسبة الخصم المعتمدة</span>
            </span>
            <select
              value={directRegistration.discountPercent}
              onChange={(e) =>
                setDirectRegistration({
                  ...directRegistration,
                  discountPercent: Number(e.target.value),
                })
              }
              style={{
                padding: "11px 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                outline: "none",
                background: "#f8fafc",
                cursor: "pointer",
              }}
            >
              <option value={0}>بدون خصم (السعر كامل 100%)</option>
              <option value={10}>خصم إخوة ومجموعات (10%)</option>
              <option value={15}>خصم سداد فوري مبكر (15%)</option>
              <option value={20}>خصم شراكات وتفوق أكاديمي (20%)</option>
            </select>
          </label>

          {/* Referral Student */}
          <label style={{ display: "grid", gap: "6px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#334155",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Users size={15} color="#0d9488" />
              <span>ترشيح بواسطة طالب سفير / إحالة زميل</span>
            </span>
            <select
              value={directRegistration.referredByStudentId ?? ""}
              onChange={(e) =>
                setDirectRegistration({
                  ...directRegistration,
                  referredByStudentId: e.target.value || undefined,
                })
              }
              style={{
                padding: "11px 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                outline: "none",
                background: "#f8fafc",
                cursor: "pointer",
              }}
            >
              <option value="">بدون ترشيح (تسجيل مباشر)</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Waitlist Notice if full */}
        {isWaitlist && (
          <div
            className="waitlist-alert-notice"
            style={{
              padding: "12px 16px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "12px",
              fontSize: "13px",
              color: "#92400e",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Clock size={18} style={{ color: "#d97706", flexShrink: 0 }} />
            <span>
              <strong>تنبيه الطاقة الاستيعابية:</strong> المجموعة المحددة مكتملة
              المقاعد ({selectedGrp.enrolledStudents}/{selectedGrp.maxStudents} مقعد).
              سيتم تسجيل الطالب تلقائياً في <strong>قائمة الانتظار</strong> بالأولوية،
              مع إشعار ولي الأمر فور فتح مقعد إضافي.
            </span>
          </div>
        )}

        {/* Automatic Invoice Card */}
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "12px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={directRegistration.createInvoice}
              onChange={(e) =>
                setDirectRegistration({
                  ...directRegistration,
                  createInvoice: e.target.checked,
                })
              }
              style={{ width: "18px", height: "18px", accentColor: "#0d9488", cursor: "pointer" }}
            />
            <div>
              <strong style={{ fontSize: "13px", color: "#166534", display: "block" }}>
                إصدار فاتورة تلقائية فورية بالمبلغ المستحق لحساب المالية
              </strong>
              <small style={{ color: "#15803d", fontSize: "11px" }}>
                تسمع الفاتورة فوراً في مكتب الحسابات والخزينة مع إمكانية تحصيل رسوم الاشتراك مباشرة.
              </small>
            </div>
          </label>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#16a34a", fontSize: "12px", fontWeight: 700 }}>
            <FileText size={15} /> فاتورة رقمية
          </span>
        </div>

        {/* Action Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px" }}>
          <button
            type="submit"
            style={{
              background: "linear-gradient(135deg, #0d9488, #0f766e)",
              color: "#ffffff",
              border: 0,
              borderRadius: "12px",
              padding: "12px 28px",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(13, 148, 136, 0.3)",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <UserPlus size={18} />
            <span>اعتماد وتسجيل الطالب وتسكينه في المجموعة</span>
          </button>
        </div>
      </form>
    </section>
  );
}
