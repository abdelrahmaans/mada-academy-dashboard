import React, { useState, useEffect } from "react";
import { X, Box, Save } from "lucide-react";
import type { ReadinessKit } from "./types";

interface KitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (kit: ReadinessKit) => void;
  initialKit?: ReadinessKit | null;
}

export function KitModal({ isOpen, onClose, onSave, initialKit }: KitModalProps) {
  const [name, setName] = useState("");
  const [track, setTrack] = useState("روبوتكس ومسابقات");
  const [totalQuantity, setTotalQuantity] = useState(10);
  const [readyQuantity, setReadyQuantity] = useState(10);
  const [maintenanceQuantity, setMaintenanceQuantity] = useState(0);
  const [supportsStudents, setSupportsStudents] = useState("20 طالباً");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (initialKit) {
      setName(initialKit.name);
      setTrack(initialKit.track);
      setTotalQuantity(initialKit.totalQuantity);
      setReadyQuantity(initialKit.readyQuantity);
      setMaintenanceQuantity(initialKit.maintenanceQuantity);
      setSupportsStudents(initialKit.supportsStudents);
      setNotes(initialKit.notes || "");
    } else {
      setName("");
      setTrack("روبوتكس ومسابقات");
      setTotalQuantity(10);
      setReadyQuantity(10);
      setMaintenanceQuantity(0);
      setSupportsStudents("20 طالباً (طالبان / حقيبة)");
      setNotes("");
    }
  }, [initialKit, isOpen]);

  if (!isOpen) return null;

  const handleTotalChange = (val: number) => {
    setTotalQuantity(val);
    if (readyQuantity > val) {
      setReadyQuantity(val);
      setMaintenanceQuantity(0);
    } else {
      setMaintenanceQuantity(Math.max(0, val - readyQuantity));
    }
  };

  const handleReadyChange = (val: number) => {
    const ready = Math.min(val, totalQuantity);
    setReadyQuantity(ready);
    setMaintenanceQuantity(Math.max(0, totalQuantity - ready));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const status: ReadinessKit["status"] =
      maintenanceQuantity === 0 ? "READY" : readyQuantity === 0 ? "MAINTENANCE" : "PARTIAL";

    onSave({
      id: initialKit ? initialKit.id : `kit-${Date.now()}`,
      name: name.trim(),
      track,
      totalQuantity,
      readyQuantity,
      maintenanceQuantity,
      supportsStudents: supportsStudents.trim() || `${readyQuantity * 2} طالباً`,
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
            <span style={{ color: "#0d9488" }}>
              <Box size={20} />
            </span>
            <strong style={{ fontSize: "1.05rem", color: "#0f172a" }}>
              {initialKit ? "تعديل بيانات الحقيبة التعليمية / العتاد" : "إضافة كيت أو طقم تدريبي جديد"}
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
              اسم الحقيبة أو الطقم التعليمي *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: حقائب LEGO SPIKE Prime أو Arduino Starter"
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
                المسار التدريبي
              </label>
              <select
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.88rem",
                  background: "#fff",
                }}
              >
                <option value="روبوتكس ومسابقات">روبوتكس ومسابقات 🤖</option>
                <option value="دوائر إلكترونية و IoT">دوائر إلكترونية و IoT ⚡</option>
                <option value="الروبوتات التنافسية">الروبوتات التنافسية (VEX) 🏆</option>
                <option value="المبتكر الصغير والبرمجة">المبتكر الصغير والبرمجة 🧩</option>
                <option value="التصنيع الرقمي والنماذج">التصنيع الرقمي و3D Printing 🖨️</option>
                <option value="الذكاء الاصطناعي">الذكاء الاصطناعي ورؤية الحاسب 🧠</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                الاستيعاب الطلابي
              </label>
              <input
                type="text"
                value={supportsStudents}
                onChange={(e) => setSupportsStudents(e.target.value)}
                placeholder="مثال: 20 طالباً (طالبان / حقيبة)"
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                إجمالي الأطقم
              </label>
              <input
                type="number"
                min={1}
                max={500}
                required
                value={totalQuantity}
                onChange={(e) => handleTotalChange(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#0f766e", marginBottom: "5px" }}>
                الأطقم الجاهزة ✅
              </label>
              <input
                type="number"
                min={0}
                max={totalQuantity}
                required
                value={readyQuantity}
                onChange={(e) => handleReadyChange(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: "8px",
                  border: "1px solid #0d9488",
                  fontSize: "0.9rem",
                  background: "#f0fdfa",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#b45309", marginBottom: "5px" }}>
                قيد الفحص/الصيانة 🛠️
              </label>
              <input
                type="number"
                min={0}
                max={totalQuantity}
                value={maintenanceQuantity}
                readOnly
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: "8px",
                  border: "1px solid #fde68a",
                  fontSize: "0.9rem",
                  background: "#fffbeb",
                  color: "#92400e",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
              ملاحظات الفحص ونواقص القطع
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: الحقائب محدثة بآخر فيرموير، جاهزة للموسم التدريبي"
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
                background: "#0d9488",
                color: "#fff",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <Save size={15} />
              <span>{initialKit ? "حفظ التعديلات" : "إضافة الحقيبة"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
