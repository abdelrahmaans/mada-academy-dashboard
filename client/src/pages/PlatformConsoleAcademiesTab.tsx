import React from "react";
import { Search, ShieldAlert } from "lucide-react";
import type { PlatformAcademy } from "@/lib/apiClient";
import { fmtNumber, statusLabel } from "./PlatformConsoleTypes";

export interface PlatformConsoleAcademiesTabProps {
  enrichedAcademiesCount: number;
  tenantFilter: "ALL" | "ACTIVE" | "TRIAL" | "PAUSED" | "OVERDUE";
  setTenantFilter: (filter: "ALL" | "ACTIVE" | "TRIAL" | "PAUSED" | "OVERDUE") => void;
  tenantSearch: string;
  setTenantSearch: (search: string) => void;
  filteredAcademies: Array<
    PlatformAcademy & {
      planName: string;
      allowedBranches: number;
      remainingTrialDays?: number;
    }
  >;
  busyKey: string | null;
  onInspectAcademy: (academy: PlatformAcademy) => void;
  onOpenPlanUpgradeModal: (academy: PlatformAcademy) => void;
  onOpenFeaturesModal: (academy: PlatformAcademy) => void;
  onExtendTrial: (academy: PlatformAcademy) => void;
  onPaymentReminder: (academy: PlatformAcademy) => void;
  onRequestTenantStatusChange: (academy: PlatformAcademy) => void;
  onResetOwnerPassword: (academy: PlatformAcademy) => void;
  onEmergencyImpersonation: (academy: PlatformAcademy) => void;
  ownerResetEnabled: boolean;
  emergencyAccessEnabled: boolean;
  paymentRemindersEnabled: boolean;
  planActionsEnabled: boolean;
  trialActionsEnabled: boolean;
}

