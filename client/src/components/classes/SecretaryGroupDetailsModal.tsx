import React from "react";
import {
  X,
  BookOpen,
  Calendar,
  Clock,
  Layers,
  MapPin,
  Phone,
  MessageCircle,
  UserCheck,
  UserPlus,
  Users,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { SchedulingGroupRecord } from "@/lib/apiClient";
import "./SecretaryGroupDetailsModal.css";

export interface GroupEnrolledStudent {
  id: string;
  studentName: string;
  parentName: string;
  phone: string;
  attendanceRate: number;
  paymentStatus: "PAID" | "PENDING" | "OVERDUE";
  enrolledAt: string;
}

interface Props {
  isOpen: boolean;
  group: SchedulingGroupRecord | null;
  onClose: () => void;
  onDirectRegister: (offeringId?: string) => void;
  onOpenBroadcast?: (group: SchedulingGroupRecord) => void;
  students?: GroupEnrolledStudent[];
}

export function SecretaryGroupDetailsModal({
  isOpen,
  group,
  onClose,
  onDirectRegister,
  onOpenBroadcast,
  students = [
    {
      id: "st-1",
      studentName: "ياسين محمد علي",
      parentName: "أ. محمد علي",
      phone: "+201011223344",
      attendanceRate: 95,
      paymentStatus: "PAID",
      enrolledAt: "2026-10-01",
    },
    {
      id: "st-2",
      studentName: "عمر خالد إبراهيم",
      parentName: "د. نهى إبراهيم",
      phone: "+201012345678",
      attendanceRate: 88,
      paymentStatus: "PAID",
      enrolledAt: "2026-10-05",
    },
    {
      id: "st-3",
      studentName: "آدم شريف حسن",
      parentName: "م. شريف حسن",
      phone: "+201099887766",
      attendanceRate: 100,
      paymentStatus: "PENDING",
      enrolledAt: "2026-10-12",
    },
    {
      id: "st-4",
      studentName: "سيف مصطفى عادل",
      parentName: "أ. مصطفى عادل",
      phone: "+201022334455",
      attendanceRate: 92,
      paymentStatus: "PAID",
      enrolledAt: "2026-10-15",
    },
    {
      id: "st-5",
      studentName: "ملك حسام الدين",
      parentName: "د. حسام الدين",
      phone: "+201012345673",
      attendanceRate: 85,
      paymentStatus: "OVERDUE",
      enrolledAt: "2026-10-18",
    },
  ],
}: Props) {
  if (!isOpen || !group) return null;

  const isFull = group.enrolledStudents >= group.maxStudents;
  const availableSeats = Math.max(0, group.maxStudents - group.enrolledStudents);
  const occupancyPct = group.maxStudents > 0 ? Math.min(100, Math.round((group.enrolledStudents / group.maxStudents) * 100)) : 0;

  const handleSendStudentWhatsApp = (st: GroupEnrolledStudent) => {
    let clean = st.phone.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "2" + clean;
    if (!clean.startsWith("20") && clean.length === 10) clean = "20" + clean;
    const msg = encodeURIComponent(
      `مرحباً ${st.parentName}، تحية طيبة من أكاديمية مدى للروبوتكس بخصوص الطالب *${st.studentName}* بمجموعة (${group.courseName}). يسعدنا التواصل معكم.`
    );
    window.open(`https://web.whatsapp.com/send?phone=${clean}&text=${msg}`, "_blank");
  };

  return (
    <div
      className="group-details-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="group-details-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-details-title"
      >
        {/* Header */}
        <div className="group-details-header">
          <div className="group-details-title-box">
            <span className="group-details-track-badge">
              <BookOpen size={13} /> {group.track || "مسار عام"}
            </span>
            <h3 id="group-details-title">{group.courseName}</h3>
            <p className="group-details-code">
              كود المجموعة: <b dir="ltr">GRP-{group.id.slice(0, 6).toUpperCase()}</b> · الحالة:{" "}
              <strong style={{ color: isFull ? "#dc2626" : "#0d9488" }}>
                {isFull ? "مكتملة المقاعد" : "متاحة للتسجيل"}
              </strong>
            </p>
          </div>

          <button
            type="button"
            className="group-details-close-btn"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="group-details-body">
          {/* Schedule & Operational Info Grid */}
          <div className="group-info-grid">
            <div className="group-info-card">
              <span className="group-info-label">
                <Users size={13} /> المدرب الأكاديمي
              </span>
              <strong>{group.instructorName || "قيد التعيين"}</strong>
            </div>

            <div className="group-info-card">
              <span className="group-info-label">
                <MapPin size={13} /> القاعة الدراسية
              </span>
              <strong>{group.classroomName || "قيد التحديد"}</strong>
            </div>

            <div className="group-info-card">
              <span className="group-info-label">
                <Calendar size={13} /> تاريخ البدء والانتهاء
              </span>
              <strong>
                {group.startDate || "مستمرة"} ➔ {group.endDate || "نهاية الدورة"}
              </strong>
            </div>

            <div className="group-info-card">
              <span className="group-info-label">
                <Clock size={13} /> سعة المقاعد المتاحة
              </span>
              <strong style={{ color: isFull ? "#dc2626" : "#0f766e" }}>
                {availableSeats} مقعد شاغر ({group.enrolledStudents}/{group.maxStudents})
              </strong>
            </div>
          </div>

          {/* Capacity Progress Bar */}
          <div className="group-capacity-box">
            <div className="group-capacity-header">
              <span>نسبة إشغال المقاعد بالمجموعة:</span>
              <strong>{occupancyPct}% ({isFull ? "مكتملة 100%" : `متبقي ${availableSeats} مقاعد`})</strong>
            </div>
            <div className="group-capacity-bar-track">
              <div
                className="group-capacity-bar-fill"
                style={{
                  width: `${occupancyPct}%`,
                  background: isFull ? "linear-gradient(90deg, #ea580c, #dc2626)" : "linear-gradient(90deg, #0d9488, #0f766e)",
                }}
              />
            </div>
          </div>

          {/* Enrolled Students Roster */}
          <div className="group-roster-section">
            <div className="group-roster-head">
              <div className="group-roster-title">
                <Users size={16} />
                <span>قائمة الطلاب المسجلين بالمجموعة ({students.length} طالب)</span>
              </div>
              {onOpenBroadcast && (
                <button
                  type="button"
                  className="group-broadcast-quick-btn"
                  onClick={() => {
                    onClose();
                    onOpenBroadcast(group);
                  }}
                >
                  <MessageCircle size={14} />
                  <span>بث واتساب جماعي للمجموعة</span>
                </button>
              )}
            </div>

            <div className="group-roster-table-wrapper">
              <table className="group-roster-table">
                <thead>
                  <tr>
                    <th>الطالب</th>
                    <th>ولي الأمر</th>
                    <th>رقم الهاتف</th>
                    <th>نسبة الحضور</th>
                    <th>حالة السداد</th>
                    <th>إجراء سريع</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st) => (
                    <tr key={st.id}>
                      <td>
                        <strong>{st.studentName}</strong>
                      </td>
                      <td>{st.parentName}</td>
                      <td dir="ltr">{st.phone}</td>
                      <td>
                        <span className="group-attendance-pill">
                          {st.attendanceRate}%
                        </span>
                      </td>
                      <td>
                        <span className={`group-payment-badge ${st.paymentStatus.toLowerCase()}`}>
                          {st.paymentStatus === "PAID"
                            ? "مسدد ✓"
                            : st.paymentStatus === "PENDING"
                            ? "قيد التحصيل"
                            : "متأخر"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="group-student-whatsapp-btn"
                          onClick={() => handleSendStudentWhatsApp(st)}
                          title="محادثة واتساب سريعة"
                        >
                          <MessageCircle size={13} />
                          <span>واتساب</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="group-details-footer">
          <button
            type="button"
            className="button button-primary"
            disabled={isFull}
            onClick={() => {
              onClose();
              onDirectRegister(group.id);
            }}
          >
            <UserPlus size={15} />
            <span>{isFull ? "المجموعة مكتملة (تسكين بالانتظار)" : "تسجيل طالب في هذه المجموعة"}</span>
          </button>

          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
