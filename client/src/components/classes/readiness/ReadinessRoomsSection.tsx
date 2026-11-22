import React from "react";
import {
  Building2,
  Users,
  Monitor,
  Wrench,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
} from "lucide-react";
import type { ReadinessRoom } from "./types";

interface ReadinessRoomsSectionProps {
  rooms: ReadinessRoom[];
  onOpenAddRoom: () => void;
  onEditRoom: (room: ReadinessRoom) => void;
  onDeleteRoom: (roomId: string) => void;
}

export function ReadinessRoomsSection({
  rooms,
  onOpenAddRoom,
  onEditRoom,
  onDeleteRoom,
}: ReadinessRoomsSectionProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
            القاعات والمعامل المجهزة بالفرع ({rooms.length})
          </h3>
          <p style={{ margin: "3px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
            إجمالي السعة، الأجهزة المتوفرة، والجاهزية الفنية قبل بدء الحصص
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddRoom}
          style={{
            background: "#0d9488",
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
          <span>إضافة قاعة جديدة</span>
        </button>
      </div>

      {rooms.length === 0 ? (
        <div
          style={{
            background: "#f8fafc",
            border: "1px dashed #cbd5e1",
            borderRadius: "14px",
            padding: "36px",
            textAlign: "center",
          }}
        >
          <Building2 size={36} color="#94a3b8" style={{ margin: "0 auto 10px" }} />
          <h4 style={{ margin: "0 0 6px", color: "#1e293b", fontSize: "1rem" }}>لا توجد قاعات مضافة حالياً في هذا الفرع</h4>
          <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "0.85rem" }}>
            ابدأ بتعريف قاعات ومعامل الفرع لتتمكن من تسكين المجموعات وتحديد الطاقة الاستيعابية.
          </p>
          <button
            type="button"
            onClick={onOpenAddRoom}
            style={{
              background: "#0d9488",
              color: "#fff",
              border: 0,
              borderRadius: "8px",
              padding: "9px 18px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            + إضافة أول قاعة
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
          {rooms.map((room) => {
            const isAvail = room.status === "AVAILABLE";
            const isMaint = room.status === "IN_MAINTENANCE";

            return (
              <div
                key={room.id}
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
                  transition: "border-color 0.15s ease",
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
                          background: isAvail ? "#f0fdfa" : isMaint ? "#fffbeb" : "#f1f5f9",
                          color: isAvail ? "#0f766e" : isMaint ? "#b45309" : "#475569",
                          border: `1px solid ${isAvail ? "#ccfbf1" : isMaint ? "#fde68a" : "#e2e8f0"}`,
                          display: "inline-block",
                          marginBottom: "6px",
                        }}
                      >
                        {room.type}
                      </span>
                      <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                        {room.name}
                      </h4>
                    </div>

                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        type="button"
                        onClick={() => onEditRoom(room)}
                        title="تعديل القاعة"
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
                        onClick={() => onDeleteRoom(room.id)}
                        title="حذف القاعة"
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

                  <div style={{ display: "flex", gap: "12px", fontSize: "0.82rem", color: "#64748b", marginBottom: "12px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <Users size={14} color="#0d9488" />
                      <span>السعة: <strong>{room.capacity} طالب</strong></span>
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <Monitor size={14} color="#2563eb" />
                      <span>المجموعات النشطة: <strong>{room.activeGroupsCount || 0}</strong></span>
                    </span>
                  </div>

                  {/* Equipment tags */}
                  {room.equipment.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                      {room.equipment.map((eq, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            padding: "3px 8px",
                            fontSize: "0.75rem",
                            color: "#334155",
                          }}
                        >
                          {eq}
                        </span>
                      ))}
                    </div>
                  )}

                  {room.notes && (
                    <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "#64748b", fontStyle: "italic", lineHeight: 1.4 }}>
                      💡 {room.notes}
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
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      color: isAvail ? "#0f766e" : isMaint ? "#b45309" : "#64748b",
                    }}
                  >
                    {isAvail ? <CheckCircle2 size={13} /> : <Wrench size={13} />}
                    {isAvail ? "جاهزية تشغيلية كاملة" : isMaint ? "قيد صيانة التجهيزات" : "مشغول حالياً"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEditRoom(room)}
                    style={{
                      background: "transparent",
                      border: 0,
                      color: "#0f766e",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: "4px 8px",
                    }}
                  >
                    تعديل التجهيزات
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
