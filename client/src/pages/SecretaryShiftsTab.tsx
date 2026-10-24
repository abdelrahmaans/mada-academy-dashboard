import React from "react";
import { Plus } from "lucide-react";
import { shiftStorage } from "@/lib/apiClient";

export interface SecretaryShiftsTabProps {
  onOpenShiftModal: () => void;
}

export function SecretaryShiftsTab({
  onOpenShiftModal,
}: SecretaryShiftsTabProps) {
  const allShifts = shiftStorage.getHandovers();

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
            تقفيل خزينة الشيفت وتسليم العهدة النقدية
          </h2>
          <p
            style={{
              fontSize: "0.84rem",
              color: "#64748b",
              margin: "3px 0 0",
            }}
          >
            تسليم الكاش والإيصالات المحصلة خلال الوردية للمحاسب المالي رسمياً.
          </p>
        </div>
        <button
          type="button"
          className="button button-primary"
          onClick={onOpenShiftModal}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={16} /> تقفيل وتسليم الوردية الحالية
        </button>
      </div>

      <div
        style={{
          marginTop: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {allShifts.map((shift) => {
          const isAccepted = shift.status === "ACCEPTED";
          const isPending = shift.status === "SUBMITTED";

          return (
            <article
              key={shift.id}
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
                    {shift.id}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    وردية {shift.shiftName === "MORNING" ? "صباحية" : "مسائية"}{" "}
                    · {shift.shiftDate}
                  </span>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background: isAccepted
                        ? "rgba(16, 185, 129, 0.12)"
                        : isPending
                        ? "rgba(245, 158, 11, 0.12)"
                        : "rgba(239, 68, 68, 0.12)",
                      color: isAccepted
                        ? "#059669"
                        : isPending
                        ? "#d97706"
                        : "#dc2626",
                    }}
                  >
                    {isAccepted
                      ? "تم الاستلام من المحاسب"
                      : isPending
                      ? "بانتظار استلام المحاسب"
                      : "يوجد فرق / عجز"}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  الكاش: {shift.cashAmount.toLocaleString("en-US")} ج.م ·
                  الإلكتروني: {shift.electronicAmount.toLocaleString("en-US")}{" "}
                  ج.م
                </span>
              </div>

              {shift.notes && (
                <p style={{ margin: 0, fontSize: "0.86rem", color: "#475569" }}>
                  <strong>ملاحظات:</strong> {shift.notes}
                </p>
              )}

              {shift.receivedByName && (
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#059669",
                    borderTop: "1px dashed #e2e8f0",
                    paddingTop: "6px",
                  }}
                >
                  تم استلام النقدية واعتمادها بواسطة:{" "}
                  <b>{shift.receivedByName}</b>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
