import React from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  MessageCircle,
  Phone,
  Plus,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import type { LeadRecord, SchedulingGroupRecord } from "@/lib/apiClient";
import { STATUS_LABELS } from "./SecretaryDeskTypes";

export interface SecretaryFollowupsTabProps {
  leads: LeadRecord[];
  groups: SchedulingGroupRecord[];
  onOpenConvertModal: (lead: LeadRecord) => void;
  onOpenNewLeadModal?: () => void;
}

export function SecretaryFollowupsTab({
  leads,
  onOpenConvertModal,
  onOpenNewLeadModal,
}: SecretaryFollowupsTabProps) {
  const pendingLeads = leads.filter((l) =>
    ["NEW", "CONTACTED", "INTERESTED"].includes(l.status)
  );

  return (
    <section
      className="secretary-panel followups-panel"
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        padding: "26px 30px",
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
        direction: "rtl",
      }}
    >
      {/* Header */}
      <div
        className="followups-header"
        style={{
          borderBottom: "1px solid #f1f5f9",
          paddingBottom: "18px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#0d9488",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "4px",
            }}
          >
            <CalendarClock size={14} /> مهام اليوم العاجلة
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            المتابعات اليومية والاستفسارات العاجلة
          </h2>
          <p
            style={{
              margin: "4px 0 0",
              color: "#64748b",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            قائمة العملاء المحتملين الذين يحتاجون إلى اتصال هاتفي أو رسالة لمتابعة
            الاهتمام وتأكيد حجز المقعد، مع إمكانية تحويلهم مباشرة لطالب رسمي.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "999px",
              padding: "6px 14px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#1d4ed8",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <Clock3 size={14} />
            <span>{pendingLeads.length} عملاء بانتظار المتابعة اليوم</span>
          </div>

          {onOpenNewLeadModal && (
            <button
              type="button"
              onClick={onOpenNewLeadModal}
              style={{
                background: "linear-gradient(135deg, #0d9488, #0f766e)",
                color: "#ffffff",
                border: 0,
                borderRadius: "10px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(13, 148, 136, 0.25)",
              }}
            >
              <Plus size={15} />
              <span>إضافة استفسار / عميل جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Follow-up Cards */}
      <div
        className="followups-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "18px",
        }}
      >
        {pendingLeads.map((lead) => {
          const rawPhone = lead.phone ? lead.phone.replace(/\D/g, "") : "";
          const isInterested = lead.status === "INTERESTED";
          const isNew = lead.status === "NEW";

          return (
            <article
              key={lead.id}
              className="followup-card"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "18px 20px",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "14px",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 18px rgba(15, 23, 42, 0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(15, 23, 42, 0.03)";
              }}
            >
              <div>
                {/* Top header of card */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        fontSize: "16px",
                        fontWeight: 800,
                        color: "#0f172a",
                        display: "block",
                      }}
                    >
                      {lead.childName}
                    </strong>
                    <small style={{ color: "#64748b", fontSize: "12px" }}>
                      ولي الأمر: {lead.parentName || "غير محدد"}
                    </small>
                  </div>

                  <StatusBadge
                    status={isNew ? "danger" : isInterested ? "info" : "warning"}
                    label={STATUS_LABELS[lead.status] || lead.status}
                  />
                </div>

                {/* Details & Notes */}
                <div style={{ display: "grid", gap: "8px" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "#334155",
                      lineHeight: 1.5,
                      background: "#f8fafc",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    {lead.notes || "لا توجد ملاحظات مسجلة حتى الآن."}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {lead.courseName && (
                      <span
                        style={{
                          background: "#e6f7f5",
                          color: "#0f766e",
                          border: "1px solid #ccfbf1",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {lead.courseName}
                      </span>
                    )}
                    <span
                      style={{
                        color: "#94a3b8",
                        fontSize: "11px",
                        direction: "ltr",
                        textAlign: "right",
                      }}
                    >
                      {lead.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  paddingTop: "10px",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <a
                  href={`tel:${lead.phone}`}
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    color: "#334155",
                    borderRadius: "8px",
                    padding: "8px 10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <Phone size={13} color="#0d9488" />
                  <span>اتصال</span>
                </a>

                <a
                  href={`https://wa.me/${rawPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    color: "#166534",
                    borderRadius: "8px",
                    padding: "8px 10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <MessageCircle size={14} color="#16a34a" />
                  <span>واتساب</span>
                </a>

                <button
                  type="button"
                  onClick={() => onOpenConvertModal(lead)}
                  style={{
                    flex: 1.3,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    background: "linear-gradient(135deg, #0d9488, #0f766e)",
                    color: "#ffffff",
                    border: 0,
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(13, 148, 136, 0.2)",
                  }}
                >
                  <UserCheck size={14} />
                  <span>تسجيل رسمي</span>
                </button>
              </div>
            </article>
          );
        })}

        {pendingLeads.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "48px 24px",
              background: "#f8fafc",
              border: "1px dashed #cbd5e1",
              borderRadius: "20px",
              textAlign: "center",
              display: "grid",
              placeItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle2 size={36} color="#0d9488" />
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
              رائع! تم إنجاز جميع متابعات اليوم بنجاح
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              لا توجد استفسارات معلقة بحاجة للاتصال حالياً.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
