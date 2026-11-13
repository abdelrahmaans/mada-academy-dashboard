import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Search,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import type { SchedulingGroupRecord } from "@/lib/apiClient";

export interface SecretaryGroupsTabProps {
  groups: SchedulingGroupRecord[];
  onDirectRegister: (offeringId?: string) => void;
}

export function SecretaryGroupsTab({
  groups,
  onDirectRegister,
}: SecretaryGroupsTabProps) {
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const tracks = useMemo(() => {
    const list = Array.from(new Set(groups.map((g) => g.track).filter(Boolean)));
    return ["ALL", ...list];
  }, [groups]);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        g.courseName.toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q) ||
        (g.instructorName && g.instructorName.toLowerCase().includes(q)) ||
        (g.classroomName && g.classroomName.toLowerCase().includes(q));

      const matchTrack = trackFilter === "ALL" || g.track === trackFilter;
      const matchStatus = statusFilter === "ALL" || g.status === statusFilter;

      return matchSearch && matchTrack && matchStatus;
    });
  }, [groups, search, trackFilter, statusFilter]);

  const totalSeats = groups.reduce((acc, g) => acc + (g.maxStudents || 0), 0);
  const enrolledSeats = groups.reduce((acc, g) => acc + (g.enrolledStudents || 0), 0);
  const occupancyRate = totalSeats > 0 ? Math.round((enrolledSeats / totalSeats) * 100) : 0;

  return (
    <section className="secretary-groups-tab" aria-label="سجل المجموعات والقاعات المتاحة">
      {/* Top Stat Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#f0fdfa", color: "#0d9488", display: "grid", placeItems: "center" }}>
            <Layers size={20} />
          </div>
          <div>
            <small style={{ color: "#64748b", fontSize: "11px", fontWeight: 700 }}>إجمالي المجموعات</small>
            <strong style={{ display: "block", fontSize: "20px", color: "#0f172a" }}>{groups.length} مجموعة</strong>
          </div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#eff6ff", color: "#2563eb", display: "grid", placeItems: "center" }}>
            <Users size={20} />
          </div>
          <div>
            <small style={{ color: "#64748b", fontSize: "11px", fontWeight: 700 }}>الطلاب المسجلون بالمجموعات</small>
            <strong style={{ display: "block", fontSize: "20px", color: "#0f172a" }}>{enrolledSeats} طالب</strong>
          </div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#fef3c7", color: "#d97706", display: "grid", placeItems: "center" }}>
            <Sparkles size={20} />
          </div>
          <div>
            <small style={{ color: "#64748b", fontSize: "11px", fontWeight: 700 }}>نسبة إشغال المقاعد</small>
            <strong style={{ display: "block", fontSize: "20px", color: "#0f172a" }}>{occupancyRate}% ({totalSeats - enrolledSeats} شاغر)</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "14px 18px",
          marginBottom: "18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: 1 }}>
          <div style={{ position: "relative", minWidth: "240px", flex: "1 1 240px" }}>
            <Search size={16} style={{ position: "absolute", top: "50%", right: "12px", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المجموعة، الكورس، المدرب أو القاعة..."
              style={{
                width: "100%",
                padding: "8px 36px 8px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>

          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "12px",
              background: "#ffffff",
              color: "#334155",
            }}
          >
            <option value="ALL">كل المسارات التعليمية</option>
            {tracks.filter((t) => t !== "ALL").map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "12px",
              background: "#ffffff",
              color: "#334155",
            }}
          >
            <option value="ALL">كل الحالات التشغيلية</option>
            <option value="ACTIVE">نشطة (جارية)</option>
            <option value="UPCOMING">قادمة (مفتوحة للحجز)</option>
            <option value="COMPLETED">مكتملة</option>
          </select>
        </div>
      </div>

      {/* Groups Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "16px",
        }}
      >
        {filteredGroups.map((g) => {
          const isFull = g.maxStudents > 0 && g.enrolledStudents >= g.maxStudents;
          const statusBg =
            g.status === "ACTIVE" ? "#ecfdf5" : g.status === "UPCOMING" ? "#eff6ff" : "#f1f5f9";
          const statusColor =
            g.status === "ACTIVE" ? "#047857" : g.status === "UPCOMING" ? "#1d4ed8" : "#475569";
          const statusText =
            g.status === "ACTIVE" ? "جارية الآن" : g.status === "UPCOMING" ? "مفتوحة للحجز" : "مكتملة";

          return (
            <article
              key={g.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "18px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
                transition: "transform 0.15s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#0d9488", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <BookOpen size={13} /> {g.track || "مسار عام"}
                  </span>
                  <h4 style={{ margin: "4px 0 2px", fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
                    {g.courseName}
                  </h4>
                  <small style={{ color: "#64748b", fontSize: "11px" }}>
                    معرف المجموعة: <b dir="ltr">GRP-{g.id.slice(0, 6).toUpperCase()}</b>
                  </small>
                </div>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "99px",
                    fontSize: "11px",
                    fontWeight: 800,
                    background: statusBg,
                    color: statusColor,
                    whiteSpace: "nowrap",
                  }}
                >
                  {statusText}
                </span>
              </div>

              {/* Progress and capacity */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span style={{ color: "#475569" }}>سعة الطلاب المقبولين:</span>
                  <strong style={{ color: isFull ? "#dc2626" : "#0d9488" }}>
                    {g.enrolledStudents} / {g.maxStudents} {isFull ? "(ممتلئة)" : `(متاح ${g.maxStudents - g.enrolledStudents})`}
                  </strong>
                </div>
                <div style={{ width: "100%", height: "7px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.min(100, g.maxStudents > 0 ? (g.enrolledStudents / g.maxStudents) * 100 : 0)}%`,
                      height: "100%",
                      background: isFull ? "#dc2626" : "#0d9488",
                      borderRadius: "99px",
                    }}
                  />
                </div>
              </div>

              {/* Meta details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px", color: "#64748b", background: "#f8fafc", padding: "10px 12px", borderRadius: "10px" }}>
                <div>
                  <span style={{ display: "block", color: "#94a3b8" }}>المدرب المسند:</span>
                  <strong style={{ color: "#1e293b" }}>{g.instructorName || "قيد التعيين"}</strong>
                </div>
                <div>
                  <span style={{ display: "block", color: "#94a3b8" }}>القاعة المخصصة:</span>
                  <strong style={{ color: "#1e293b" }}>{g.classroomName || "قيد التحديد"}</strong>
                </div>
                <div>
                  <span style={{ display: "block", color: "#94a3b8" }}>تاريخ البدء:</span>
                  <strong style={{ color: "#1e293b" }}>{g.startDate || "—"}</strong>
                </div>
                <div>
                  <span style={{ display: "block", color: "#94a3b8" }}>تاريخ الانتهاء:</span>
                  <strong style={{ color: "#1e293b" }}>{g.endDate || "مستمرة"}</strong>
                </div>
              </div>

              {/* Actions */}
              <div style={{ marginTop: "auto", display: "flex", gap: "8px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                <button
                  type="button"
                  className="button button-primary"
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px 12px",
                    fontSize: "12px",
                  }}
                  disabled={isFull}
                  onClick={() => onDirectRegister(g.id)}
                >
                  <UserPlus size={14} />
                  {isFull ? "المجموعة مكتملة" : "تسجيل طالب في المجموعة"}
                </button>
              </div>
            </article>
          );
        })}

        {filteredGroups.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "48px 24px",
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              color: "#64748b",
            }}
          >
            <Layers size={36} style={{ margin: "0 auto 12px", color: "#94a3b8" }} />
            <h4 style={{ margin: 0, fontSize: "16px", color: "#1e293b" }}>لا توجد مجموعات مطابقة</h4>
            <p style={{ margin: "6px 0 0", fontSize: "12px" }}>جرب تغيير معايير البحث أو تصفية المسارات لعرض المجموعات المتاحة.</p>
          </div>
        )}
      </div>
    </section>
  );
}
