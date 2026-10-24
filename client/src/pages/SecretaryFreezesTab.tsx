import React from "react";
import { Plus } from "lucide-react";
import { freezeStorage, type SubscriptionFreezeRequest } from "@/lib/apiClient";

export interface SecretaryFreezesTabProps {
  serverFreezes: SubscriptionFreezeRequest[];
  onOpenFreezeModal: () => void;
}

export function SecretaryFreezesTab({
  serverFreezes,
  onOpenFreezeModal,
}: SecretaryFreezesTabProps) {
  const allFreezes =
    serverFreezes.length > 0 ? serverFreezes : freezeStorage.getRequests();

  return (
    <section className="secretary-panel">
      <div
        className="secretary-panel-toolbar"
        style={{
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
            طلبات تجميد الاشتراكات والحصص التعويضية
          </h2>
          <p
            style={{
              fontSize: "0.84rem",
              color: "#64748b",
              margin: "3px 0 0",
            }}
          >
            تسجيل تجميد فوري للطلاب عبر شباك الاستقبال ومتابعة القرارات
            المعتمدة.
          </p>
        </div>
        <button
          type="button"
          className="button button-primary"
          onClick={onOpenFreezeModal}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={16} /> تسجيل طلب تجميد بالاستقبال
        </button>
      </div>

      <div
        style={{
          marginTop: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {allFreezes.map((freeze) => {
          const statusBadge =
            freeze.status === "APPROVED"
              ? {
                  label: "معتمد · تم التمديد",
                  bg: "rgba(16, 185, 129, 0.12)",
                  color: "#059669",
                }
              : freeze.status === "REJECTED"
              ? {
                  label: "مرفوض",
                  bg: "rgba(239, 68, 68, 0.12)",
                  color: "#dc2626",
                }
              : {
                  label: "قيد مراجعة مدير الفرع",
                  bg: "rgba(245, 158, 11, 0.12)",
                  color: "#d97706",
                };

          return (
            <article
              key={freeze.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "16px",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                    {freeze.studentName}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    ({freeze.courseName})
                  </span>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background: statusBadge.bg,
                      color: statusBadge.color,
                    }}
                  >
                    {statusBadge.label}
                  </span>
                </div>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  مقدم الطلب: {freeze.submittedByName}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: "0.86rem", color: "#334155" }}>
                <strong>السبب:</strong> {freeze.reasonText}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                  fontSize: "0.82rem",
                  color: "#64748b",
                  borderTop: "1px dashed #e2e8f0",
                  paddingTop: "8px",
                  marginTop: "4px",
                }}
              >
                <span>
                  فترة التجميد: من <b>{freeze.startDate}</b> إلى{" "}
                  <b>{freeze.endDate}</b>
                </span>
                <span>
                  رصيد التعويض المتاح: <b>{freeze.makeUpCreditsAwarded} حصص</b>
                </span>
                {freeze.extendedNewEndDate && (
                  <span style={{ color: "#059669", fontWeight: 600 }}>
                    الانتهاء الجديد: {freeze.extendedNewEndDate}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
