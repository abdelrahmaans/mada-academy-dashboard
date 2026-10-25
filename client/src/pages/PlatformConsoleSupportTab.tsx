import React from "react";
import {
  ChevronLeft,
  KeyRound,
  LifeBuoy,
  Lightbulb,
  LockKeyhole,
  Plus,
  RefreshCw,
} from "lucide-react";
import type { PlatformAcademy, PlatformMember } from "@/lib/apiClient";
import {
  statusLabel,
  ticketPriorityLabels,
  ticketStatusLabels,
  type SupportTicket,
} from "./PlatformConsoleTypes";
import { MemberTable } from "./PlatformConsoleComponents";

export interface PlatformConsoleSupportTabProps {
  filteredTickets: SupportTicket[];
  ticketFilter: "ALL" | "ISSUE" | "SUGGESTION" | "BILLING";
  setTicketFilter: (val: "ALL" | "ISSUE" | "SUGGESTION" | "BILLING") => void;
  onOpenNewTicketModal: () => void;
  onSelectTicket: (ticket: SupportTicket) => void;
  selectedTenantId: string;
  setSelectedTenantId: (val: string) => void;
  academies: PlatformAcademy[];
  userSearch: string;
  setUserSearch: (val: string) => void;
  selectedTenant: PlatformAcademy | null | undefined;
  onResetOwnerPassword: (tenant: PlatformAcademy) => void;
  busyKey: string | null | undefined;
  supportLoading: boolean;
  supportError: string | null;
  members: PlatformMember[];
  onDisableMember: (member: PlatformMember) => void;
  onRestore: (member: PlatformMember) => void;
  onRevokeMemberSessions: (member: PlatformMember) => void;
  ownerResetEnabled: boolean;
}

