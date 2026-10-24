import React from "react";
import { CheckCircle2, MessageCircle, Phone } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import type { LeadRecord, SchedulingGroupRecord } from "@/lib/apiClient";
import { STATUS_LABELS } from "./SecretaryDeskTypes";

export interface SecretaryFollowupsTabProps {
  leads: LeadRecord[];
  groups: SchedulingGroupRecord[];
  onOpenConvertModal: (lead: LeadRecord) => void;
}

export function SecretaryFollowupsTab({
  leads,
  onOpenConvertModal,
}: SecretaryFollowupsTabProps) {
  const pendingLeads = leads.filter((l) =>
    ["NEW", "CONTACTED", "INTERESTED"].includes(l.status)
  );

  return (
    <section className="secretary-panel followups-panel">
      <div className="followups-header">
        <h2>المتابعات اليومية والاستفسارات العاجلة</h2>
        <p>العملاء المحتملون الذين يحتاجون إلى اتصال أو رسالة لتأكيد الحجز.</p>
      </div>

      <div className="followups-grid">
        {pendingLeads.map((lead) => (
          <article key={lead.id} className="followup-card">
            <div className="followup-top">
              <div>
                <strong>{lead.childName}</strong>
                <small>ولي الأمر: {lead.parentName}</small>
              </div>
              <StatusBadge
                status={
                  lead.status === "NEW"
                    ? "danger"
                    : lead.status === "INTERESTED"
                    ? "info"
                    : "warning"
                }
                label={STATUS_LABELS[lead.status] || lead.status}
              />
            </div>

            <div className="followup-details">
              <p>{lead.notes || "لا توجد ملاحظات إضافية."}</p>
              {lead.courseName && (
                <span className="course-pill">{lead.courseName}</span>
              )}
            </div>

            <div className="followup-actions">
              <a href={`tel:${lead.phone}`} className="button button-secondary">
                <Phone size={14} /> اتصال
              </a>
              <a
                href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="button button-secondary"
              >
                <MessageCircle size={14} /> واتساب
              </a>
              <button
                type="button"
                className="button button-primary"
                onClick={() => onOpenConvertModal(lead)}
              >
                تسجيل رسمي
              </button>
            </div>
          </article>
        ))}

        {pendingLeads.length === 0 && (
          <div className="secretary-empty-state">
            <CheckCircle2 size={32} />
            <h3>رائع! تم إنجاز جميع المتابعات</h3>
            <p>لا توجد استفسارات معلقة اليوم.</p>
          </div>
        )}
      </div>
    </section>
  );
}
