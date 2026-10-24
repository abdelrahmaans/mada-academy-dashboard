import React from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock3,
  Wallet,
} from "lucide-react";
import type {
  PlatformAcademy,
  PlatformActivity,
  PlatformOverview,
} from "@/lib/apiClient";
import { ActivityTable, Metric } from "./PlatformConsoleComponents";

export type EnrichedPlatformAcademy = PlatformAcademy & {
  planCode?: string;
  planName: string;
  allowedBranches?: number;
  isTrialExtended?: boolean;
  remainingTrialDays?: number;
  totalPaidAmount?: number;
  lastPaymentDate?: string;
  [key: string]: unknown;
};

export interface PlatformConsoleOverviewTabProps {
  overview: PlatformOverview | null;
  enrichedAcademies: EnrichedPlatformAcademy[];
  financials: { netSurplus: number };
  busyKey: string | null;
  activity: PlatformActivity[];
  onNavigateAcademies: () => void;
  onNavigateSystem: () => void;
  onExtendTrial: (tenant: EnrichedPlatformAcademy) => void;
  onOpenPlanUpgradeModal: (tenant: EnrichedPlatformAcademy) => void;
  onRequestTenantStatusChange: (tenant: EnrichedPlatformAcademy) => void;
}

export function PlatformConsoleOverviewTab({
  overview,
  enrichedAcademies,
  financials,
  busyKey,
  activity,
  onNavigateAcademies,
  onNavigateSystem,
  onExtendTrial,
  onOpenPlanUpgradeModal,
  onRequestTenantStatusChange,
}: PlatformConsoleOverviewTabProps) {
  return (
    <>
      {/* SaaS Top Metrics */}
      <section className="pc-live-metrics" aria-label="مؤشرات المنصة الحية">
        <Metric
          icon={<Building2 />}
          label="الأكاديميات المسجلة"
          value={overview?.academies ?? enrichedAcademies.length}
          note="إجمالي التينانتس"
        />
        <Metric
          icon={<CheckCircle2 />}
          label="اشتراكات نشطة"
          value={enrichedAcademies.filter((a) => a.status === "ACTIVE").length}
          note="أكاديميات سارية الدفع"
        />
        <Metric
          icon={<Clock3 />}
          label="فترات تجريبية سارية"
          value={enrichedAcademies.filter((a) => a.status === "TRIAL").length}
          note="بانتظار التحويل لمدفوع"
        />
        <Metric
          icon={<Wallet />}
          label="صافي الفائض الشهري"
          value={financials.netSurplus}
          note="بعد حسم استضافة السيرفرات"
          isCurrency
        />
      </section>

      {/* URGENT SAAS ATTENTION QUEUE (طابور التدخل السريع) */}
      <section className="pc-live-card">
        <header>
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={18} color="#d97706" />
              طابور التدخل السريع (Urgent SaaS Attention Queue)
            </h2>
            <p>
              أكاديميات تحتاج تمديد تجربة، تجديد اشتراك، أو متابعة تذكرة ذات أولوية مرتفعة.
            </p>
          </div>
          <button
            type="button"
            className="pc-live-link"
            onClick={onNavigateAcademies}
          >
            عرض كل الأكاديميات
          </button>
        </header>

        <div style={{ display: "grid", gap: "14px" }}>
          {/* Item 1: Trials Ending Soon */}
          {enrichedAcademies
            .filter((a) => a.status === "TRIAL")
            .map((tenant) => (
              <div
                key={tenant.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: "#fffbeb",
                  border: "1px solid #fef3c7",
                }}
              >
                <div style={{ display: "grid", gap: "3px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontSize: "13px", color: "#92400e" }}>
                      {tenant.name}
                    </strong>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: "#fef3c7",
                        color: "#b45309",
                      }}
                    >
                      متبقي {tenant.remainingTrialDays} أيام في التجربة
                    </span>
                  </div>
                  <small style={{ color: "#78350f" }}>
                    المسؤول: {tenant.owner || "غير مسجل"} · {tenant.branches} فروع · خطة {tenant.planName}
                  </small>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="pc-live-link"
                    style={{ borderColor: "#d97706", color: "#b45309" }}
                    onClick={() => onExtendTrial(tenant)}
                    disabled={busyKey === `extend:${tenant.id}`}
                  >
                    + تمديد 7 أيام
                  </button>
                  <button
                    type="button"
                    className="pc-live-primary"
                    style={{ padding: "6px 12px", fontSize: "11px" }}
                    onClick={() => onOpenPlanUpgradeModal(tenant)}
                  >
                    ترقية وتفعيل
                  </button>
                </div>
              </div>
            ))}

          {/* Item 2: Paused Academies */}
          {enrichedAcademies
            .filter((a) => a.status === "PAUSED")
            .map((tenant) => (
              <div
                key={tenant.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: "#fef2f2",
                  border: "1px solid #fee2e2",
                }}
              >
                <div style={{ display: "grid", gap: "3px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontSize: "13px", color: "#991b1b" }}>
                      {tenant.name}
                    </strong>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: "#fee2e2",
                        color: "#b91c1c",
                      }}
                    >
                      اشتراك موقوف مؤقتًا
                    </span>
                  </div>
                  <small style={{ color: "#7f1d1d" }}>
                    المسؤول: {tenant.owner || "غير مسجل"} · تم تعليق صلاحيات الدخول
                  </small>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="pc-live-primary"
                    style={{
                      background: "#059669",
                      borderColor: "#059669",
                      padding: "6px 12px",
                      fontSize: "11px",
                    }}
                    onClick={() => onRequestTenantStatusChange(tenant)}
                    disabled={busyKey === `tenant:${tenant.id}`}
                  >
                    إعادة التفعيل
                  </button>
                </div>
              </div>
            ))}

          {/* Empty State */}
          {enrichedAcademies.every(
            (a) => a.status !== "TRIAL" && a.status !== "PAUSED"
          ) && (
            <div style={{ textAlign: "center", padding: "24px", color: "#059669" }}>
              <CheckCircle2 size={28} style={{ margin: "0 auto 8px" }} />
              <strong>لا توجد أكاديميات في طابور التنبيهات العاجلة</strong>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "12px" }}>
                جميع الاشتراكات نشطة وتعمل بكفاءة تامة.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Platform Activities */}
      <section className="pc-live-card">
        <header>
          <div>
            <h2>آخر العمليات والأحداث على المنصة</h2>
            <p>سجل التغييرات الإدارية وتدوير الجلسات وترقية الباقات.</p>
          </div>
          <button
            type="button"
            className="pc-live-link"
            onClick={onNavigateSystem}
          >
            عرض سجل التدقيق بالكامل
          </button>
        </header>
        <ActivityTable rows={activity.slice(0, 5)} />
      </section>
    </>
  );
}
