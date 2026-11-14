import React, { useRef } from "react";
import { X, Trophy, Share2, Copy, Download, Sparkles, Check, Award, Calendar, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import type { HallOfFameCardItem } from "@/lib/apiClient";

export interface CompetitionsSocialCardModalProps {
  isOpen: boolean;
  award: HallOfFameCardItem | null;
  onClose: () => void;
}

export function CompetitionsSocialCardModal({
  isOpen,
  award,
  onClose,
}: CompetitionsSocialCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !award) return null;

  const rankLabel =
    award.rank === 1
      ? "المركز الأول 🥇 بطل البطولة"
      : award.rank === 2
      ? "المركز الثاني 🥈 الوصيف"
      : award.rank === 3
      ? "المركز الثالث 🥉"
      : "جائزة التميز الخاصة 🏆";

  const socialPostText = `🏆 إنجاز جديد يُضاف للوحة الشرف في أكاديمية مدى! 🌟

بكل فخر واعتزاز، نبارك لأبطال فريق "${award.teamName}" لتحقيقهم:
🎖️ ${award.title} (${rankLabel})
في ${award.competitionName} - تنظيم ${award.organizer}

${award.projectTitle ? `💡 مشروع الابتكار: "${award.projectTitle}"\n` : ""}${
    award.cashPrize ? `💰 بقيمة جائزة مالية: ${award.cashPrize.toLocaleString()} ج.م\n` : ""
}
👨‍🎓 أبطال الفريق:
${award.studentNames.map((s) => `• البطل: ${s}`).join("\n")}

👏 كل الشكر والتقدير لمدرب الفريق: كوتش ${award.coachName} وإدارة فرع ${award.branchName}.
نحو مزيد من التفوق والابتكار لأبنائنا في علوم الروبوتكس والذكاء الاصطناعي! 🚀

#أكاديمية_مدى #MadaAcademy #Robotics #AI #STEM #Champions #HallOfFame`;

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(socialPostText);
      setCopied(true);
      toast.success("تم نسخ نص المنشور بنجاح! جاهز للنشر على فيسبوك وإنستجرام 📋");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("تعذر نسخ النص تلقائياً.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="comp-modal-overlay" onClick={onClose}>
      <div
        className="comp-modal social-card-modal-container"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "680px",
          width: "95vw",
          background: "#0b0f19",
          color: "#f8fafc",
          borderRadius: "20px",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 35px rgba(245, 158, 11, 0.15)",
          padding: "24px",
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <Share2 size={18} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#fef08a" }}>
                كارت التتويج والنشر للسوشيال ميديا 📸
              </h3>
              <small style={{ color: "#94a3b8" }}>
                تصميم احترافي جاهز للمشاركة والحملات التسويقية وفخر الأهالي والطلاب
              </small>
            </div>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            style={{ color: "#94a3b8", background: "rgba(255, 255, 255, 0.05)", borderRadius: "8px" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Visual Luxury Certificate Card */}
        <div
          ref={cardRef}
          className="social-share-card"
          style={{
            position: "relative",
            background: "linear-gradient(145deg, #0f172a 0%, #030712 100%)",
            borderRadius: "16px",
            border: "2px solid #f59e0b",
            padding: "28px 24px",
            overflow: "hidden",
            boxShadow: "inset 0 0 50px rgba(245, 158, 11, 0.08)",
          }}
        >
          {/* Decorative Corner Ornaments */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "120px",
              height: "120px",
              background: "radial-gradient(circle at top right, rgba(245, 158, 11, 0.25), transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "120px",
              height: "120px",
              background: "radial-gradient(circle at bottom left, rgba(13, 148, 136, 0.2), transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Academy Brand Top Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #0d9488, #0f766e)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "18px",
                  color: "#fff",
                  boxShadow: "0 4px 12px rgba(13, 148, 136, 0.4)",
                }}
              >
                M
              </div>
              <div>
                <strong style={{ fontSize: "14px", color: "#f8fafc", display: "block", letterSpacing: "0.5px" }}>
                  أكاديمية مدى للذكاء الاصطناعي والروبوتكس
                </strong>
                <span style={{ fontSize: "11px", color: "#fcd34d", fontWeight: "600" }}>
                  MADA STEM & AI ACADEMY · لوحة الشرف الرسمية
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: "11px",
                background: "rgba(245, 158, 11, 0.15)",
                color: "#fbbf24",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                padding: "4px 10px",
                borderRadius: "20px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Sparkles size={12} /> الموسم {award.season}
            </span>
          </div>

          {/* Central Award Highlight */}
          <div
            style={{
              textAlign: "center",
              margin: "20px 0",
              padding: "16px 12px",
              background: "rgba(245, 158, 11, 0.05)",
              borderRadius: "12px",
              border: "1px dashed rgba(245, 158, 11, 0.3)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(90deg, #f59e0b, #d97706)",
                color: "#ffffff",
                padding: "6px 18px",
                borderRadius: "30px",
                fontSize: "13px",
                fontWeight: "800",
                marginBottom: "12px",
                boxShadow: "0 4px 15px rgba(245, 158, 11, 0.35)",
              }}
            >
              <Trophy size={16} />
              <span>{rankLabel}</span>
            </div>

            <h2
              style={{
                fontSize: "20px",
                fontWeight: "900",
                color: "#fef08a",
                margin: "4px 0 8px 0",
                lineHeight: "1.4",
              }}
            >
              {award.title}
            </h2>

            <p style={{ fontSize: "13px", color: "#cbd5e1", margin: 0 }}>
              في <strong style={{ color: "#38bdf8" }}>{award.competitionName}</strong> ({award.organizer})
            </p>
          </div>

          {/* Team and Project details */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.07)",
              }}
            >
              <small style={{ color: "#94a3b8", display: "block", marginBottom: "3px" }}>
                الفريق التنافسي:
              </small>
              <strong style={{ fontSize: "14px", color: "#38bdf8" }}>{award.teamName}</strong>
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.07)",
              }}
            >
              <small style={{ color: "#94a3b8", display: "block", marginBottom: "3px" }}>
                مشروع الابتكار:
              </small>
              <strong style={{ fontSize: "13px", color: "#f1f5f9" }}>
                {award.projectTitle || "مشروع التحدي والمهام الميكانيكية"}
              </strong>
            </div>
          </div>

          {/* Student Champions List */}
          <div style={{ marginBottom: "18px" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#fbbf24",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "8px",
              }}
            >
              <Award size={14} /> أبطال الأكاديمية المكرمون:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {award.studentNames.map((st, idx) => (
                <span
                  key={idx}
                  style={{
                    background: "rgba(245, 158, 11, 0.12)",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                    color: "#fef08a",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                >
                  ⭐ {st}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Card Footer: Coach, Branch, Date, Cash Prize */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              paddingTop: "14px",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            <div>
              <span>إشراف: </span>
              <strong style={{ color: "#f8fafc" }}>كوتش {award.coachName}</strong>
              <span> · فرع {award.branchName}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {award.cashPrize && award.cashPrize > 0 && (
                <span
                  style={{
                    background: "rgba(16, 185, 129, 0.2)",
                    color: "#34d399",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    fontWeight: "800",
                  }}
                >
                  💵 جائزة مالية: {award.cashPrize.toLocaleString()} ج.م
                </span>
              )}
              <span>{award.awardDate}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "20px",
          }}
        >
          <button
            type="button"
            className="comp-btn-primary"
            onClick={handleCopyCaption}
            style={{
              flex: "1",
              minWidth: "220px",
              background: copied ? "#059669" : "linear-gradient(90deg, #f59e0b, #d97706)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              padding: "12px 18px",
              fontSize: "14px",
              fontWeight: "700",
              color: "#ffffff",
              border: 0,
              borderRadius: "12px",
              cursor: "pointer",
            }}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            <span>{copied ? "تم نسخ نص المنشور (Caption)!" : "نسخ نص المنشور للسوشيال ميديا"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#f8fafc",
              padding: "12px 18px",
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <Download size={16} />
            <span>طباعة وتصدير الكارت</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid #475569",
              color: "#94a3b8",
              padding: "12px 18px",
              borderRadius: "12px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
