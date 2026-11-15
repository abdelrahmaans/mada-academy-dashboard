import React, { useState } from "react";
import { Plus, Printer } from "lucide-react";
import { shiftStorage, type ShiftCashHandover } from "@/lib/apiClient";
import {
  ShiftReconciliationPrintModal,
  type PrintableShiftData,
} from "@/components/finance/ShiftReconciliationPrintModal";

export interface SecretaryShiftsTabProps {
  shifts?: ShiftCashHandover[];
  onOpenShiftModal: () => void;
  branchName?: string;
  cashierName?: string;
}

export function SecretaryShiftsTab({
  shifts,
  onOpenShiftModal,
  branchName = "الفرع الرئيسي",
  cashierName = "مسؤول الاستقبال",
}: SecretaryShiftsTabProps) {
  const allShifts = shifts ?? shiftStorage.getHandovers();
  const [printShift, setPrintShift] = useState<PrintableShiftData | null>(null);

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
                  <span
                    title={`كود التتبع المالي: ${shift.id}`}
                    style={{
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      background: "#f1f5f9",
                      color: "#334155",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontFamily: "monospace",
                    }}
                  >
                    وردية #{shift.id.slice(-4).toUpperCase()}
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
                      ? "معتمد ومستلم من المحاسب ✓"
                      : isPending
                      ? "بانتظار استلام واعتماد المحاسب ⏳"
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
                  تم استلام النقدية وتوريدها للخزينة الرئيسية بواسطة:{" "}
                  <b>{shift.receivedByName}</b>
                  {shift.receivedAt ? ` (في ${new Date(shift.receivedAt).toLocaleString("ar-EG")})` : ""}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: "8px",
                  marginTop: "4px",
                }}
              >
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() =>
                    setPrintShift({
                      shiftId: shift.id,
                      shiftName: shift.shiftName,
                      shiftDate: shift.shiftDate,
                      branchName,
                      cashierName,
                      cashAmount: shift.cashAmount,
                      electronicAmount: shift.electronicAmount,
                      totalReceiptsCount: shift.totalReceiptsCount || 0,
                      status: shift.status,
                      receivedByName: shift.receivedByName,
                      receivedAt: shift.receivedAt,
                      notes: shift.notes,
                    })
                  }
                  style={{
                    fontSize: "0.82rem",
                    color: "#0f766e",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Printer size={14} /> طباعة سند تقفيل الوردية (A4)
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <ShiftReconciliationPrintModal
        isOpen={Boolean(printShift)}
        onClose={() => setPrintShift(null)}
        shift={printShift}
      />
    </section>
  );
}
