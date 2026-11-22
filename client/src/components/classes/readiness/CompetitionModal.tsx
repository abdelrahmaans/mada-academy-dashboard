import React, { useState, useEffect } from "react";
import { X, Trophy, Save } from "lucide-react";
import type { ReadinessCompetition } from "./types";

interface CompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (comp: ReadinessCompetition) => void;
  initialComp?: ReadinessCompetition | null;
}

export function CompetitionModal({ isOpen, onClose, onSave, initialComp }: CompetitionModalProps) {
  const [name, setName] = useState("");
  const [tracksText, setTracksText] = useState("");
  const [targetKits, setTargetKits] = useState("LEGO SPIKE Prime");
  const [registeredTeams, setRegisteredTeams] = useState(1);
  const [studentsCount, setStudentsCount] = useState(4);
  const [status, setStatus] = useState<ReadinessCompetition["status"]>("ACTIVE_PREPARATION");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (initialComp) {
      setName(initialComp.name);
      setTracksText(initialComp.tracks.join("\n"));
      setTargetKits(initialComp.targetKits);
      setRegisteredTeams(initialComp.registeredTeams);
      setStudentsCount(initialComp.studentsCount);
      setStatus(initialComp.status);
      setNotes(initialComp.notes || "");
    } else {
      setName("");
      setTracksText("RoboMission\nFuture Innovators");
      setTargetKits("LEGO SPIKE Prime");
      setRegisteredTeams(1);
      setStudentsCount(4);
      setStatus("ACTIVE_PREPARATION");
      setNotes("");
    }
  }, [initialComp, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tracks = tracksText
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      id: initialComp ? initialComp.id : `comp-${Date.now()}`,
      name: name.trim(),
      tracks: tracks.length > 0 ? tracks : ["تحدي عام"],
      targetKits: targetKits.trim() || "غير محدد",
      registeredTeams: Number(registeredTeams) || 1,
      studentsCount: Number(studentsCount) || 4,
      status,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "16px",
        direction: "rtl",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "520px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#d97706" }}>
              <Trophy size={20} />
            </span>
            <strong style={{ fontSize: "1.05rem", color: "#0f172a" }}>
              {initialComp ? "تعديل بيانات البطولة والفرق" : "تسجيل بطولة أو مسابقة جديدة"}
            </strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: 0,
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px", display: "grid", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
              اسم البطولة أو الأولمبياد *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: أولمبياد الروبوت العالمي (WRO) أو بطولة فيكس (VEX)"
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.9rem",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                الكيتس / العتاد المطلوب
              </label>
              <input
                type="text"
                value={targetKits}
                onChange={(e) => setTargetKits(e.target.value)}
                placeholder="مثال: LEGO SPIKE Prime"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                حالة الاستعداد
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReadinessCompetition["status"])}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.88rem",
                  background: "#fff",
                }}
              >
                <option value="ACTIVE_PREPARATION">استعداد وتدريب نشط 🔥</option>
                <option value="ENROLLED">تم التسجيل الرسمي 📋</option>
                <option value="UPCOMING">قادمة في الخطة ⏳</option>
                <option value="COMPLETED">مكتملة ومؤرشفة 🏆</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                عدد الفرق المشاركة
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={registeredTeams}
                onChange={(e) => setRegisteredTeams(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                إجمالي الطلاب بالفرق
              </label>
              <input
                type="number"
                min={1}
                max={200}
                required
                value={studentsCount}
                onChange={(e) => setStudentsCount(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
              الفئات والتراكات المشاركة (كل تراك في سطر)
            </label>
            <textarea
              rows={2}
              value={tracksText}
              onChange={(e) => setTracksText(e.target.value)}
              placeholder="RoboMission (Elementary)&#10;Future Innovators"
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.88rem",
                resize: "vertical",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
              ملاحظات وتوجيهات الفريق
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تم تركيب الحلبة في المعمل وبدء التدريب على المهام"
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.88rem",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "10px",
              paddingTop: "14px",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 16px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#fff",
                color: "#475569",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              style={{
                padding: "9px 20px",
                borderRadius: "8px",
                border: 0,
                background: "#d97706",
                color: "#fff",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <Save size={15} />
              <span>{initialComp ? "حفظ التعديلات" : "تسجيل البطولة"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