export function PlatformConsoleAcademiesTab({
  enrichedAcademiesCount,
  tenantFilter,
  setTenantFilter,
  tenantSearch,
  setTenantSearch,
  filteredAcademies,
  busyKey,
  onInspectAcademy,
  onOpenPlanUpgradeModal,
  onOpenFeaturesModal,
  onExtendTrial,
  onPaymentReminder,
  onRequestTenantStatusChange,
  onResetOwnerPassword,
  onEmergencyImpersonation,
  ownerResetEnabled,
  emergencyAccessEnabled,
  paymentRemindersEnabled,
  planActionsEnabled,
  trialActionsEnabled,
}: PlatformConsoleAcademiesTabProps) {
  return (
    <section className="pc-live-card">
      <header>
        <div>
          <h2>سجل الأكاديميات والباقات المعتمدة</h2>
          <p>
            {fmtNumber(enrichedAcademiesCount)} أكاديمية مسجلة؛ إدارة الباقات، الحدود، وحالة الاشتراكات بنقرة واحدة.
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["ALL", "ACTIVE", "TRIAL", "PAUSED", "OVERDUE"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              className={`pc-live-link ${tenantFilter === filter ? "active" : ""}`}
              style={{
                background: tenantFilter === filter ? "#1d6a65" : undefined,
                color: tenantFilter === filter ? "#ffffff" : undefined,
                borderColor: tenantFilter === filter ? "#1d6a65" : undefined,
              }}
              onClick={() => setTenantFilter(filter)}
            >
              {filter === "ALL"
                ? "الكل"
                : filter === "ACTIVE"
                ? "نشطة"
                : filter === "TRIAL"
                ? "تجريبية"
                : filter === "PAUSED"
                ? "موقوفة"
                : "متأخرة عن السداد"}
            </button>
          ))}
        </div>
      </header>

      <label className="pc-live-search">
        <Search size={16} />
        <input
          value={tenantSearch}
          onChange={(event) => setTenantSearch(event.target.value)}
          placeholder="ابحث عن اسم الأكاديمية أو المسؤول أو كود التينانت..."
        />
      </label>

      <div className="pc-live-table-wrap">
        <table className="pc-live-table">
          <thead>
            <tr>
              <th>الأكاديمية والمسؤول</th>
              <th>الباقة المصرحة</th>
              <th>حالة الاشتراك</th>
              <th>الفروع والمستخدمون</th>
              <th>إجراءات الإدارة السريعة</th>
            </tr>
          </thead>
          <tbody>
            {filteredAcademies.map((row) => (
              <tr key={row.id}>
                <th scope="row">
                  <strong>{row.name}</strong>
                  <small>
                    {row.owner ?? "غير مسجل"} · {row.id}
                  </small>
                </th>
                <td>
                  <span
                    style={{
                      display: "inline-block",
                      fontWeight: 700,
                      fontSize: "11px",
                      color: "#0f172a",
                    }}
                  >
                    {row.planName}
                  </span>
                  <small style={{ display: "block", color: "#64748b" }}>
                    مسموح حتى {fmtNumber(row.allowedBranches)} فروع
                  </small>
                </td>
                <td>
                  <span
                    className={`pc-live-status-tag ${
                      row.status === "PAUSED" ? "paused" : ""
                    }`}
                  >
                    {statusLabel[row.status] ?? row.status}
                  </span>
                  {row.status === "TRIAL" && row.remainingTrialDays !== undefined && (
                    <span
                      style={{
                        display: "block",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#b45309",
                        marginTop: "3px",
                      }}
                    >
                      متبقي {row.remainingTrialDays} يوم
                    </span>
                  )}
                </td>
                <td>
                  <strong>{fmtNumber(row.branches)} فروع</strong>
                  <small>{fmtNumber(row.users)} حساب موظف</small>
                </td>
                <td>
                  <div className="pc-live-row-actions">
                    <button
                      type="button"
                      style={{ color: "#0d9488", borderColor: "#ccfbf1", background: "#f0fdfa" }}
                      onClick={() => onInspectAcademy(row)}
                      title="فحص ومعاينة الأكاديمية للدعم الفني"
                    >
                      معاينة الدعم
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenPlanUpgradeModal(row)}
                      disabled={!planActionsEnabled}
                      title="متوقف حتى اعتماد عقد الفوترة وتسجيل أثر التغيير"
                    >
                      تعديل الباقة
                    </button>
                    <button
                      type="button"
                      style={{ color: "#4f46e5", borderColor: "#c7d2fe", background: "#eef2ff" }}
                      onClick={() => onOpenFeaturesModal(row)}
                      title="إدارة ميزات الأكاديمية والـ Feature Flags والتخصيص"
                    >
                      ميزات الأكاديمية
                    </button>
                    {row.status === "TRIAL" && (
                      <button
                        type="button"
                        style={{ color: "#d97706", borderColor: "#fde68a" }}
                        onClick={() => onExtendTrial(row)}
                        disabled={!trialActionsEnabled || busyKey === `extend:${row.id}`}
                      >
                        تمديد 7 أيام
                      </button>
                    )}
                    {(row.status === "PAUSED" || (row.status === "TRIAL" && (row.remainingTrialDays ?? 0) <= 3)) && (
                      <button
                        type="button"
                        style={{ color: "#b45309", borderColor: "#fde68a", background: "#fffbeb" }}
                        onClick={() => onPaymentReminder(row)}
                        disabled={!paymentRemindersEnabled}
                        title="توليد مطالبة مالية ورسالة تجديد واتساب"
                      >
                        مطالبة تجديد
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRequestTenantStatusChange(row)}
                      disabled={busyKey === `tenant:${row.id}`}
                    >
                      {row.status === "PAUSED" ? "تفعيل" : "إيقاف"}
                    </button>
                    <button
                      type="button"
                      style={{ color: "#2563eb" }}
                      onClick={() => onResetOwnerPassword(row)}
                      disabled={!ownerResetEnabled || busyKey === `reset:${row.id}`}
                      title={ownerResetEnabled ? "استعادة كلمة مرور المالك" : "متوقف حتى ربط مسار موثوق لتدوير كلمة المرور"}
                    >
                      استعادة المالك
                    </button>
                    <button
                      type="button"
                      style={{ color: "#c2410c", borderColor: "#fed7aa", background: "#fff7ed" }}
                      onClick={() => onEmergencyImpersonation(row)}
                      disabled={!emergencyAccessEnabled}
                      title="دخول فحص الطوارئ للأكاديمية وحل المشاكل التشغيلية من الداخل"
                    >
                      <ShieldAlert size={12} style={{ display: "inline", verticalAlign: "middle", marginLeft: "2px" }} /> فحص طارئ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAcademies.length === 0 && (
              <tr>
                <td colSpan={5} className="pc-live-empty-cell">
                  لا توجد أكاديميات مطابقة لمعايير البحث.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
