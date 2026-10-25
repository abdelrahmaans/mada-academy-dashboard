import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import { apiClient, type BillingMeterReport } from "@/lib/apiClient";
import { toast } from "sonner";

export interface BillingMeterWidgetProps {
  onUpgradeClick?: () => void;
}

export function BillingMeterWidget({ onUpgradeClick }: BillingMeterWidgetProps) {
  const [meter, setMeter] = useState<BillingMeterReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeter = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.billingMeter();
      setMeter(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذر قراءة استهلاك الباقة";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeter();
  }, []);

  if (loading) {
    return (
      <div className="billing-meter-card loading" style={{ padding: "16px", background: "var(--card-bg, #ffffff)", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b" }}>
          <RefreshCw className="r1-live-spin" size={16} />
          <span>جارٍ فحص عداد استهلاك باقة الأكاديمية…</span>
        </div>
      </div>
    );
  }

  if (error || !meter) {
    return null; // Gracefully non-blocking on error
  }

  const { students, branches, staff, warnings, planName, planCode, isTrial } = meter;
  const isHighStudentUsage = students.usagePercentage >= 80;
  const isStudentExceeded = students.isLimitExceeded;

  return (
    <section
      className="billing-meter-card"
      aria-label="عداد استهلاك الباقة والطلاب النشطين"
      style={{
        background: "var(--card-bg, #ffffff)",
        borderRadius: "14px",
        border: isStudentExceeded
          ? "1.5px solid #ef4444"
          : isHighStudentUsage
          ? "1.5px solid #f59e0b"
          : "1px solid var(--border-color, #e2e8f0)",
        padding: "18px 20px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 700,
              background: isTrial ? "#fef3c7" : "#e0f2fe",
              color: isTrial ? "#b45309" : "#0369a1",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <Sparkles size={14} />
            {isTrial ? "فترة تجريبية · Trial" : planName}
          </span>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            كود الباقة: <strong>{planCode}</strong>
          </span>
        </div>

        {meter.canUpgrade && (
          <button
            type="button"
            className="button button-secondary"
            style={{ fontSize: "12px", padding: "6px 12px" }}
            onClick={() => {
              if (onUpgradeClick) onUpgradeClick();
              else toast.info("لترقية باقة الأكاديمية يرجى التواصل مع فريق مبيعات منصة مدى.");
            }}
          >
            ترقية الباقة لزيادة السعة
          </button>
        )}
      </header>

      {/* Warnings List */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {warnings.map((warn, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                background: isStudentExceeded ? "#fef2f2" : "#fffbeb",
                color: isStudentExceeded ? "#b91c1c" : "#92400e",
                border: `1px solid ${isStudentExceeded ? "#fecaca" : "#fde68a"}`,
              }}
            >
              <AlertTriangle size={16} />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}

      {/* Usage Progress Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Active Students Meter */}
        <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Users size={16} color="#0d9488" /> الطلاب النشطون
            </span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: isStudentExceeded ? "#ef4444" : "#0f766e" }}>
              {students.activeCount} / {students.limit}
            </span>
          </div>
          <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, students.usagePercentage)}%`,
                background: isStudentExceeded ? "#ef4444" : isHighStudentUsage ? "#f59e0b" : "#0d9488",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "11px", color: "#64748b" }}>
            <span>استهلاك: {students.usagePercentage}%</span>
            <span>المتبقي: {students.remainingSlots} مقعد</span>
          </div>
        </div>

        {/* Branches Meter */}
        <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Building2 size={16} color="#2563eb" /> الفروع المصرحة
            </span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1d4ed8" }}>
              {branches.activeCount} / {branches.limit}
            </span>
          </div>
          <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, branches.usagePercentage)}%`,
                background: branches.isLimitExceeded ? "#ef4444" : "#2563eb",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "11px", color: "#64748b" }}>
            <span>استهلاك: {branches.usagePercentage}%</span>
            <span>المتبقي: {branches.remainingSlots} فرع</span>
          </div>
        </div>

        {/* Staff Members Meter */}
        <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={16} color="#7c3aed" /> فريق العمل والإشراف
            </span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#6d28d9" }}>
              {staff.activeCount} / {staff.limit}
            </span>
          </div>
          <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, staff.usagePercentage)}%`,
                background: staff.isLimitExceeded ? "#ef4444" : "#7c3aed",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "11px", color: "#64748b" }}>
            <span>استهلاك: {staff.usagePercentage}%</span>
            <span>المتبقي: {staff.remainingSlots} حساب</span>
          </div>
        </div>
      </div>
    </section>
  );
}
