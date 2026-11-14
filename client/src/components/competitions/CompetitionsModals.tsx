import React, { useState } from "react";
import { X, Plus, Trash2, Trophy, Award, DollarSign, Calendar, Sparkles } from "lucide-react";
import type { CompetitionTeamItem } from "@/lib/apiClient";
export { CompetitionsSocialCardModal } from "./CompetitionsSocialCardModal";

export function CreateCompetitionModal({
  isOpen,
  onClose,
  name,
  setName,
  organizer,
  setOrganizer,
  track,
  setTrack,
  season,
  setSeason,
  location,
  setLocation,
  eventDate,
  setEventDate,
  level,
  setLevel,
  ageGroup,
  setAgeGroup,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  setName: (v: string) => void;
  organizer: string;
  setOrganizer: (v: string) => void;
  track: string;
  setTrack: (v: string) => void;
  season: string;
  setSeason: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  eventDate?: string;
  setEventDate?: (v: string) => void;
  level?: string;
  setLevel?: (v: string) => void;
  ageGroup?: string;
  setAgeGroup?: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="comp-modal-overlay" onClick={onClose}>
      <div className="comp-modal" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <div className="comp-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Trophy size={20} color="#f59e0b" />
            <h3 style={{ margin: 0 }}>إدراج مسابقة / بطولة رسمية جديدة</h3>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="comp-form-group">
            <label>اسم البطولة / المسابقة *</label>
            <input
              type="text"
              className="comp-form-input"
              placeholder="مثال: بطولة الجمهورية للروبوتات WRO Egypt 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="comp-form-group">
              <label>الجهة المنظمة *</label>
              <input
                type="text"
                className="comp-form-input"
                placeholder="مثال: الاتحاد المصري للروبوتات / IEEE Egypt"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                required
              />
            </div>

            <div className="comp-form-group">
              <label>المستوى التنافسي</label>
              <select
                className="comp-form-select"
                value={level || "NATIONAL"}
                onChange={(e) => setLevel?.(e.target.value)}
              >
                <option value="LOCAL">بطولة داخلية / محلية (Local)</option>
                <option value="NATIONAL">بطولة جمهورية / وطنية (National 🇪🇬)</option>
                <option value="REGIONAL">بطولة عربية / إقليمية (Regional 🌍)</option>
                <option value="INTERNATIONAL">بطولة دولية / عالمية (International 🏆)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="comp-form-group">
              <label>المسار التخصصي</label>
              <select
                className="comp-form-select"
                value={track}
                onChange={(e) => setTrack(e.target.value)}
              >
                <option value="robotics">روبوتكس وميكانيكا (Robotics)</option>
                <option value="ai">ذكاء اصطناعي وتعلم آلة (AI & ML)</option>
                <option value="programming">برمجة وهاكاثون (Coding & Algorithms)</option>
                <option value="electronics">إلكترونيات وIoT (Embedded & IoT)</option>
              </select>
            </div>

            <div className="comp-form-group">
              <label>الموسم الدراسي</label>
              <input
                type="text"
                className="comp-form-input"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="comp-form-group">
              <label>موعد الفعالية / التصفيات</label>
              <input
                type="date"
                className="comp-form-input"
                value={eventDate || ""}
                onChange={(e) => setEventDate?.(e.target.value)}
              />
            </div>

            <div className="comp-form-group">
              <label>الفئة العمرية المستهدفة</label>
              <input
                type="text"
                className="comp-form-input"
                placeholder="مثال: 8 - 15 سنة"
                value={ageGroup || ""}
                onChange={(e) => setAgeGroup?.(e.target.value)}
              />
            </div>
          </div>

          <div className="comp-form-group">
            <label>مكان إقامة البطولة</label>
            <input
              type="text"
              className="comp-form-input"
              placeholder="مثال: الصالة المغطاة - مجمع الصالات باستاد القاهرة الدولي"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="comp-modal-actions">
            <button
              type="button"
              className="comp-btn-secondary"
              style={{ color: "#334155", borderColor: "#cbd5e1" }}
              onClick={onClose}
            >
              إلغاء
            </button>
            <button type="submit" className="comp-btn-primary">
              حفظ وإدراج البطولة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateTeamModal({
  isOpen,
  onClose,
  name,
  setName,
  project,
  setProject,
  coachId,
  setCoachId,
  kitType,
  setKitType,
  bootcampDate,
  setBootcampDate,
  trainingFee,
  setTrainingFee,
  installments,
  setInstallments,
  coachesList = [],
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  setName: (v: string) => void;
  project: string;
  setProject: (v: string) => void;
  coachId?: string;
  setCoachId?: (v: string) => void;
  kitType?: string;
  setKitType?: (v: string) => void;
  bootcampDate?: string;
  setBootcampDate?: (v: string) => void;
  trainingFee?: number;
  setTrainingFee?: (v: number) => void;
  installments?: Array<{ name: string; amount: number; dueDate?: string }>;
  setInstallments?: (v: Array<{ name: string; amount: number; dueDate?: string }>) => void;
  coachesList?: Array<{ id: string; fullName: string }>;
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (!isOpen) return null;

  const handleAddInstallment = () => {
    if (!setInstallments || !installments) return;
    setInstallments([
      ...installments,
      { name: `قسط #${installments.length + 1}`, amount: 500, dueDate: "" },
    ]);
  };

  const handleRemoveInstallment = (index: number) => {
    if (!setInstallments || !installments) return;
    setInstallments(installments.filter((_, i) => i !== index));
  };

  const handleInstallmentChange = (
    index: number,
    field: "name" | "amount" | "dueDate",
    val: string | number
  ) => {
    if (!setInstallments || !installments) return;
    const updated = [...installments];
    updated[index] = { ...updated[index], [field]: val };
    setInstallments(updated);
  };

  return (
    <div className="comp-modal-overlay" onClick={onClose}>
      <div
        className="comp-modal"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "600px" }}
      >
        <div className="comp-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={20} color="#0d9488" />
            <h3 style={{ margin: 0 }}>تشكيل فريق وبدء معسكر الإعداد (Bootcamp)</h3>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="comp-form-group">
            <label>اسم الفريق التنافسي *</label>
            <input
              type="text"
              className="comp-form-input"
              placeholder="مثال: RoboTitans Dokki / CyberNinjas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="comp-form-group">
            <label>فكرة / عنوان مشروع الابتكار (Innovation Project)</label>
            <input
              type="text"
              className="comp-form-input"
              placeholder="مثال: روبوت ذكي لتنظيف الشواطئ وفرز المخلفات ذاتياً"
              value={project}
              onChange={(e) => setProject(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="comp-form-group">
              <label>المدرب المسؤول عن الفريق</label>
              <select
                className="comp-form-select"
                value={coachId || ""}
                onChange={(e) => setCoachId?.(e.target.value)}
              >
                <option value="">-- اختر المدرب / الكوتش --</option>
                {coachesList.length > 0 ? (
                  coachesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="coach-1">كوتش أحمد محمود</option>
                    <option value="coach-2">كوتش سارة كمال</option>
                    <option value="coach-3">كوتش يوسف عماد</option>
                  </>
                )}
              </select>
            </div>

            <div className="comp-form-group">
              <label>حقيبة التدريب المخصصة</label>
              <select
                className="comp-form-select"
                value={kitType || "SPIKE_PRIME"}
                onChange={(e) => setKitType?.(e.target.value)}
              >
                <option value="SPIKE_PRIME">LEGO Education SPIKE Prime 🤖</option>
                <option value="EV3">LEGO Mindstorms EV3</option>
                <option value="ARDUINO_IOT">Arduino Mega & IoT Sensors ⚡</option>
                <option value="RASPBERRY_AI">Raspberry Pi 5 & OpenCV AI 🧠</option>
                <option value="SOFTWARE_ONLY">برمجيات ومحاكاة فقط (Code Only) 💻</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="comp-form-group">
              <label>تاريخ بدء المعسكر التدريبي</label>
              <input
                type="date"
                className="comp-form-input"
                value={bootcampDate || ""}
                onChange={(e) => setBootcampDate?.(e.target.value)}
              />
            </div>

            <div className="comp-form-group">
              <label>رسوم اشتراك المعسكر للطالب (ج.م)</label>
              <input
                type="number"
                className="comp-form-input"
                placeholder="مثال: 1500"
                value={trainingFee || ""}
                onChange={(e) => setTrainingFee?.(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Installment breakdown if any */}
          {installments && setInstallments && (
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                  جدول أقساط تدريب المعسكر (اختياري)
                </span>
                <button
                  type="button"
                  onClick={handleAddInstallment}
                  style={{
                    background: "#0d9488",
                    color: "#fff",
                    border: 0,
                    borderRadius: "6px",
                    padding: "3px 8px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Plus size={12} />
                  <span>إضافة قسط</span>
                </button>
              </div>

              {installments.length === 0 ? (
                <small style={{ color: "#94a3b8" }}>
                  لم يتم تحديد أقساط؛ سيتم تحصيل المبلغ دفعة واحدة عند التسجيل.
                </small>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {installments.map((inst, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1.5fr 2fr auto",
                        gap: "6px",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="text"
                        className="comp-form-input"
                        style={{ padding: "5px 8px", fontSize: "12px" }}
                        placeholder="اسم القسط (مثل: دفعة أولى)"
                        value={inst.name}
                        onChange={(e) => handleInstallmentChange(idx, "name", e.target.value)}
                      />
                      <input
                        type="number"
                        className="comp-form-input"
                        style={{ padding: "5px 8px", fontSize: "12px" }}
                        placeholder="المبلغ ج.م"
                        value={inst.amount}
                        onChange={(e) =>
                          handleInstallmentChange(idx, "amount", Number(e.target.value))
                        }
                      />
                      <input
                        type="date"
                        className="comp-form-input"
                        style={{ padding: "5px 8px", fontSize: "12px" }}
                        value={inst.dueDate || ""}
                        onChange={(e) => handleInstallmentChange(idx, "dueDate", e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveInstallment(idx)}
                        style={{
                          background: "none",
                          border: 0,
                          color: "#ef4444",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="comp-modal-actions">
            <button
              type="button"
              className="comp-btn-secondary"
              style={{ color: "#334155", borderColor: "#cbd5e1" }}
              onClick={onClose}
            >
              إلغاء
            </button>
            <button type="submit" className="comp-btn-primary">
              تشكيل الفريق وبدء الإعداد
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddTeamMemberModal({
  isOpen,
  team,
  onClose,
  studentId,
  setStudentId,
  role,
  setRole,
  studentsList,
  onSubmit,
}: {
  isOpen: boolean;
  team: CompetitionTeamItem | null;
  onClose: () => void;
  studentId: string;
  setStudentId: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  studentsList: Array<{ id: string; fullName: string }>;
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (!isOpen || !team) return null;

  return (
    <div className="comp-modal-overlay" onClick={onClose}>
      <div className="comp-modal" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <div className="comp-modal-header">
          <h3>إضافة طالب لفريق: {team.name}</h3>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="comp-form-group">
            <label>اختر الطالب من الأكاديمية *</label>
            <select
              className="comp-form-select"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            >
              <option value="">-- اختر من طلاب الأكاديمية --</option>
              {studentsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="comp-form-group">
            <label>الدور التخصصي في الفريق</label>
            <select
              className="comp-form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="TEAM_CAPTAIN">كابتن وقائد الفريق (Team Captain)</option>
              <option value="LEAD_PROGRAMMER">المبرمج الرئيسي (Lead Programmer)</option>
              <option value="MECHANICAL_BUILDER">مهندس البناء والميكانيكا (Mechanical Builder)</option>
              <option value="RESEARCHER_PRESENTER">باحث وعارض المشروع (Researcher & Presenter)</option>
              <option value="STRATEGIST">مخطط الاستراتيجية والمناورات (Strategist)</option>
            </select>
          </div>

          <div className="comp-modal-actions">
            <button
              type="button"
              className="comp-btn-secondary"
              style={{ color: "#334155", borderColor: "#cbd5e1" }}
              onClick={onClose}
            >
              إلغاء
            </button>
            <button type="submit" className="comp-btn-primary">
              ضم الطالب للفريق
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RecordAwardModal({
  isOpen,
  team,
  onClose,
  title,
  setTitle,
  rank,
  setRank,
  awardKind,
  setAwardKind,
  cashPrize,
  setCashPrize,
  onSubmit,
}: {
  isOpen: boolean;
  team: CompetitionTeamItem | null;
  onClose: () => void;
  title: string;
  setTitle: (v: string) => void;
  rank: number;
  setRank: (v: number) => void;
  awardKind?: string;
  setAwardKind?: (v: string) => void;
  cashPrize?: number;
  setCashPrize?: (v: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (!isOpen || !team) return null;

  return (
    <div className="comp-modal-overlay" onClick={onClose}>
      <div className="comp-modal" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <div className="comp-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Trophy size={20} color="#f59e0b" />
            <h3 style={{ margin: 0 }}>توثيق جائزة ونشر في لوحة الشرف 🏆</h3>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="comp-form-group">
            <label>الفريق المكرم</label>
            <input
              type="text"
              className="comp-form-input"
              value={team.name}
              disabled
              style={{ background: "#f1f5f9", fontWeight: 700 }}
            />
          </div>

          <div className="comp-form-group">
            <label>عنوان الجائزة / التكريم *</label>
            <input
              type="text"
              className="comp-form-input"
              placeholder="مثال: المركز الأول جمهورية - أفضل تصميم روبوت وأداء ميكانيكي"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="comp-form-group">
              <label>الترتيب التنافسي</label>
              <select
                className="comp-form-select"
                value={rank}
                onChange={(e) => setRank(Number(e.target.value))}
              >
                <option value="1">المركز الأول 🥇 (Champion)</option>
                <option value="2">المركز الثاني 🥈 (Runner Up)</option>
                <option value="3">المركز الثالث 🥉</option>
                <option value="4">جائزة تميز خاصة 🎖️</option>
              </select>
            </div>

            <div className="comp-form-group">
              <label>نوع التميز / الجائزة الخاصة</label>
              <select
                className="comp-form-select"
                value={awardKind || "CHAMPION_1ST"}
                onChange={(e) => setAwardKind?.(e.target.value)}
              >
                <option value="CHAMPION_1ST">بطل البطولة العام 🥇</option>
                <option value="BEST_ROBOT_DESIGN">أفضل تصميم وبناء ميكانيكي (Best Robot Design) 🤖</option>
                <option value="BEST_PROGRAMMING">أفضل كود وبرمجة خوارزميات (Best Code & AI) 💻</option>
                <option value="BEST_TEAMWORK">العمل الجماعي والقيم الأساسية (Best Teamwork) 🤝</option>
                <option value="INNOVATION_RESEARCH">أفضل مشروع ابتكار وبحث علمي (Innovation Award) 💡</option>
                <option value="INTERNATIONAL_QUALIFIED">التأهل لتمثيل مصر بالبطولة الدولية 🌍</option>
                <option value="CUSTOM">وسام تميز مخصص 🎖️</option>
              </select>
            </div>
          </div>

          <div className="comp-form-group">
            <label>قيمة الجائزة المالية النقدية (إن وُجدت - ج.م)</label>
            <input
              type="number"
              className="comp-form-input"
              placeholder="مثال: 5000"
              value={cashPrize || ""}
              onChange={(e) => setCashPrize?.(Number(e.target.value))}
            />
          </div>

          <div className="comp-modal-actions">
            <button
              type="button"
              className="comp-btn-secondary"
              style={{ color: "#334155", borderColor: "#cbd5e1" }}
              onClick={onClose}
            >
              إلغاء
            </button>
            <button type="submit" className="comp-btn-primary">
              نشر وتتويج في لوحة الشرف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
