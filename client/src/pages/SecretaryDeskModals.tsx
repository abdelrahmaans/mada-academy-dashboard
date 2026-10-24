import React from "react";
import { Plus, UserCheck, X } from "lucide-react";
import type {
  CreateLeadInput,
  ConvertLeadInput,
  LeadRecord,
  SchedulingGroupRecord,
  StudentRecord,
} from "@/lib/apiClient";
import type { FreezeFormData, ShiftFormData } from "./SecretaryDeskTypes";

// ── 1. NEW LEAD MODAL ──
export interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLead: CreateLeadInput;
  setNewLead: React.Dispatch<React.SetStateAction<CreateLeadInput>>;
  onSubmit: (e: React.FormEvent) => void;
  groups: SchedulingGroupRecord[];
}

export function NewLeadModal({
  isOpen,
  onClose,
  newLead,
  setNewLead,
  onSubmit,
  groups,
}: NewLeadModalProps) {
  if (!isOpen) return null;

  return (
    <div className="secretary-modal-backdrop" onClick={onClose}>
      <div className="secretary-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>
            <Plus size={18} /> تسجيل عميل محتمل جديد
          </h3>
          <button type="button" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <label>
              <span>اسم الطفل *</span>
              <input
                type="text"
                required
                placeholder="مثال: عمر طارق عثمان"
                value={newLead.childName}
                onChange={(e) =>
                  setNewLead({ ...newLead, childName: e.target.value })
                }
              />
            </label>
            <label>
              <span>اسم ولي الأمر *</span>
              <input
                type="text"
                required
                placeholder="مثال: طارق عثمان"
                value={newLead.parentName}
                onChange={(e) =>
                  setNewLead({ ...newLead, parentName: e.target.value })
                }
              />
            </label>
            <label>
              <span>رقم الهاتف / الواتساب *</span>
              <input
                type="tel"
                required
                placeholder="مثال: +201012345678"
                value={newLead.phone}
                onChange={(e) =>
                  setNewLead({ ...newLead, phone: e.target.value })
                }
              />
            </label>
            <label>
              <span>قناة الاستفسار</span>
              <select
                value={newLead.channel}
                onChange={(e) =>
                  setNewLead({ ...newLead, channel: e.target.value })
                }
              >
                <option value="WALK_IN">زيارة مباشرة للفرع</option>
                <option value="WHATSAPP">رسالة واتساب</option>
                <option value="PHONE">مكالمة هاتفية</option>
                <option value="FACEBOOK">إعلان فيسبوك</option>
                <option value="INSTAGRAM">إنستغرام</option>
              </select>
            </label>
            <label>
              <span>المجموعة / الكورس المهتم به</span>
              <select
                value={newLead.courseOfferingId}
                onChange={(e) =>
                  setNewLead({ ...newLead, courseOfferingId: e.target.value })
                }
              >
                <option value="">اختر المجموعة (اختياري)...</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.courseName} · {g.classroomName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>ملاحظات الاستفسار</span>
              <textarea
                rows={3}
                placeholder="اكتب تفاصيل الاستفسار ومستوى الطفل والمواعيد المفضلة..."
                value={newLead.notes ?? ""}
                onChange={(e) =>
                  setNewLead({ ...newLead, notes: e.target.value })
                }
              />
            </label>
          </div>
          <div className="modal-foot">
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
            >
              إلغاء
            </button>
            <button type="submit" className="button button-primary">
              حفظ في المسار
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 2. CONVERT LEAD MODAL ──
export interface ConvertLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  convertingLead: LeadRecord | null;
  convertData: ConvertLeadInput;
  setConvertData: React.Dispatch<React.SetStateAction<ConvertLeadInput>>;
  onSubmit: (e: React.FormEvent) => void;
  groups: SchedulingGroupRecord[];
}

export function ConvertLeadModal({
  isOpen,
  onClose,
  convertingLead,
  convertData,
  setConvertData,
  onSubmit,
  groups,
}: ConvertLeadModalProps) {
  if (!isOpen || !convertingLead) return null;

  return (
    <div className="secretary-modal-backdrop" onClick={onClose}>
      <div className="secretary-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>
            <UserCheck size={18} /> تأكيد تسجيل الطالب رسميًا
          </h3>
          <button type="button" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="convert-summary-pill">
              <strong>{convertingLead.childName}</strong>
              <span>
                ولي الأمر: {convertingLead.parentName} · {convertingLead.phone}
              </span>
            </div>

            <label>
              <span>تسكين في المجموعة التدريبية *</span>
              <select
                value={convertData.courseOfferingId}
                onChange={(e) =>
                  setConvertData({
                    ...convertData,
                    courseOfferingId: e.target.value,
                  })
                }
                required
              >
                <option value="">اختر المجموعة...</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.courseName} ({g.enrolledStudents}/{g.maxStudents}) ·{" "}
                    {g.classroomName}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>نسبة الخصم إن وُجد</span>
              <select
                value={convertData.discountPercent}
                onChange={(e) =>
                  setConvertData({
                    ...convertData,
                    discountPercent: Number(e.target.value),
                  })
                }
              >
                <option value={0}>بدون خصم (السعر كامل)</option>
                <option value={10}>خصم إخوة (10%)</option>
                <option value={15}>خصم سداد مبكر (15%)</option>
                <option value={20}>خصم شريك (20%)</option>
              </select>
            </label>

            <div className="form-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={convertData.createInvoice}
                  onChange={(e) =>
                    setConvertData({
                      ...convertData,
                      createInvoice: e.target.checked,
                    })
                  }
                />
                <span>إصدار فاتورة إلكترونية تلقائية بالمبلغ في قسم المالية</span>
              </label>
            </div>
          </div>
          <div className="modal-foot">
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
            >
              إلغاء
            </button>
            <button type="submit" className="button button-primary">
              تأكيد التسجيل النهائي
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 3. FREEZE REQUEST MODAL ──
export interface FreezeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  freezeFormData: FreezeFormData;
  setFreezeFormData: React.Dispatch<React.SetStateAction<FreezeFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  students: StudentRecord[];
}

export function FreezeRequestModal({
  isOpen,
  onClose,
  freezeFormData,
  setFreezeFormData,
  onSubmit,
  students,
}: FreezeRequestModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="dialog-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: "480px" }}
      >
        <button className="dialog-close" aria-label="إغلاق" onClick={onClose}>
          <X size={17} />
        </button>
        <div className="team-dialog-heading">
          <span className="approval-id">R05 · مكتب الاستقبال</span>
          <h2>تسجيل طلب تجميد اشتراك</h2>
          <p>تسجيل طلب وارد لشباك الاستقبال ويرفع آليًا لمدير الفرع للاعتماد.</p>
        </div>

        <form
          onSubmit={onSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            marginTop: "1rem",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              اختر الطالب
            </label>
            <select
              required
              value={freezeFormData.studentId}
              onChange={(e) =>
                setFreezeFormData({
                  ...freezeFormData,
                  studentId: e.target.value,
                })
              }
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
              }}
            >
              <option value="">-- اختر الطالب المسجل --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.id})
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                من تاريخ
              </label>
              <input
                type="date"
                required
                value={freezeFormData.startDate}
                onChange={(e) =>
                  setFreezeFormData({
                    ...freezeFormData,
                    startDate: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                إلى تاريخ
              </label>
              <input
                type="date"
                required
                value={freezeFormData.endDate}
                onChange={(e) =>
                  setFreezeFormData({
                    ...freezeFormData,
                    endDate: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              سبب التجميد
            </label>
            <select
              value={freezeFormData.reason}
              onChange={(e) =>
                setFreezeFormData({
                  ...freezeFormData,
                  reason: e.target.value as FreezeFormData["reason"],
                })
              }
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
              }}
            >
              <option value="MEDICAL">عذر طبي / مرضي</option>
              <option value="TRAVEL">سفر خارج المحافظة/البلاد</option>
              <option value="EXAMS">فترة امتحانات مدرسية</option>
              <option value="FAMILY">ظروف عائلية خاصة</option>
              <option value="OTHER">أسباب أخرى</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              تفاصيل وتوضيح العذر
            </label>
            <textarea
              required
              rows={2}
              placeholder="اكتب التوضيح لرفعه لمدير الفرع..."
              value={freezeFormData.reasonText}
              onChange={(e) =>
                setFreezeFormData({
                  ...freezeFormData,
                  reasonText: e.target.value,
                })
              }
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                resize: "none",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "8px",
            }}
          >
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
            >
              إلغاء
            </button>
            <button type="submit" className="button button-primary">
              رفع الطلب لمدير الفرع
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

// ── 4. SHIFT HANDOVER MODAL ──
export interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftFormData: ShiftFormData;
  setShiftFormData: React.Dispatch<React.SetStateAction<ShiftFormData>>;
  onSubmit: (e: React.FormEvent) => void;
}

export function ShiftHandoverModal({
  isOpen,
  onClose,
  shiftFormData,
  setShiftFormData,
  onSubmit,
}: ShiftHandoverModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="dialog-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: "480px" }}
      >
        <button className="dialog-close" aria-label="إغلاق" onClick={onClose}>
          <X size={17} />
        </button>
        <div className="team-dialog-heading">
          <span className="approval-id">R05 · تقفيل وردية</span>
          <h2>تقفيل الخزينة وتسليم عهدة الشباك</h2>
          <p>
            حصر النقدية الفعلية وسندات القبض المسددة في الشيفت لإرسالها
            للمحاسب.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            marginTop: "1rem",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              فترة الوردية
            </label>
            <select
              value={shiftFormData.shiftName}
              onChange={(e) =>
                setShiftFormData({
                  ...shiftFormData,
                  shiftName: e.target.value as "MORNING" | "EVENING",
                })
              }
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
              }}
            >
              <option value="MORNING">
                وردية صباحية (09:00 ص - 03:00 م)
              </option>
              <option value="EVENING">
                وردية مسائية (03:00 م - 09:00 م)
              </option>
            </select>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                إجمالي النقدية (الكاش الفعلي)
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="مثال: 4500"
                value={shiftFormData.cashAmount}
                onChange={(e) =>
                  setShiftFormData({
                    ...shiftFormData,
                    cashAmount: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                التحصيل الإلكتروني (Visa/IPN)
              </label>
              <input
                type="number"
                min="0"
                placeholder="مثال: 3200"
                value={shiftFormData.electronicAmount}
                onChange={(e) =>
                  setShiftFormData({
                    ...shiftFormData,
                    electronicAmount: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              عدد إيصالات وسندات القبض
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="مثال: 8"
              value={shiftFormData.totalReceiptsCount}
              onChange={(e) =>
                setShiftFormData({
                  ...shiftFormData,
                  totalReceiptsCount: e.target.value,
                })
              }
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              ملاحظات الوردية إن وجدت
            </label>
            <textarea
              rows={2}
              placeholder="أي ملاحظات حول المبالغ أو السندات المسلمة..."
              value={shiftFormData.notes}
              onChange={(e) =>
                setShiftFormData({ ...shiftFormData, notes: e.target.value })
              }
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                resize: "none",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "8px",
            }}
          >
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
            >
              إلغاء
            </button>
            <button type="submit" className="button button-primary">
              تسليم الوردية وإرسال الإشعار
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
