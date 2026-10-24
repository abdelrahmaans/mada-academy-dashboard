import React from "react";
import { Filter, MessageCircle, Plus, RefreshCw, Search, UserCheck, Users } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import type { LeadRecord, SchedulingGroupRecord } from "@/lib/apiClient";
import { CHANNEL_LABELS, STATUS_LABELS } from "./SecretaryDeskTypes";

export interface SecretaryPipelineTabProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  leads: LeadRecord[];
  filteredLeads: LeadRecord[];
  newLeadsCount: number;
  registeredCount: number;
  loading: boolean;
  groups: SchedulingGroupRecord[];
  onOpenNewLeadModal: () => void;
  onOpenConvertModal: (lead: LeadRecord) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

export function SecretaryPipelineTab({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  leads,
  filteredLeads,
  newLeadsCount,
  registeredCount,
  loading,
  onOpenNewLeadModal,
  onOpenConvertModal,
  onUpdateStatus,
}: SecretaryPipelineTabProps) {
  return (
    <section className="secretary-panel">
      <div className="secretary-panel-toolbar">
        <div className="search-wrap">
          <Search size={16} />
          <input
            type="search"
            placeholder="ابحث باسم الطفل أو ولي الأمر أو الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-wrap">
          <Filter size={15} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">جميع الحالات ({leads.length})</option>
            <option value="NEW">جديد ({newLeadsCount})</option>
            <option value="CONTACTED">تم التواصل</option>
            <option value="INTERESTED">مهتم بالحجز</option>
            <option value="REGISTERED">مسجل رسميًا ({registeredCount})</option>
            <option value="WAITLISTED">قائمة الانتظار</option>
            <option value="ARCHIVED">مؤرشف</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="secretary-loading">
          <RefreshCw size={24} className="spin" /> جارٍ جلب الاستفسارات المباشرة...
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="secretary-empty-state">
          <Users size={32} />
          <h3>لا توجد استفسارات مطابقة</h3>
          <p>سجّل استفسارًا جديدًا عند قدوم ولي أمر أو تواصله هاتفيًا.</p>
          <button
            type="button"
            className="button button-primary"
            onClick={onOpenNewLeadModal}
          >
            <Plus size={15} /> إضافة استفسار
          </button>
        </div>
      ) : (
        <div className="secretary-leads-table-wrap">
          <table className="secretary-table">
            <thead>
              <tr>
                <th>اسم الطفل</th>
                <th>ولي الأمر</th>
                <th>الهاتف والقناة</th>
                <th>المجموعة المطلوبة</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className={`lead-row lead-${lead.status.toLowerCase()}`}
                >
                  <td>
                    <strong>{lead.childName}</strong>
                    {lead.notes && (
                      <small className="lead-note">{lead.notes}</small>
                    )}
                  </td>
                  <td>{lead.parentName}</td>
                  <td>
                    <div className="lead-phone-cell">
                      <span>{lead.phone}</span>
                      <span className="channel-pill">
                        {CHANNEL_LABELS[lead.channel] || lead.channel}
                      </span>
                    </div>
                  </td>
                  <td>
                    {lead.courseName ? (
                      <span className="course-pill">{lead.courseName}</span>
                    ) : (
                      <span className="muted-text">غير محدد</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge
                      status={
                        lead.status === "REGISTERED"
                          ? "success"
                          : lead.status === "WAITLISTED"
                          ? "info"
                          : lead.status === "INTERESTED"
                          ? "info"
                          : lead.status === "CONTACTED"
                          ? "warning"
                          : lead.status === "NEW"
                          ? "danger"
                          : "neutral"
                      }
                      label={STATUS_LABELS[lead.status] || lead.status}
                    />
                  </td>
                  <td>
                    <div className="lead-actions-cell">
                      {lead.status !== "REGISTERED" && (
                        <button
                          type="button"
                          className="action-btn convert-btn"
                          onClick={() => onOpenConvertModal(lead)}
                          title="تحويل لتسجيل رسمي"
                        >
                          <UserCheck size={14} /> تسجيل
                        </button>
                      )}
                      {lead.status === "NEW" && (
                        <button
                          type="button"
                          className="action-btn status-btn"
                          onClick={() => onUpdateStatus(lead.id, "CONTACTED")}
                        >
                          تواصلت
                        </button>
                      )}
                      {lead.status === "CONTACTED" && (
                        <button
                          type="button"
                          className="action-btn status-btn"
                          onClick={() => onUpdateStatus(lead.id, "INTERESTED")}
                        >
                          مهتم
                        </button>
                      )}
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="action-btn whatsapp-btn"
                        title="محادثة واتساب"
                      >
                        <MessageCircle size={14} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
