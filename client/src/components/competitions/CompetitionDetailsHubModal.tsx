import React, { useState } from "react";
import {
  Trophy,
  X,
  Calendar,
  MapPin,
  Users,
  Compass,
  Plus,
  Archive,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  Cpu,
  GraduationCap,
  Award,
} from "lucide-react";
import type { CompetitionSummaryItem, CompetitionTeamItem } from "@/lib/apiClient";
import "./CompetitionDetailsHubModal.css";

interface Props {
  isOpen: boolean;
  competition: CompetitionSummaryItem | null;
  teams: CompetitionTeamItem[];
  onClose: () => void;
  onCreateTeam: () => void;
  onPostCompetitionReview: () => void;
  onArchiveProject: () => void;
}

export function CompetitionDetailsHubModal({
  isOpen,
  competition,
  teams,
  onClose,
  onCreateTeam,
  onPostCompetitionReview,
  onArchiveProject,
}: Props) {
  const [activeTab, setActiveTab] = useState<"TEAMS" | "INFO">("TEAMS");

  if (!isOpen || !competition) return null;

  return (
    <div
      className="comp-details-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="comp-details-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="comp-details-title"
      >
        {/* Header */}
        <div className="comp-details-header">
          <div className="comp-details-meta">
            <div className="comp-details-icon">
              <Trophy size={24} color="#f59e0b" />
            </div>
            <div>
              <div className="comp-details-badges">
                <span className={`comp-track-badge track-${competition.track}`}>
                  {competition.track === "robotics" ? "مسار الروبوتكس" : competition.track === "ai" ? "ذكاء اصطناعي" : "برمجة"}
                </span>
                <span className="comp-season-badge">الموسم {competition.season}</span>
              </div>
              <h3 id="comp-details-title">{competition.name}</h3>
              <p className="comp-details-sub">
                الجهة المنظمة: <strong>{competition.organizer}</strong> · الفئة العمرية: {competition.ageMin} - {competition.ageMax} سنة
              </p>
            </div>
          </div>

          <button
            type="button"
            className="comp-details-close-btn"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Operations Toolbar (العمليات أولاً بشكل سهل) */}
        <div className="comp-details-actions-bar">
          <div className="comp-actions-group">
            <button
              type="button"
              className="comp-action-btn primary"
              onClick={() => {
                onClose();
                onCreateTeam();
              }}
            >
              <Plus size={15} />
              <span>تشكيل فريق ومعسكر جديد ⚡</span>
            </button>

            <button
              type="button"
              className="comp-action-btn review"
              onClick={() => {
                onClose();
                onPostCompetitionReview();
              }}
            >
              <Sparkles size={15} />
              <span>تسجيل نتائج وتحليل ما بعد المسابقة 🏆</span>
            </button>

            <button
              type="button"
              className="comp-action-btn archive"
              onClick={() => {
                onClose();
                onArchiveProject();
              }}
            >
              <Archive size={15} />
              <span>توثيق مشروع في الأرشيف (Drive)</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="comp-details-body">
          {/* Summary Stats */}
          <div className="comp-details-stats">
            <div className="comp-stat-pill">
              <span className="pill-label">الفرق التنافسية:</span>
              <strong>{teams.length} فريق</strong>
            </div>
            <div className="comp-stat-pill">
              <span className="pill-label">موعد الفعالية:</span>
              <strong>{competition.eventDate ?? "قيد التحديد"}</strong>
            </div>
            <div className="comp-stat-pill">
              <span className="pill-label">مقر إقامة المسابقة:</span>
              <strong>{competition.location ?? "محلي / إقليمي"}</strong>
            </div>
            <div className="comp-stat-pill">
              <span className="pill-label">الأوسمة والجوائز:</span>
              <strong style={{ color: "#d97706" }}>{competition.awardsCount} أوسمة معتمدة</strong>
            </div>
          </div>

          {/* Teams Roster Grid */}
          <div className="comp-teams-section">
            <div className="comp-teams-header">
              <Users size={16} color="#0d9488" />
              <span>الفرق التنافسية المشاركة في هذه البطولة ({teams.length} فرق):</span>
            </div>

            {teams.length === 0 ? (
              <div className="comp-teams-empty">
                <Users size={32} color="#94a3b8" />
                <p>لا توجد فرق مسجلة في هذه البطولة حتى الآن.</p>
                <button
                  type="button"
                  className="comp-action-btn primary"
                  onClick={() => {
                    onClose();
                    onCreateTeam();
                  }}
                >
                  <Plus size={14} /> تشكيل أول فريق الآن
                </button>
              </div>
            ) : (
              <div className="comp-teams-cards-list">
                {teams.map((team) => (
                  <div key={team.id} className="comp-hub-team-card">
                    <div className="comp-hub-team-head">
                      <div>
                        <h4>{team.name}</h4>
                        <small>
                          الفرع: {team.branchName || "الفرع الرئيسي"} · كوتش الفريق: {team.coachName}
                        </small>
                      </div>
                      <span className={`comp-hub-status-chip ${team.status.toLowerCase()}`}>
                        {team.status === "BOOTCAMP"
                          ? "معسكر تدريب مكثف ⚡"
                          : team.status === "READY"
                          ? "جاهز للمنافسة ✅"
                          : team.status === "AWARDED"
                          ? "متوج بالجوائز 🏆"
                          : team.status}
                      </span>
                    </div>

                    <div className="comp-hub-badges-row">
                      <span className="comp-hub-kit-badge">
                        <Cpu size={12} /> {team.kitCode || "LEGO SPIKE Prime"}
                      </span>
                      {team.projectTitle && (
                        <span className="comp-hub-proj-badge">
                          مشروع: {team.projectTitle}
                        </span>
                      )}
                    </div>

                    {/* Members List */}
                    <div className="comp-hub-members-box">
                      <span className="comp-hub-members-label">أعضاء الفريق المتدربون ({team.members?.length || 0}):</span>
                      <div className="comp-hub-members-pills">
                        {team.members && team.members.length > 0 ? (
                          team.members.map((m) => (
                            <span key={m.id} className="comp-hub-member-pill">
                              <GraduationCap size={11} />
                              <strong>{m.studentName}</strong>
                              <small>
                                ({m.roleInTeam === "TEAM_CAPTAIN" ? "كابتن" : m.roleInTeam === "LEAD_PROGRAMMER" ? "مبرمج" : "ميكانيكا"})
                              </small>
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                            لم يتم ضم طلاب بعد
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="comp-details-footer">
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            مربوط بنظام لوحة الشرف وأرشيف مشاريع الأكاديمية
          </span>
          <button
            type="button"
            className="comp-details-footer-close"
            onClick={onClose}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
