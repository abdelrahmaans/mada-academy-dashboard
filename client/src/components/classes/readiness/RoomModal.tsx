import React, { useState, useEffect } from "react";
import { X, Building2, Save } from "lucide-react";
import type { ReadinessRoom } from "./types";

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (room: ReadinessRoom) => void;
  initialRoom?: ReadinessRoom | null;
}

export function RoomModal({ isOpen, onClose, onSave, initialRoom }: RoomModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("معمل عتاد وروبوتكس");
  const [capacity, setCapacity] = useState(12);
  const [status, setStatus] = useState<ReadinessRoom["status"]>("AVAILABLE");
  const [equipmentText, setEquipmentText] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (initialRoom) {
      setName(initialRoom.name);
      setType(initialRoom.type);
      setCapacity(initialRoom.capacity);
      setStatus(initialRoom.status);
      setEquipmentText(initialRoom.equipment.join("\n"));
      setNotes(initialRoom.notes || "");
    } else {
      setName("");
      setType("معمل عتاد وروبوتكس");
      setCapacity(12);
      setStatus("AVAILABLE");
      setEquipmentText("12 جهاز لابتوب Core i7\nشاشة تفاعلية 65 بوصة\nطاولة حلبة WRO الرسمية");
      setNotes("");
    }
  }, [initialRoom, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const equipment = equipmentText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    onSave({
      id: initialRoom ? initialRoom.id : `room-${Date.now()}`,
      name: name.trim(),
      type,
      capacity: Number(capacity) || 12,
      equipment,
      status,
      notes: notes.trim(),
      activeGroupsCount: initialRoom ? initialRoom.activeGroupsCount : 0,
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
              <Building2 size={20} />
            </span>
            <strong style={{ fontSize: "1.05rem", color: "#0f172a" }}>
              {initialRoom ? "تعديل بيانات القاعة / المعمل" : "إضافة معمل أو قاعة جديدة"}
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
              اسم القاعة أو المعمل *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: معمل الروبوتكس 1"
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
                نوع القاعة / التخصص
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.88rem",
                  background: "#fff",
                }}
              >
                <option value="معمل عتاد وروبوتكس">معمل عتاد وروبوتكس 🤖</option>
                <option value="قاعة برمجيات وحواسيب">قاعة برمجيات وحواسيب 💻</option>
                <option value="معمل دوائر وتجارب">معمل دوائر وتجارب ⚡</option>
                <option value="قاعة تدريب عامة">قاعة تدريب عامة 🏫</option>
                <option value="فصل الطفولة المبكرة / روضة">فصل الطفولة المبكرة / روضة 👶</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                السعة الاستيعابية (طلاب)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
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
              حالة الجاهزية
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ReadinessRoom["status"])}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.88rem",
                background: "#fff",
              }}
            >
              <option value="AVAILABLE">جاهز ومتاح للتشغيل الكامل ✅</option>
              <option value="IN_MAINTENANCE">صيانة وتجهيز عتاد 🛠️</option>
              <option value="OCCUPIED">مشغول بالكامل ⏳</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
              الأجهزة والتجهيزات المتوفرة (اكتب كل عنصر في سطر مستقل)
            </label>
            <textarea
              rows={3}
              value={equipmentText}
              onChange={(e) => setEquipmentText(e.target.value)}
              placeholder="12 جهاز لابتوب Core i7&#10;شاشة تفاعلية 65 بوصة&#10;طاولة حلبة WRO"
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
              ملاحظات التشغيل والصيانة
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تم تحديث الأجهزة والفحص الدوري الأسبوعي"
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
              <span>{initialRoom ? "حفظ التعديلات" : "إضافة القاعة"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
