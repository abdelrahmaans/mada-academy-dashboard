import React from "react";
import {
  Trophy,
  Users,
  Box,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import type { ReadinessCompetition } from "./types";

interface ReadinessCompetitionsSectionProps {
  competitions: ReadinessCompetition[];
  onOpenAddCompetition: () => void;
  onEditCompetition: (comp: ReadinessCompetition) => void;
  onDeleteCompetition: (compId: string) => void;
}

export function ReadinessCompetitionsSection({
  competitions,
  onOpenAddCompetition,
  onEditCompetition,
  onDeleteCompetition,
}: ReadinessCompetitionsSectionProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
            جاهزية بطولات ومسابقات الفرع ({competitions.length})
          </h3>
          <p style={{ margin: "3px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
            الاستعداد لأولمبياد الروبوت WRO و FLL وتجهيز الحلبات وتسكين فرق المتسابقين
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddCompetition}
          style={{
            background: "#d97706",
            color: "#ffffff",
            border: 0,
            borderRadius: "9px",
            padding: "8px 16px",
            fontSize: "0.84rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Plus size={15} />
          <span>تسجيل بطولة جديدة</span>
        </button>
      </div>

      {competitions.length === 0 ? (
        <div
          style={{
            background: "#f8fafc",
            border: "1px dashed #cbd5e1",
            borderRadius: "14px",
            padding: "36px",
            textAlign: "center",
          }}
        >
          <Trophy size={36} color="#94a3b8" style={{ margin: "0 auto 10px" }} />
          <h4 style={{ margin: "0 0 6px", color: "#1e293b", fontSize: "1rem" }}>لا توجد مسابقات مسجلة حالياً</h4>
          <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "0.85rem" }}>
            سجل البطولات التي يستعد طلاب الفرع للمنافسة فيها لتخصيص الحلبات والأطقم التنافسية.
          </p>
          <button
            type="button"
            onClick={onOpenAddCompetition}
            style={{
              background: "#d97706",
              color: "#fff",
              border: 0,
              borderRadius: "8px",
              padding: "9px 18px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            + تسجيل أول بطولة
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
          {competitions.map((comp) => {
            const isPrep = comp.status === "ACTIVE_PREPARATION";
            const isEnrolled = comp.status === "ENROLLED";

            return (
              <div
                key={comp.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "18px 20px",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "14px",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: isPrep ? "#fef3c7" : isEnrolled ? "#f0fdfa" : "#f1f5f9",
                          color: isPrep ? "#b45309" : isEnrolled ? "#0f766e" : "#475569",
                          border: `1px solid ${isPrep ? "#fde68a" : isEnrolled ? "#ccfbf1" : "#e2e8f0"}`,
                          display: "inline-block",
                          marginBottom: "6px",
                        }}
                      >
                        {isPrep ? "استعداد وتدريب نشط 🔥" : isEnrolled ? "تسجيل رسمي معتمد 📋" : "مجدولة في الخطة ⏳"}
                      </span>
                      <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                        {comp.name}
                      </h4>
                    </div>

                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        type="button"
                        onClick={() => onEditCompetition(comp)}
                        title="تعديل البطولة"
                        style={{
                          background: "transparent",
                          border: 0,
                          color: "#64748b",
                          cursor: "pointer",
                          padding: "5px",
                          borderRadius: "6px",
                        }}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCompetition(comp.id)}
                        title="حذف البطولة"
                        style={{
                          background: "transparent",
                          border: 0,
                          color: "#ef4444",
                          cursor: "pointer",
                          padding: "5px",
                          borderRadius: "6px",
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "14px", fontSize: "0.82rem", color: "#64748b", margin: "10px 0" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <Trophy size={14} color="#d97706" />
                      <span>الفرق: <strong>{comp.registeredTeams} فرق</strong></span>
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <Users size={14} color="#2563eb" />
                      <span>الطلاب: <strong>{comp.studentsCount} متسابق</strong></span>
                    </span>
                  </div>

                  <div style={{ margin: "6px 0 10px", fontSize: "0.8rem", color: "#475569" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <Box size={14} color="#0d9488" />
                      <span>العتاد المستهدف: <strong>{comp.targetKits}</strong></span>
                    </span>
                  </div>

                  {/* Tracks */}
                  {comp.tracks.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                      {comp.tracks.map((tr, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: "#fffbeb",
                            border: "1px solid #fef3c7",
                            borderRadius: "6px",
                            padding: "3px 8px",
                            fontSize: "0.74rem",
                            color: "#92400e",
                            fontWeight: 600,
                          }}
                        >
                          {tr}
                        </span>
                      ))}
                    </div>
                  )}

                  {comp.notes && (
                    <p style={{ margin: "4px 0 0", fontSize: "0.76rem", color: "#64748b", fontStyle: "italic", lineHeight: 1.4 }}>
                      💡 {comp.notes}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "10px",
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    متابعة كوتش المسابقات وتدريبات الحلبة
                  </span>
                  <button
                    type="button"
                    onClick={() => onEditCompetition(comp)}
                    style={{
                      background: "transparent",
                      border: 0,
                      color: "#d97706",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: "4px 8px",
                    }}
                  >
                    تعديل البيانات
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