export function PlatformConsoleSupportTab({
  filteredTickets,
  ticketFilter,
  setTicketFilter,
  onOpenNewTicketModal,
  onSelectTicket,
  selectedTenantId,
  setSelectedTenantId,
  academies,
  userSearch,
  setUserSearch,
  selectedTenant,
  onResetOwnerPassword,
  busyKey,
  supportLoading,
  supportError,
  members,
  onDisableMember,
  onRestore,
  onRevokeMemberSessions,
  ownerResetEnabled,
}: PlatformConsoleSupportTabProps) {
  return (
    <>
      {/* Support Tickets Section */}
      <section className="pc-live-card">
        <header>
          <div>
            <h2>تذاكر الدعم الفني والاقتراحات</h2>
            <p>سجل التذاكر متوقف حتى ربطه بقاعدة البيانات؛ إدارة أعضاء الأكاديمية أدناه تستخدم API الخادم.</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              className="pc-live-primary"
              onClick={onOpenNewTicketModal}
              disabled
              style={{ padding: "6px 14px", fontSize: "12px", gap: "6px" }}
            >
              <Plus size={14} /> تسجيل تذكرة / اقتراح جديد
            </button>
            <span className="pc-live-boundary">
              <LifeBuoy size={14} /> سجل التذاكر غير متصل
            </span>
          </div>
        </header>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", padding: "0 4px", flexWrap: "wrap" }}>
          {[
            { id: "ALL", label: "الكل" },
            { id: "ISSUE", label: "أعطال وبلاغات تقنية 🚨" },
            { id: "SUGGESTION", label: "اقتراحات وميزات جديدة 💡" },
            { id: "BILLING", label: "اشتراكات وباقات 💳" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              disabled
              className={`pc-filter-tab ${ticketFilter === tab.id ? "active" : ""}`}
              onClick={() => setTicketFilter(tab.id as typeof ticketFilter)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pc-ticket-grid">
          {filteredTickets.map((ticket) => {
            const priority = ticketPriorityLabels[ticket.priority];
            const status = ticketStatusLabels[ticket.status];
            return (
              <article className="pc-ticket-card" key={ticket.id}>
                <span className={`pc-ticket-icon ${priority.class}`}>
                  {ticket.category === "اقتراح ميزة جديدة" || ticket.type === "suggestion" ? (
                    <Lightbulb size={18} />
                  ) : (
                    <LifeBuoy size={18} />
                  )}
                </span>
                <div className="pc-ticket-main">
                  <strong>{ticket.subject}</strong>
                  <small>
                    {ticket.id} · {ticket.category} · {ticket.createdAt}
                  </small>
                </div>
                <div className="pc-ticket-academy">
                  <strong>{ticket.academyName}</strong>
                  <small>
                    {ticket.requesterName} ({ticket.requesterPhone})
                  </small>
                </div>
                <span className={`pc-ticket-status ${status.class}`}>
                  {status.label}
                </span>
                <button
                  type="button"
                  className="pc-live-link"
                  onClick={() => onSelectTicket(ticket)}
                >
                  معاينة ومتابعة <ChevronLeft size={14} />
                </button>
              </article>
            );
          })}
          {filteredTickets.length === 0 && (
            <p className="pc-live-empty" role="status">لا توجد بيانات تذاكر من مصدر خادمي.</p>
          )}
        </div>
      </section>

      {/* Owner Account Emergency Recovery & Member Directory */}
      <section className="pc-live-card">
        <header>
          <div>
            <h2>استعادة حسابات الملاك وإدارة المستخدمين الطارئة</h2>
            <p>
              اختر الأكاديمية لاستعادة كلمة مرور المالك فوريًا أو إنهاء الجلسات النشطة.
            </p>
          </div>
          <span className="pc-live-boundary">
            <LockKeyhole size={14} /> صلاحية طوارئ R00
          </span>
        </header>

        <div className="pc-live-support-controls">
          <label>
            <span>الأكاديمية المستهدفة</span>
            <select
              value={selectedTenantId}
              onChange={(event) => setSelectedTenantId(event.target.value)}
            >
              <option value="">اختر أكاديمية</option>
              {academies.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>بحث داخل مستخدمي الأكاديمية</span>
            <input
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="ابحث بالاسم أو البريد أو الهاتف..."
            />
          </label>
        </div>

        {selectedTenant && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              borderRadius: "12px",
              background: "#f0fdfa",
              border: "1px solid #ccfbf1",
              marginBottom: "16px",
            }}
          >
            <div>
              <strong style={{ fontSize: "14px", color: "#0f766e" }}>
                {selectedTenant.name}
              </strong>
              <span style={{ display: "block", fontSize: "12px", color: "#115e59", marginTop: "2px" }}>
                المسؤول: {selectedTenant.owner || "غير مسجل"} · الحالة: {statusLabel[selectedTenant.status]}
              </span>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="pc-live-primary"
                style={{
                  background: "#0d9488",
                  borderColor: "#0d9488",
                  gap: "6px",
                }}
                onClick={() => onResetOwnerPassword(selectedTenant)}
                disabled={!ownerResetEnabled || busyKey === `reset:${selectedTenant.id}`}
              >
                <KeyRound size={15} />
                توليد كلمة مرور مؤقتة للمالك
              </button>
            </div>
          </div>
        )}

        {supportLoading && (
          <div className="pc-live-state">
            <RefreshCw className="pc-live-spin" size={16} /> جارٍ فحص الحسابات…
          </div>
        )}
        {supportError && (
          <div className="pc-live-error" role="alert">
            {supportError}
          </div>
        )}
        {!supportLoading && selectedTenant && (
          <MemberTable
            rows={members}
            busyKey={busyKey || undefined}
            onDisable={onDisableMember}
            onRestore={onRestore}
            onRevoke={onRevokeMemberSessions}
          />
        )}
        {!supportLoading && !selectedTenant && (
          <p className="pc-live-empty">اختر أكاديمية لإدارة مستخدميها واستعادة حساب مالكها.</p>
        )}
      </section>
    </>
  );
}
