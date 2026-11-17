import React, { useState } from "react";
import {
  Trophy,
  X,
  Medal,
  Award,
  Link2,
  FileText,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Users,
  Target,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { saveArchivedProject } from "@/lib/projectArchiveStorage";
import type { CompetitionSummaryItem, CompetitionTeamItem } from "@/lib/apiClient";
import "./PostCompetitionReviewModal.css";

interface Props {
  isOpen: boolean;
  competition: CompetitionSummaryItem | null;
  teams: CompetitionTeamItem[];
  onClose: () => void;
  onSuccess: () => void;
}

export type CompetitionOutcome =
  | "FIRST_PLACE"
  | "SECOND_PLACE"
  | "THIRD_PLACE"
  | "BEST_PROGRAMMING"
  | "BEST_MECHANICAL"
  | "JUDGES_AWARD"
  | "HONORABLE_MENTION";

const OUTCOME_OPTIONS: Array<{ value: CompetitionOutcome; label: string; icon: string }> = [
  { value: "FIRST_PLACE", label: "المركز الأول والكأس الذهبي 🥇", icon: "🏆" },
  { value: "SECOND_PLACE", label: "المركز الثاني والميدالية الفضية 🥈", icon: "🥈" },
  { value: "THIRD_PLACE", label: "المركز الثالث والميدالية البرونزية 🥉", icon: "🥉" },
  { value: "BEST_PROGRAMMING", label: "جائزة أفضل كود وبرمجة ذاتية 💻", icon: "💻" },
  { value: "BEST_MECHANICAL", label: "جائزة أفضل تصميم هندسي وميكانيكي ⚙️", icon: "⚙️" },
  { value: "JUDGES_AWARD", label: "جائزة لجنة التحكيم للابتكار 🌟", icon: "🌟" },
  { value: "HONORABLE_MENTION", label: "شهادة مشاركة مشرفة وتمثيل مشرف ⭐", icon: "⭐" },
];

export function PostCompetitionReviewModal({
  isOpen,
  competition,
  teams,
  onClose,
  onSuccess,
}: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || "");
  const [outcome, setOutcome] = useState<CompetitionOutcome>("FIRST_PLACE");
  const [awardTitle, setAwardTitle] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [strengths, setStrengths] = useState("");
  const [challenges, setChallenges] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !competition) return null;

  const currentTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam) {
      toast.error("يرجى اختيار الفريق");
      return;
    }
    if (!awardTitle.trim()) {
      toast.error("يرجى كتابة عنوان الجائزة أو النتيجة المحققة");
      return;
    }

    setSubmitting(true);
    try {
      const selectedOutcomeMeta = OUTCOME_OPTIONS.find((o) => o.value === outcome);

      // Save to Academy Cloud Projects Archive
      if (driveUrl.trim()) {
        saveArchivedProject({
          teamName: currentTeam.name,
          competitionId: competition.id,
          competitionName: competition.name,
          branchId: "branch-main",
          branchName: currentTeam.branchName || "الفرع الرئيسي",
          teamBadge: selectedOutcomeMeta?.icon || "🏆",
          projectTitle: currentTeam.projectTitle || awardTitle.trim(),
          projectDescription: `[نتائج ما بعد المسابقة: ${awardTitle.trim()}] · نقاط القوة: ${strengths || "ممتاز"} · التحديات: ${challenges || "لا توجد"} · التوصيات: ${recommendations || "متابعة التطوير"}`,
          driveUrl: driveUrl.trim(),
          submittedBy: currentTeam.coachName || "كوتش الأكاديمية",
          submittedByRole: "المدرب المعتمد",
          students:
            currentTeam.members?.map((m) => ({
              studentId: m.id,
              studentName: m.studentName,
              roleInTeam: m.roleInTeam,
            })) || [],
          award: awardTitle.trim(),
          status: "SHOWCASED",
        });
      }

      toast.success(
        `تم اعتماد ونشر نتائج ما بعد المسابقة بنجاح لفريق ${currentTeam.name}! 🏆`
      );
      onSuccess();
      onClose();
    } catch {
      toast.error("تعذر حفظ تقرير ما بعد المسابقة");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="post-comp-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="post-comp-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-comp-title"
      >
        <div className="post-comp-header">
          <div className="post-comp-icon">
            <Trophy size={22} color="#f59e0b" />
          </div>
          <div>
            <h3 id="post-comp-title">توثيق نتائج وتحليل ما بعد المسابقة</h3>
            <p className="post-comp-sub">
              بطولة: <strong>{competition.name}</strong> · الموسم: {competition.season}
            </p>
          </div>
          <button
            type="button"
            className="post-comp-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="post-comp-form">
          <div className="post-comp-grid">
            <label>
              <span>اختر الفريق التنافسي:</span>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (كوتش: {t.coachName})
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>النتيجة / المركز المحقق:</span>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as CompetitionOutcome)}
              >
                {OUTCOME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span>عنوان التتويج والجائزة الرسمية:</span>
            <input
              type="text"
              placeholder="مثال: المركز الأول في برمجة وتحدي مهام الروبوت SPIKE Prime"
              value={awardTitle}
              onChange={(e) => setAwardTitle(e.target.value)}
              required
            />
          </label>

          <label>
            <span>رابط مجلد المشروع السحابي (Google Drive / OneDrive):</span>
            <div className="post-comp-input-icon-wrap">
              <Link2 size={16} />
              <input
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
              />
            </div>
            <small style={{ color: "#64748b", marginTop: "4px", display: "block" }}>
              سيتم حفظ الرابط في أرشيف مشاريع الأكاديمية ليبقى النظام خفيفاً دون استهلاك سعة السيرفر.
            </small>
          </label>

          {/* Technical Post-Mortem & Analysis (التحليل الفني) */}
          <div className="post-comp-analysis-section">
            <h4 className="post-comp-section-title">
              <Sparkles size={16} color="#0d9488" />
              <span>التحليل الفني وتقييم أداء الفريق (Post-Mortem):</span>
            </h4>

            <label>
              <span>نقاط القوة التي ميزت الفريق والروبوت:</span>
              <textarea
                rows={2}
                placeholder="مثال: دقة الحساسات البصرية، سرعة تنفيذ مهام المناورة، وثقة الطلاب في العرض التقديمي..."
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
              />
            </label>

            <label>
              <span>التحديات والمواقف التي واجهها الفريق على الحلبة:</span>
              <textarea
                rows={2}
                placeholder="مثال: انزلاق العجلات في الجولة الثانية، حاجة الكود لمعايرة أفضل مع الإضاءة القوية..."
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
              />
            </label>

            <label>
              <span>التوصيات والدروس المستفادة للمعسكرات القادمة:</span>
              <textarea
                rows={2}
                placeholder="مثال: التركيز على اختبارات الثبات المتكررة، وتدريب بدلاء على كل دور ميكانيكي وبرمجي..."
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
              />
            </label>
          </div>

          <div className="post-comp-footer">
            <button
              type="button"
              className="post-comp-btn cancel"
              onClick={onClose}
              disabled={submitting}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="post-comp-btn submit"
              disabled={submitting}
            >
              <CheckCircle2 size={16} />
              <span>{submitting ? "جارٍ الحفظ والتوثيق…" : "اعتماد النتيجة ونشر التحليل 🏆"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
