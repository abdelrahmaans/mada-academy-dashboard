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
            متابعة طلبات المعاينة المسجلة على الخادم وتحويلها إلى أكاديميات مفعّلة بنقرة واحدة.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span className="pc-live-count-badge">
            <Sparkles size={14} style={{ display: "inline", marginLeft: "4px" }} />
            {filteredLeads.length} طلب معاينة
          </span>
        </div>
      </header>

      {/* Filter Tabs & Search */}
      <div className="pc-live-filter-bar" style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
        <div style={{ flex: 1, minWidth: "240px", position: "relative", display: "flex", alignItems: "center" }}>
          <Search size={16} style={{ position: "absolute", right: "12px", color: "#94a3b8" }} />
          <input
            type="search"
            placeholder="ابحث باسم المسؤول، الأكاديمية، الهاتف، أو البريد..."
            value={leadSearch}
            onChange={(e) => setLeadSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 36px 9px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              fontSize: "13px",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        </div>
        <div className="pc-filter-tabs" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
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
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: leadFilter === tab.id ? "1px solid #0f766e" : "1px solid #e2e8f0",
                background: leadFilter === tab.id ? "#0f766e" : "#ffffff",
                color: leadFilter === tab.id ? "#ffffff" : "#475569",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
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
                    disabled={lead.status === "CONVERTED"}
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
                  <div className="pc-live-row-actions" style={{ gap: "6px" }}>
                    <button
                      type="button"
                      style={{
                        color: "#047857",
                        borderColor: "#a7f3d0",
                        background: "#ecfdf5",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={() => handleWhatsAppLeadChat(lead)}
                      title="فتح محادثة واتساب فورية لترتيب الديمو"
                    >
                      <MessageCircle size={14} /> واتساب
                    </button>
                    <button
                      type="button"
                      disabled={lead.status === "CONVERTED"}
                      style={{
                        background: lead.status === "CONVERTED" ? "#f1f5f9" : "#0f766e",
                        color: lead.status === "CONVERTED" ? "#64748b" : "#ffffff",
                        border: lead.status === "CONVERTED" ? "1px solid #cbd5e1" : "none",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: lead.status === "CONVERTED" ? "default" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        boxShadow: lead.status === "CONVERTED" ? "none" : "0 2px 4px rgba(15, 118, 110, 0.2)",
                      }}
                      onClick={() => handleOpenConvertModal(lead)}
                      title={
                        lead.status === "CONVERTED"
                          ? "تم تحويل هذا الطلب لأكاديمية نشطة (انقر لعرض البيانات)"
                          : "تحويل فوري إلى أكاديمية مفعّلة بضغطة زر"
                      }
                    >
                      <Building2 size={14} />
                      {lead.status === "CONVERTED" ? "مُفعّل كعميل ✅" : "تحويل إلى أكاديمية 🚀"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={7} className="pc-live-empty-cell">
                  لا توجد بيانات CRM محمّلة من الخادم.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
