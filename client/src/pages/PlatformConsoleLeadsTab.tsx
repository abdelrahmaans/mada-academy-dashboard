import React from "react";
import { Building2, MessageCircle, Search, Sparkles } from "lucide-react";
import type { PlatformDemoLead } from "@/lib/apiClient";
import { fmtDate } from "./PlatformConsoleTypes";

export interface PlatformConsoleLeadsTabProps {
  filteredLeads: PlatformDemoLead[];
  leadSearch: string;
  setLeadSearch: (val: string) => void;
  leadFilter: "ALL" | "NEW" | "CONTACTED" | "DEMO_SCHEDULED" | "CONVERTED";
  setLeadFilter: (val: "ALL" | "NEW" | "CONTACTED" | "DEMO_SCHEDULED" | "CONVERTED") => void;
  handleLeadStatusChange: (id: string, status: PlatformDemoLead["status"]) => void;
  handleWhatsAppLeadChat: (lead: PlatformDemoLead) => void;
  handleOpenConvertModal: (lead: PlatformDemoLead) => void;
}

export function PlatformConsoleLeadsTab({
  filteredLeads,
  leadSearch,
  setLeadSearch,
  leadFilter,
  setLeadFilter,
  handleLeadStatusChange,
  handleWhatsAppLeadChat,
  handleOpenConvertModal,
}: PlatformConsoleLeadsTabProps) {
  return (
    <section className="pc-live-card">
      <header>
        <div>
          <h2>طلبات المعاينة والعملاء الجدد (Landing Page Leads & Demos)</h2>
          <p>
            الطلبات الواردة فوراً من نموذج المعاينة في الصفحة الرئيسية (Landing Page) مع إمكانية التواصل عبر واتساب والتفعيل التجريبي بنقرة واحدة.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span className="pc-live-boundary">
            <Sparkles size={14} /> {filteredLeads.length} طلبات مسجلة
          </span>
        </div>
      </header>

      {/* Filter Tabs & Search */}
      <div className="pc-live-filter-bar" style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
        <div className="pc-live-search" style={{ flex: 1, minWidth: "220px" }}>
          <Search size={15} />
          <input
            type="search"
            placeholder="ابحث باسم المسؤول، الأكاديمية، الهاتف، أو البريد..."
            value={leadSearch}
            onChange={(e) => setLeadSearch(e.target.value)}
          />
        </div>
        <div className="pc-filter-tabs" style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "ALL", label: "الكل" },
            { id: "NEW", label: "جديد 🚨" },
            { id: "CONTACTED", label: "تم التواصل" },
            { id: "DEMO_SCHEDULED", label: "موعد ديمو 📅" },
            { id: "CONVERTED", label: "تم التحويل لعميل ✅" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`pc-filter-tab ${leadFilter === tab.id ? "active" : ""}`}
              onClick={() => setLeadFilter(tab.id as typeof leadFilter)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div className="pc-live-table-wrap">
        <table className="pc-live-table">
          <thead>
            <tr>
              <th>معرف الطلب</th>
              <th>الأكاديمية والمسؤول</th>
              <th>بيانات التواصل</th>
              <th>الفروع والاحتياج التشغيلي</th>
              <th>حالة الطلب</th>
              <th>تاريخ الورود</th>
              <th>الإجراءات الفورية</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#475569" }}>
                    {lead.id}
                  </span>
                </td>
                <td>
                  <strong>{lead.academyName}</strong>
                  <small style={{ display: "block", color: "#64748b" }}>
                    المسؤول: {lead.name}
                  </small>
                </td>
                <td>
                  <div style={{ display: "grid", gap: "2px" }}>
                    <span style={{ direction: "ltr", textAlign: "right", fontWeight: 600 }}>{lead.phone}</span>
                    <small style={{ color: "#64748b" }}>{lead.email}</small>
                  </div>
                </td>
                <td>
                  <div>
                    <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>
                      {lead.branchCount} فروع
                    </span>
                    <small style={{ display: "block", color: "#475569", marginTop: "3px" }}>
                      {lead.operationalNeed}
                    </small>
                    {lead.notes && (
                      <small style={{ display: "block", color: "#94a3b8", fontStyle: "italic" }}>
                        ملاحظة: {lead.notes}
                      </small>
                    )}
                  </div>
                </td>
                <td>
                  <select
                    value={lead.status}
                    onChange={(e) => handleLeadStatusChange(lead.id, e.target.value as PlatformDemoLead["status"])}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      border: "1px solid #cbd5e1",
                      fontWeight: 600,
                      background:
                        lead.status === "NEW" ? "#fef2f2" :
                        lead.status === "CONVERTED" ? "#f0fdf4" :
                        lead.status === "DEMO_SCHEDULED" ? "#eff6ff" : "#fff",
                      color:
                        lead.status === "NEW" ? "#b91c1c" :
                        lead.status === "CONVERTED" ? "#15803d" :
                        lead.status === "DEMO_SCHEDULED" ? "#1d4ed8" : "#334155",
                    }}
                  >
                    <option value="NEW">جديد (New)</option>
                    <option value="CONTACTED">تم التواصل (Contacted)</option>
                    <option value="DEMO_SCHEDULED">مجدول للعرض (Demo Scheduled)</option>
                    <option value="CONVERTED">تم التحويل لعميل (Converted)</option>
                    <option value="REJECTED">مرفوض / غير مهتم</option>
                  </select>
                </td>
                <td>
                  <small>{fmtDate(lead.createdAt)}</small>
                </td>
                <td>
                  <div className="pc-live-row-actions">
                    <button
                      type="button"
                      style={{ color: "#15803d", borderColor: "#bbf7d0", background: "#f0fdf4" }}
                      onClick={() => handleWhatsAppLeadChat(lead)}
                      title="فتح محادثة واتساب فورية لترتيب الديمو"
                    >
                      <MessageCircle size={13} style={{ display: "inline", verticalAlign: "middle", marginLeft: "2px" }} /> واتساب
                    </button>
                    <button
                      type="button"
                      className="pc-live-link"
                      style={{
                        background: lead.status === "CONVERTED" ? "#f8fafc" : "#eff6ff",
                        color: lead.status === "CONVERTED" ? "#475569" : "#1d4ed8",
                        borderColor: lead.status === "CONVERTED" ? "#cbd5e1" : "#93c5fd",
                        fontWeight: 700,
                      }}
                      onClick={() => handleOpenConvertModal(lead)}
                      title={
                        lead.status === "CONVERTED"
                          ? "تم تحويل هذا الطلب لأكاديمية نشطة (انقر لعرض البيانات)"
                          : "تحويل فوري إلى أكاديمية مفعّلة بضغطة زر"
                      }
                    >
                      <Building2 size={13} style={{ display: "inline", verticalAlign: "middle", marginLeft: "2px" }} />
                      {lead.status === "CONVERTED" ? "مُفعّل كعميل ✅" : "تحويل إلى أكاديمية 🚀"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={7} className="pc-live-empty-cell">
                  لا توجد طلبات معاينة مطابقة لمعايير البحث.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
