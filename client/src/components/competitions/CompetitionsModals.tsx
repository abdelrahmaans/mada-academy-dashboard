import React from "react";
import { X } from "lucide-react";
import type { CompetitionTeamItem } from "@/lib/apiClient";

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
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="comp-modal-overlay">
      <div className="comp-modal">
        <div className="comp-modal-header">
          <h3>إدراج مسابقة / بطولة رسمية جديدة</h3>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="comp-form-group">
            <label>اسم البطولة / المسابقة</label>
            <input
              type="text"
              className="comp-form-input"
              placeholder="مثال: First LEGO League Egypt 2026"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="comp-form-group">
            <label>الجهة المنظمة</label>
            <input
              type="text"
              className="comp-form-input"
              placeholder="مثال: جمعية مصر للثقافة / IEEE Egypt"
              value={organizer}
              onChange={e => setOrganizer(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="comp-form-group">
              <label>المسار</label>
              <select
                className="comp-form-select"
                value={track}
                onChange={e => setTrack(e.target.value)}
              >
                <option value="robotics">روبوتكس وميكانيكا (Robotics)</option>
                <option value="ai">ذكاء اصطناعي (AI)</option>
                <option value="programming">برمجة وهاكاثون (Coding)</option>
              </select>
            </div>

            <div className="comp-form-group">
              <label>الموسم</label>
              <input
                type="text"
                className="comp-form-input"
                value={season}
                onChange={e => setSeason(e.target.value)}
              />
            </div>
          </div>

          <div className="comp-form-group">
            <label>مكان الفعالية</label>
            <input
              type="text"
              className="comp-form-input"
              placeholder="مثال: الصالة المغطاة - استاد القاهرة الدولي"
              value={location}
              onChange={e => setLocation(e.target.value)}
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
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  setName: (v: string) => void;
  project: string;
  setProject: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="comp-modal-overlay">
      <div className="comp-modal">
        <div className="comp-modal-header">
          <h3>تشكيل فريق وبدء الإعداد</h3>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="comp-form-group">
            <label>اسم الفريق التنافسي</label>
            <input
              type="text"
              className="comp-form-input"
              placeholder="مثال: RoboTitans Dokki / CyberNinjas"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="comp-form-group">
            <label>فكرة / عنوان مشروع الابتكار (Innovation Project)</label>
            <input
              type="text"
              className="comp-form-input"
              placeholder="مثال: روبوت ذاتي القيادة لتنظيف المسطحات المائية"
              value={project}
              onChange={e => setProject(e.target.value)}
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
              تشكيل الفريق
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
    <div className="comp-modal-overlay">
      <div className="comp-modal">
        <div className="comp-modal-header">
          <h3>إضافة طالب لفريق: {team.name}</h3>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="comp-form-group">
            <label>اختر الطالب</label>
            <select
              className="comp-form-select"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              required
            >
              <option value="">-- اختر من طلاب الأكاديمية --</option>
              {studentsList.map(s => (
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
              onChange={e => setRole(e.target.value)}
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
  onSubmit,
}: {
  isOpen: boolean;
  team: CompetitionTeamItem | null;
  onClose: () => void;
  title: string;
  setTitle: (v: string) => void;
  rank: number;
  setRank: (v: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (!isOpen || !team) return null;

  return (
    <div className="comp-modal-overlay">
      <div className="comp-modal">
        <div className="comp-modal-header">
          <h3>توثيق جائزة ونشر في لوحة الشرف 🏆</h3>
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
            />
          </div>

          <div className="comp-form-group">
            <label>عنوان الجائزة / التكريم</label>
            <input
              type="text"
              className="comp-form-input"
              placeholder="مثال: المركز الأول جمهورية - أفضل تصميم روبوت وأداء ميكانيكي"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="comp-form-group">
            <label>الترتيب التنافسي</label>
            <select
              className="comp-form-select"
              value={rank}
              onChange={e => setRank(Number(e.target.value))}
            >
              <option value="1">المركز الأول 🥇 (Champion)</option>
              <option value="2">المركز الثاني 🥈 (Runner Up)</option>
              <option value="3">المركز الثالث 🥉</option>
              <option value="4">جائزة تميز خاصة / أفضل ابتكار 🏆</option>
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
              نشر وتتويج في لوحة الشرف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
