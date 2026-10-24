import React from "react";
import { Clock, UserPlus } from "lucide-react";
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
    <section className="secretary-panel registration-panel">
      <div className="registration-header">
        <h2>تسجيل طالب جديد فوري</h2>
        <p>
          تسجيل فوري مع إنشاء ملف الطالب، إضافته للمجموعة، وتوليد الفاتورة
          التلقائية.
        </p>
      </div>

      <form onSubmit={onSubmit} className="registration-form">
        <div className="form-grid">
          <label>
            <span>اسم الطالب رباعيًا *</span>
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
            />
          </label>

          <label>
            <span>رقم هاتف ولي الأمر</span>
            <input
              type="tel"
              placeholder="مثال: +201012345678"
              value={directRegistration.phone}
              onChange={(e) =>
                setDirectRegistration({
                  ...directRegistration,
                  phone: e.target.value,
                })
              }
            />
          </label>

          <label>
            <span>المجموعة التدريبية</span>
            <select
              value={directRegistration.courseOfferingId}
              onChange={(e) =>
                setDirectRegistration({
                  ...directRegistration,
                  courseOfferingId: e.target.value,
                })
              }
            >
              <option value="">اختر المجموعة المتاحة...</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.courseName} · {g.classroomName} · {g.instructorName} (
                  {g.enrolledStudents}/{g.maxStudents})
                  {g.enrolledStudents >= g.maxStudents
                    ? " [مكتملة السعة 100% - قائمة انتظار]"
                    : ""}
                </option>
              ))}
            </select>
          </label>

          {isWaitlist && (
            <div
              className="waitlist-alert-notice"
              style={{
                gridColumn: "1 / -1",
                padding: "10px 14px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "10px",
                fontSize: "12px",
                color: "#92400e",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Clock size={16} style={{ color: "#d97706", flexShrink: 0 }} />
              <span>
                <strong>تنبيه الطاقة الاستيعابية:</strong> المجموعة المحددة
                مكتملة العدد ({selectedGrp.enrolledStudents}/
                {selectedGrp.maxStudents} مقعد). سيتم تسجيل الطالب تلقائياً في{" "}
                <strong>قائمة الانتظار</strong> بالأولوية التالية، مع إمكانية
                إشعار ولي الأمر فور توفر مقعد شاغر.
              </span>
            </div>
          )}

          <label>
            <span>نسبة الخصم المعتمدة (%)</span>
            <select
              value={directRegistration.discountPercent}
              onChange={(e) =>
                setDirectRegistration({
                  ...directRegistration,
                  discountPercent: Number(e.target.value),
                })
              }
            >
              <option value={0}>بدون خصم (السعر كامل)</option>
              <option value={10}>خصم إخوة (10%)</option>
              <option value={15}>خصم سداد مبكر (15%)</option>
              <option value={20}>خصم شريك أو تفوق (20%)</option>
            </select>
          </label>

          <label>
            <span>ترشيح بواسطة طالب سفير / إحالة زميل</span>
            <select
              value={directRegistration.referredByStudentId ?? ""}
              onChange={(e) =>
                setDirectRegistration({
                  ...directRegistration,
                  referredByStudentId: e.target.value || undefined,
                })
              }
            >
              <option value="">بدون ترشيح (تسجيل مباشر)</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.code || "طالب"})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-checkbox">
          <label>
            <input
              type="checkbox"
              checked={directRegistration.createInvoice}
              onChange={(e) =>
                setDirectRegistration({
                  ...directRegistration,
                  createInvoice: e.target.checked,
                })
              }
            />
            <span>إصدار فاتورة تلقائية فورية بالمبلغ المستحق لحساب المالية</span>
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="button button-primary">
            <UserPlus size={16} /> اعتماد وتسجيل الطالب الآن
          </button>
        </div>
      </form>
    </section>
  );
}
