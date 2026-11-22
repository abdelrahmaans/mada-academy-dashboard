import React, { useState } from "react";
import {
  Archive,
  Cloud,
  ExternalLink,
  Plus,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  X,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  saveArchivedProject,
  type ProjectArchiveItem,
  type ProjectStudent,
} from "@/lib/projectArchiveStorage";

const TEAM_BADGE_OPTIONS = ["🤖", "🚀", "⚡", "🧠", "🏆", "🦾", "🛰️", "🔬", "🌟", "🎯", "🛸", "⚙️"];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: ProjectArchiveItem) => void;
  tenantId?: string;
  defaultBranchName?: string;
  defaultBranchId?: string;
  defaultCoachName?: string;
  defaultCoachRole?: string;
  competitionsList?: Array<{ id: string; name: string }>;
  availableStudents?: Array<{ id: string; fullName: string }>;
};

export function SubmitProjectArchiveModal({
  isOpen,
  onClose,
  onSuccess,
  tenantId,
  defaultBranchName = "الفرع الرئيسي",
  defaultBranchId = "branch-main",
  defaultCoachName = "كوتش الأكاديمية",
  defaultCoachRole = "المدرب المعتمد",
  competitionsList = [],
  availableStudents = [],
}: Props) {
  const [competitionName, setCompetitionName] = useState(
    competitionsList[0]?.name || "بطولة الأولمبياد العالمي للروبوت (WRO 2026)"
  );
  const [customCompetition, setCustomCompetition] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamBadge, setTeamBadge] = useState("🤖");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [award, setAward] = useState("");
  const [saving, setSaving] = useState(false);

  // Student Members
  const [selectedStudents, setSelectedStudents] = useState<ProjectStudent[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState("");
  const [currentStudentRole, setCurrentStudentRole] = useState("مبرمج الخوارزميات");

  if (!isOpen) return null;

  const handleAddStudent = () => {
    if (!currentStudentId) {
      toast.error("يرجى اختيار طالب لإضافته إلى الفريق");
      return;
    }
    const found = availableStudents.find((s) => s.id === currentStudentId);
    const studentName = found ? found.fullName : currentStudentId;

    if (selectedStudents.some((s) => s.studentId === currentStudentId)) {
      toast.error("هذا الطالب مضاف بالفعل في قائمة الفريق");
      return;
    }

    setSelectedStudents((prev) => [
      ...prev,
      {
        studentId: currentStudentId,
        studentName,
        roleInTeam: currentStudentRole,
      },
    ]);
    setCurrentStudentId("");
  };

  const handleRemoveStudent = (id: string) => {
    setSelectedStudents((prev) => prev.filter((s) => s.studentId !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalCompName =
      competitionName === "CUSTOM" ? customCompetition.trim() : competitionName.trim();

    if (!finalCompName) {
      toast.error("يرجى تحديد اسم البطولة أو المسابقة");
      return;
    }
    if (!teamName.trim()) {
      toast.error("يرجى إدخال اسم الفريق");
      return;
    }
    if (!projectTitle.trim()) {
      toast.error("يرجى إدخال عنوان المشروع أو الروبوت");
      return;
    }
    if (!driveUrl.trim()) {
      toast.error("يرجى إدخال رابط Google Drive أو OneDrive لملفات المشروع");
      return;
    }

    try {
      new URL(driveUrl.trim());
    } catch {
      toast.error("صيغة رابط الدرايف غير صالحة، يرجى كتابة رابط صحيح يبدأ بـ https://");
      return;
    }

    setSaving(true);
    try {
      const created = saveArchivedProject({
        competitionName: finalCompName,
        branchId: defaultBranchId,
        branchName: defaultBranchName,
        teamName: teamName.trim(),
        teamBadge,
        projectTitle: projectTitle.trim(),
        projectDescription: projectDescription.trim(),
        driveUrl: driveUrl.trim(),
        submittedBy: defaultCoachName,
        submittedByRole: defaultCoachRole,
        students: selectedStudents,
        award: award.trim() || undefined,
        status: "APPROVED",
      }, tenantId);

      toast.success("تم توثيق ورفع المشروع في أرشيف الأكاديمية بنجاح 🚀", {
        description: `تم إسناد ${selectedStudents.length} طلاب وسماع المشروع في إنجازاتهم.`,
      });

      onSuccess(created);
      onClose();
    } catch {
      toast.error("تعذر حفظ المشروع في الأرشيف");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="academic-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="archive-modal-title"
        style={{ maxWidth: "680px", width: "95%" }}
      >
        <div className="dialog-top">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "#f0fdfa",
                color: "#0f766e",
              }}
            >
              <Archive size={20} />
            </span>
            <div>
              <h2 id="archive-modal-title" style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
                توثيق ورفع مشروع فريق جديد للأرشيف
              </h2>
              <small style={{ color: "#64748b" }}>
                رفع رابط مجلد العمل السحابي ومخرجات الروبوت وإسناد الطلاب لإنجازاتهم
              </small>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px", marginTop: "14px" }}>
          {/* Competition Picker */}
          <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label className="form-field">
              <span>البطولة / المسابقة / مسار المشروع <b>*</b></span>
              <select
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
                required
              >
                {competitionsList.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
                <option value="بطولة الأولمبياد العالمي للروبوت (WRO 2026)">
                  بطولة الأولمبياد العالمي للروبوت (WRO 2026)
                </option>
                <option value="مسابقة فيرست ليجو الدولية (FLL SuperPowered)">
                  مسابقة فيرست ليجو الدولية (FLL SuperPowered)
                </option>
                <option value="مسابقة الروبوت الوطنية VEX Robotics">
                  مسابقة الروبوت الوطنية VEX Robotics
                </option>
                <option value="مشروع تخرج نهاية المستوى الأكاديمي">
                  مشروع تخرج نهاية المستوى الأكاديمي
                </option>
                <option value="CUSTOM">+ مسار / مسابقة أخرى مخصصة</option>
              </select>
            </label>

            <label className="form-field">
              <span>الفرع والمدرب المسؤول</span>
              <input
                type="text"
                disabled
                value={`فرع ${defaultBranchName} · ${defaultCoachName}`}
                style={{ background: "#f8fafc", color: "#64748b" }}
              />
            </label>
          </div>

          {competitionName === "CUSTOM" && (
            <label className="form-field">
              <span>اسم المسابقة أو المشروع المخصص <b>*</b></span>
              <input
                type="text"
                required
                placeholder="مثال: هاكاثون الابتكار العربي 2026"
                value={customCompetition}
                onChange={(e) => setCustomCompetition(e.target.value)}
              />
            </label>
          )}

          {/* Team Name and Badge */}
          <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
            <label className="form-field">
              <span>اسم الفريق (Team Name) <b>*</b></span>
              <input
                type="text"
                required
                placeholder="مثال: Mada RoboTitans"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </label>

            <label className="form-field">
              <span>شعار وأيقونة الفريق</span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                {TEAM_BADGE_OPTIONS.map((badge) => (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => setTeamBadge(badge)}
                    style={{
                      fontSize: "18px",
                      width: "34px",
                      height: "34px",
                      borderRadius: "8px",
                      border: teamBadge === badge ? "2px solid #0f766e" : "1px solid #e2e8f0",
                      background: teamBadge === badge ? "#ccfbf1" : "#ffffff",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {badge}
                  </button>
                ))}
              </div>
            </label>
          </div>

          {/* Project Title & Description */}
          <label className="form-field">
            <span>عنوان المشروع أو الروبوت (Project Title) <b>*</b></span>
            <input
              type="text"
              required
              placeholder="مثال: ذراع آلي ذكي لفرز النفايات بالذكاء الاصطناعي والكاميرا"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
            />
          </label>

          <label className="form-field">
            <span>ملخص الفكرة والابتكار التقني</span>
            <textarea
              rows={2}
              placeholder="اكتب نبذة عن التحدي الذي يحله الروبوت، ونوع الحساسات واللغات المستخدمة..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
            />
          </label>

          {/* Cloud Drive URL */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#f0fdfa",
              border: "1px solid #99f6e4",
              display: "grid",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f766e" }}>
              <Cloud size={18} />
              <strong style={{ fontSize: "13px" }}>
                رابط المجلد السحابي (Google Drive / OneDrive / GitHub) *
              </strong>
            </div>
            <input
              type="url"
              required
              dir="ltr"
              placeholder="https://drive.google.com/drive/folders/your-team-project"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid #0d9488",
                background: "#ffffff",
                fontFamily: "monospace",
                fontSize: "13px",
              }}
            />
            <small style={{ color: "#0f766e", fontSize: "11px", lineHeight: "1.5" }}>
              💡 يرفع المدرب رابط الدرايف للملفات والفيديوهات والأكواد دون إجهاد السيرفر، ليكون متاحاً
              للمركز والأكاديمية وأولياء الأمور للوصول المباشر.
            </small>
          </div>

          {/* Student Members Assignment */}
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "12px",
              background: "#fafafa",
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
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Users size={16} color="#475569" />
                <strong style={{ fontSize: "13px", color: "#1e293b" }}>
                  الطلاب المشاركون في الفريق ({selectedStudents.length} طلاب مسندون)
                </strong>
              </div>
              <small style={{ color: "#64748b" }}>يسمع فوراً في إنجازات الطالب وبوابة ولي الأمر</small>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              {availableStudents.length > 0 ? (
                <select
                  value={currentStudentId}
                  onChange={(e) => setCurrentStudentId(e.target.value)}
                  style={{ flex: 1, padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                >
                  <option value="">-- اختر طالباً من طلاب الأكاديمية --</option>
                  {availableStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="اكتب اسم الطالب..."
                  value={currentStudentId}
                  onChange={(e) => setCurrentStudentId(e.target.value)}
                  style={{ flex: 1, padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              )}

              <select
                value={currentStudentRole}
                onChange={(e) => setCurrentStudentRole(e.target.value)}
                style={{ width: "160px", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              >
                <option value="قائد الفريق والبرمجة">قائد الفريق</option>
                <option value="مبرمج الخوارزميات">مبرمج الخوارزميات</option>
                <option value="مصمم الميكانيكا والهيكل">مصمم الميكانيكا</option>
                <option value="متحكم الحساسات والمحركات">مهندس الحساسات</option>
                <option value="عرض المشروع والبحث العلمي">باحث ومتحدث الفريق</option>
              </select>

              <button
                type="button"
                onClick={handleAddStudent}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#0f766e",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "12px",
                }}
              >
                <UserPlus size={14} /> إضافة
              </button>
            </div>

            {selectedStudents.length === 0 ? (
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", textAlign: "center", padding: "6px" }}>
                لم يتم إضافة طلاب بعد. اختر الطالب ودوره في الفريق وانقر على "إضافة".
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedStudents.map((s) => (
                  <span
                    key={s.studentId}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "20px",
                      padding: "4px 10px",
                      fontSize: "12px",
                      color: "#1e293b",
                    }}
                  >
                    <strong>{s.studentName}</strong>
                    <span style={{ color: "#0d9488", fontSize: "11px" }}>({s.roleInTeam})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStudent(s.studentId)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        padding: 0,
                        display: "flex",
                      }}
                      aria-label="حذف"
                    >
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Award / Medal */}
          <label className="form-field">
            <span>المركز أو الجائزة المحققة (اختياري)</span>
            <input
              type="text"
              placeholder="مثال: المركز الأول على مستوى الجمهورية 🏆 أو شهادة أفضل تصميم ميكانيكي"
              value={award}
              onChange={(e) => setAward(e.target.value)}
            />
          </label>

          <div className="dialog-actions">
            <button type="button" className="button button-secondary" onClick={onClose}>
              إلغاء
            </button>
            <button type="submit" disabled={saving} className="button button-primary">
              <Sparkles size={14} /> {saving ? "جارٍ الحفظ…" : "توثيق المشروع في الأرشيف ✓"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
