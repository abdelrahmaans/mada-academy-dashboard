import React from "react";
import {
  Box,
  Cpu,
  Layers,
  Wrench,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import type { ReadinessKit } from "./types";
import type { KitItem } from "../KitInventoryDetailsModal";

interface ReadinessKitsSectionProps {
  kits: ReadinessKit[];
  onOpenAddKit: () => void;
  onEditKit: (kit: ReadinessKit) => void;
  onDeleteKit: (kitId: string) => void;
  onInspectKit: (kit: KitItem) => void;
}

export function ReadinessKitsSection({
  kits,
  onOpenAddKit,
  onEditKit,
  onDeleteKit,
  onInspectKit,
}: ReadinessKitsSectionProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
            الحقائب التدريبية والعتاد التعليمي ({kits.length})
          </h3>
          <p style={{ margin: "3px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
            إحصاء أطقم الروبوتكس، الإشراف على الشحن والصيانة، وتتبع السيريال والقطع
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddKit}
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
          <span>إضافة عتاد / كيت جديد</span>
        </button>
      </div>

      {kits.length === 0 ? (
        <div
          style={{
            background: "#f8fafc",
            border: "1px dashed #cbd5e1",
            borderRadius: "14px",
            padding: "36px",
            textAlign: "center",
          }}
        >
          <Box size={36} color="#94a3b8" style={{ margin: "0 auto 10px" }} />
          <h4 style={{ margin: "0 0 6px", color: "#1e293b", fontSize: "1rem" }}>لا توجد حقائب تدريبية مسجلة بالفرع</h4>
          <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "0.85rem" }}>
            أضف حقائب الروبوتكس أو أطقم الإلكترونيات لمتابعة جاهزيتها وتفادي العجز أثناء الحصص.
          </p>
          <button
            type="button"
            onClick={onOpenAddKit}
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
            + إضافة أول حقيبة
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
          {kits.map((kit) => {
            const isFullReady = kit.readyQuantity === kit.totalQuantity;
            const hasMaint = kit.maintenanceQuantity > 0;

            // Map to KitItem interface expected by KitInventoryDetailsModal
            const kitItemForModal: KitItem = {
              id: kit.id,
              name: kit.name,
              track: kit.track,
              totalQuantity: kit.totalQuantity,
              readyQuantity: kit.readyQuantity,
              maintenanceQuantity: kit.maintenanceQuantity,
              supportsStudents: kit.supportsStudents,
              status: kit.status,
              notes: kit.notes,
            };

            return (
              <div
                key={kit.id}
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
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #dbeafe",
                          display: "inline-block",
                          marginBottom: "6px",
                        }}
                      >
                        {kit.track}
                      </span>
                      <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                        {kit.name}
                      </h4>
                    </div>

                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        type="button"
                        onClick={() => onEditKit(kit)}
                        title="تعديل الحقيبة"
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
                        onClick={() => onDeleteKit(kit.id)}
                        title="حذف الحقيبة"
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

                  {/* Quantities ribbon */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "8px",
                      background: "#f8fafc",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid #f1f5f9",
                      margin: "10px 0",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block" }}>الإجمالي</span>
                      <strong style={{ fontSize: "1.1rem", color: "#0f172a" }}>{kit.totalQuantity}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.7rem", color: "#0f766e", display: "block" }}>جاهز للتشغيل</span>
                      <strong style={{ fontSize: "1.1rem", color: "#0f766e" }}>{kit.readyQuantity}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.7rem", color: hasMaint ? "#b45309" : "#94a3b8", display: "block" }}>
                        صيانة / فحص
                      </span>
                      <strong style={{ fontSize: "1.1rem", color: hasMaint ? "#b45309" : "#94a3b8" }}>
                        {kit.maintenanceQuantity}
                      </strong>
                    </div>
                  </div>

                  <p style={{ margin: "0 0 6px", fontSize: "0.8rem", color: "#475569" }}>
                    👥 <strong>الاستيعاب:</strong> {kit.supportsStudents}
                  </p>

                  {kit.notes && (
                    <p style={{ margin: "4px 0 0", fontSize: "0.76rem", color: "#64748b", fontStyle: "italic", lineHeight: 1.4 }}>
                      📝 {kit.notes}
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
                      gap: "4px",
                      color: isFullReady ? "#0f766e" : "#b45309",
                    }}
                  >
                    {isFullReady ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                    {isFullReady ? "العتاد مكتمل 100%" : `${kit.maintenanceQuantity} أطقم قيد الصيانة`}
                  </span>

                  <button
                    type="button"
                    onClick={() => onInspectKit(kitItemForModal)}
                    style={{
                      background: "rgba(13, 148, 136, 0.08)",
                      border: "1px solid rgba(13, 148, 136, 0.3)",
                      color: "#0f766e",
                      borderRadius: "7px",
                      padding: "5px 11px",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <Cpu size={13} />
                    <span>تتبع السيريال والوحدات</span>
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
