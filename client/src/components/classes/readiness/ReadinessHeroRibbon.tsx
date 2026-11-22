import React from "react";
import {
  Building2,
  Box,
  GraduationCap,
  Trophy,
  Plus,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import type { BranchReadinessState } from "./types";

interface ReadinessHeroRibbonProps {
  branchName: string;
  state: BranchReadinessState;
  coursesCount: number;
  onOpenCreateGroupModal: () => void;
  onOpenAddRoom: () => void;
  onOpenAddKit: () => void;
}

export function ReadinessHeroRibbon({
  branchName,
  state,
  coursesCount,
  onOpenCreateGroupModal,
  onOpenAddRoom,
  onOpenAddKit,
}: ReadinessHeroRibbonProps) {
  const totalCapacity = state.rooms.reduce((sum, r) => sum + r.capacity, 0);
  const totalKits = state.kits.reduce((sum, k) => sum + k.totalQuantity, 0);
  const readyKits = state.kits.reduce((sum, k) => sum + k.readyQuantity, 0);
  const kitReadinessPercent = totalKits > 0 ? Math.round((readyKits / totalKits) * 100) : 100;
  const totalTeams = state.competitions.reduce((sum, c) => sum + c.registeredTeams, 0);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #042f2e 0%, #0d9488 100%)",
        borderRadius: "16px",
        padding: "24px 28px",
        color: "#ffffff",
        boxShadow: "0 10px 25px -5px rgba(13, 148, 136, 0.3)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(4px)",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            <MapPin size={14} />
            <span>جاهزية فرع الأكاديمية: {branchName || "الفرع الرئيسي"}</span>
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: "1.45rem", fontWeight: 800, color: "#ffffff" }}>
            تجهيزات الفرع والجاهزية التشغيلية (Branch Readiness)
          </h2>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "#ccfbf1", maxWidth: "680px", lineHeight: 1.6 }}>
            مساحة متكاملة لمراجعة وإدارة القاعات، المعامل، عتاد الكيتس، والكورسات المعتمدة بشكل تفاعلي بالكامل لتفادي أي عجز في المقاعد أو الحقائب التدريبية.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onOpenAddRoom}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              borderRadius: "10px",
              padding: "9px 15px",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Building2 size={15} />
            <span>+ قاعة جديدة</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddKit}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              borderRadius: "10px",
              padding: "9px 15px",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Box size={15} />
            <span>+ حقيبة عتاد</span>
          </button>
          <button
            type="button"
            onClick={onOpenCreateGroupModal}
            style={{
              background: "#ffffff",
              color: "#0f766e",
              border: 0,
              borderRadius: "10px",
              padding: "9px 18px",
              fontSize: "0.88rem",
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}
          >
            <Plus size={16} />
            <span>إنشاء مجموعة (جروب)</span>
          </button>
        </div>
      </div>

      {/* Live Dynamic Metrics Ribbon */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "14px",
          marginTop: "22px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(6px)",
            borderRadius: "10px",
            padding: "12px 14px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "#99f6e4", display: "block" }}>القاعات والمعامل المجهزة</span>
          <strong style={{ fontSize: "1.3rem", color: "#ffffff", fontWeight: 800 }}>
            {state.rooms.length} معامل
          </strong>
          <span style={{ fontSize: "0.72rem", color: "#ccfbf1", display: "block", marginTop: "2px" }}>
            سعة {totalCapacity} مقعد نشط
          </span>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(6px)",
            borderRadius: "10px",
            padding: "12px 14px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "#99f6e4", display: "block" }}>إجمالي الكيتس والحقائب</span>
          <strong style={{ fontSize: "1.3rem", color: "#ffffff", fontWeight: 800 }}>
            {totalKits} طقم تدريبي
          </strong>
          <span style={{ fontSize: "0.72rem", color: "#ccfbf1", display: "block", marginTop: "2px" }}>
            جاهزية العتاد {kitReadinessPercent}%
          </span>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(6px)",
            borderRadius: "10px",
            padding: "12px 14px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "#99f6e4", display: "block" }}>الكورسات المعتمدة بالفرع</span>
          <strong style={{ fontSize: "1.3rem", color: "#ffffff", fontWeight: 800 }}>
            {coursesCount} كورسات
          </strong>
          <span style={{ fontSize: "0.72rem", color: "#ccfbf1", display: "block", marginTop: "2px" }}>
            جاهزة للتسكين والجدولة
          </span>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(6px)",
            borderRadius: "10px",
            padding: "12px 14px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "#99f6e4", display: "block" }}>مسابقات وبطولات الفرع</span>
          <strong style={{ fontSize: "1.3rem", color: "#ffffff", fontWeight: 800 }}>
            {state.competitions.length} مسابقات
          </strong>
          <span style={{ fontSize: "0.72rem", color: "#ccfbf1", display: "block", marginTop: "2px" }}>
            {totalTeams} فرق مسجلة
          </span>
        </div>
      </div>
    </div>
  );
}
