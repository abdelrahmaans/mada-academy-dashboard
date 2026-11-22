import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Plus,
  ShieldCheck,
  Wifi,
  Cpu,
  ShieldAlert,
  Building2,
} from "lucide-react";
import type { ReadinessCheckItem } from "./types";

interface ReadinessChecklistSectionProps {
  checklist: ReadinessCheckItem[];
  onToggleItem: (itemId: string) => void;
  onAddItem: (title: string, category: ReadinessCheckItem["category"], role: string) => void;
}

export function ReadinessChecklistSection({
  checklist,
  onToggleItem,
  onAddItem,
}: ReadinessChecklistSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<ReadinessCheckItem["category"]>("EQUIPMENT");
  const [newRole, setNewRole] = useState("مدير الفرع");

  const completedCount = checklist.filter((c) => c.checked).length;
  const percent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 100;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddItem(newTitle.trim(), newCategory, newRole.trim());
    setNewTitle("");
    setShowAddForm(false);
  };

  const getCategoryIcon = (cat: ReadinessCheckItem["category"]) => {
    switch (cat) {
      case "NETWORK":
        return <Wifi size={14} color="#2563eb" />;
      case "EQUIPMENT":
        return <Cpu size={14} color="#0d9488" />;
      case "SAFETY":
        return <ShieldAlert size={14} color="#e11d48" />;
      case "FACILITY":
      default:
        return <Building2 size={14} color="#d97706" />;
    }
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "20px 24px",
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#0d9488" }}>
              <ShieldCheck size={20} />
            </span>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
              قائمة الفحص والجاهزية التشغيلية اليومية (Daily Readiness Checklist)
            </h3>
          </div>
          <p style={{ margin: "3px 0 0", fontSize: "0.8rem", color: "#64748b" }}>
            المعايير الفنية الواجب اعتمادها من مدير الفرع والمدربين قبل بدء الجلسات الأسبوعية
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "120px", height: "8px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${percent}%`,
                  height: "100%",
                  background: percent === 100 ? "#0d9488" : "#f59e0b",
                  borderRadius: "99px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: percent === 100 ? "#0f766e" : "#b45309" }}>
              {percent}% مكتمل ({completedCount}/{checklist.length})
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            style={{
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#334155",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <Plus size={14} />
            <span>إضافة فحص</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAdd}
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "14px",
            display: "grid",
            gridTemplateColumns: "1fr auto auto auto",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="اكتب معيار الفحص الجديد..."
            style={{
              padding: "8px 12px",
              borderRadius: "7px",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
            }}
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as ReadinessCheckItem["category"])}
            style={{
              padding: "8px 10px",
              borderRadius: "7px",
              border: "1px solid #cbd5e1",
              fontSize: "0.82rem",
              background: "#fff",
            }}
          >
            <option value="EQUIPMENT">عتاد وأجهزة 🤖</option>
            <option value="NETWORK">شبكة وإنترنت 🌐</option>
            <option value="SAFETY">سلامة وأمان 🛡️</option>
            <option value="FACILITY">قاعات ومرافق 🏢</option>
          </select>
          <input
            type="text"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            placeholder="الدور المسؤول"
            style={{
              width: "120px",
              padding: "8px 10px",
              borderRadius: "7px",
              border: "1px solid #cbd5e1",
              fontSize: "0.82rem",
            }}
          />
          <button
            type="submit"
            style={{
              background: "#0d9488",
              color: "#fff",
              border: 0,
              borderRadius: "7px",
              padding: "8px 14px",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            حفظ
          </button>
        </form>
      )}

      <div style={{ display: "grid", gap: "8px" }}>
        {checklist.map((item) => (
          <div
            key={item.id}
            onClick={() => onToggleItem(item.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderRadius: "9px",
              background: item.checked ? "#f0fdfa" : "#f8fafc",
              border: `1px solid ${item.checked ? "#ccfbf1" : "#e2e8f0"}`,
              cursor: "pointer",
              transition: "all 0.12s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ color: item.checked ? "#0d9488" : "#94a3b8" }}>
                {item.checked ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </span>
              <span
                style={{
                  fontSize: "0.86rem",
                  fontWeight: item.checked ? 600 : 500,
                  color: item.checked ? "#0f172a" : "#475569",
                  textDecoration: item.checked ? "none" : "none",
                }}
              >
                {item.title}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "#64748b",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {getCategoryIcon(item.category)}
                <span>{item.assignedRole}</span>
              </span>
              <small style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{item.updatedAt}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
