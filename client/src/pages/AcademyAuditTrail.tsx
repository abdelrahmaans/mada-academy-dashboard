import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Activity,
  Search,
  Calendar,
  Filter,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Eye,
  X,
  Copy,
  Check,
  Clock,
} from "lucide-react";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import PageHeader from "@/components/PageHeader";
import RoleSurfaceTopbar from "@/components/RoleSurfaceTopbar";
import { apiClient, type AcademyAuditEventItem } from "@/lib/apiClient";
import {
  formatAuditAction,
  formatAuditTargetType,
  formatAuditTargetId,
  parseAuditMetadata,
  AUDIT_ACTION_MAP,
} from "@/lib/auditLabels";
import { toast } from "sonner";
import "./AcademyAuditTrail.css";

function formatArabicDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default function AcademyAuditTrail() {
  const [events, setEvents] = useState<AcademyAuditEventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<AcademyAuditEventItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.auditEvents({
        page,
        pageSize,
        action: actionFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setEvents(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch {
      toast.error("تعذر تحميل سجل الأحداث والتدقيق");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter, fromDate, toDate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(
      (ev) =>
        ev.action.toLowerCase().includes(q) ||
        ev.targetType.toLowerCase().includes(q) ||
        ev.targetId.toLowerCase().includes(q) ||
        (ev.actorName && ev.actorName.toLowerCase().includes(q)) ||
        (ev.reason && ev.reason.toLowerCase().includes(q))
    );
  }, [events, searchQuery]);

  const copyMetadata = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("تم نسخ البيانات الإضافية");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <RoleDashboardShell
      className="app-shell"
      roleCode="R01"
      roleLabel="مسؤول الأكاديمية"
      scopeLevel="tenant"
      scopeLabel="كل فروع الأكاديمية"
      tenantName="الأكاديمية الحالية"
      branchName="الإدارة العامة"
      demo={false}
      mobileOpen={mobileNavOpen}
      onCloseMobile={() => setMobileNavOpen(false)}
    >
      <main className="main-panel">
        <RoleSurfaceTopbar onMenu={() => setMobileNavOpen(true)} scopeLabel="سجل الحوكمة والتدقيق" />
        <div className="workspace academy-audit-page" dir="rtl">
          <PageHeader
            eyebrow={
              <span className="eyebrow">
                <Activity size={14} /> الحوكمة والامتثال · R01
              </span>
            }
            title="سجل التدقيق والحوكمة (Audit Trail)"
            description="سجل زمني رسمي وموثق لكافة العمليات الحساسة وتغييرات الصلاحيات وإدارة الفروع والطلاب داخل الأكاديمية."
            actions={
              <button
                type="button"
                className="audit-btn audit-btn-primary"
                onClick={() => void loadData()}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                تحديث السجل
              </button>
            }
          />

          <section className="audit-controls" aria-label="أدوات التصفية">
            <div className="audit-search-input">
              <Search size={16} />
              <input
                type="text"
                placeholder="بحث برقم الإجراء أو الفاعل أو السبب…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="audit-select-filter">
              <Filter size={16} />
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">كل العمليات ({total})</option>
                <option value="RETENTION_OUTREACH_RECORDED">تسجيل تواصل استبقاء طالب</option>
                <option value="ROLE_PERMISSIONS_OVERRIDDEN">تعديل صلاحيات دور</option>
                <option value="MEMBER_PERMISSIONS_OVERRIDDEN">تعديل صلاحيات مستخدم</option>
                <option value="STUDENT_ENROLLED">تسجيل طالب</option>
                <option value="PAYMENT_RECORDED">تسجيل سند قبض</option>
                <option value="EXPENSE_APPROVED">اعتماد مصروف</option>
                <option value="BRANCH_CREATED">إنشاء فرع</option>
              </select>
            </div>

            <div className="audit-date-filter">
              <Calendar size={16} />
              <input
                type="date"
                title="من تاريخ"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
              />
              <span>إلى</span>
              <input
                type="date"
                title="إلى تاريخ"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </section>

          <div className="audit-stats-row">
            <span>إجمالي الأحداث المسجلة: <strong>{total}</strong></span>
            <span>الصفحة {page} من {totalPages}</span>
          </div>

          <section className="audit-table-wrapper">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>نوع العملية</th>
                  <th>الفاعل</th>
                  <th>العنصر المستهدف</th>
                  <th>السبب والملاحظات</th>
                  <th>التاريخ والتوقيت</th>
                  <th>التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="audit-empty-state">
                        <RefreshCw size={24} className="animate-spin text-teal-600" />
                        <span>جارٍ استرجاع سجلات التدقيق والحوكمة…</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="audit-empty-state">
                        <Activity size={32} />
                        <strong>لا توجد أحداث مسجلة تطابق هذه التصفية</strong>
                        <span>جرب توسيع نطاق التاريخ أو إزالة الفلاتر</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((ev) => {
                    const meta = formatAuditAction(ev.action);
                    return (
                      <tr key={ev.id}>
                        <td>
                          <span className={`audit-action-badge audit-badge-${meta.tone}`}>
                            <Activity size={12} />
                            {meta.label}
                          </span>
                        </td>
                        <td>
                          <div className="audit-actor-info">
                            <span className="audit-actor-name">{ev.actorName ?? "النظام / تلقائي"}</span>
                            {ev.actorUserId && <span className="audit-actor-id">{ev.actorUserId.slice(0, 8)}…</span>}
                          </div>
                        </td>
                        <td>
                          <span className="audit-target-chip">
                            {formatAuditTargetType(ev.targetType)} ({formatAuditTargetId(ev.targetId, ev.targetType)})
                          </span>
                        </td>
                        <td>
                          <span className="text-slate-600 line-clamp-1">{ev.reason ?? "—"}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1 text-slate-500 whitespace-nowrap">
                            <Clock size={13} />
                            {formatArabicDate(ev.createdAt)}
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="audit-btn"
                            onClick={() => setSelectedEvent(ev)}
                            title="عرض السجل الكامل"
                          >
                            <Eye size={13} />
                            عرض
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <footer className="audit-pagination">
              <div>
                عرض {filteredEvents.length} من أصل {total} حدث
              </div>
              <div className="audit-pagination-buttons">
                <button
                  type="button"
                  className="audit-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  <ChevronRight size={14} />
                  السابق
                </button>
                <span>{page} / {totalPages}</span>
                <button
                  type="button"
                  className="audit-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                >
                  التالي
                  <ChevronLeft size={14} />
                </button>
              </div>
            </footer>
          </section>
        </div>
      </main>

      {selectedEvent && (
        <div className="audit-modal-backdrop" onClick={() => setSelectedEvent(null)}>
          <div className="audit-modal" onClick={(e) => e.stopPropagation()}>
            <header className="audit-modal-header">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-teal-600" />
                <h3>تفاصيل حدث الحوكمة والتدقيق</h3>
              </div>
              <button
                type="button"
                className="audit-btn"
                onClick={() => setSelectedEvent(null)}
              >
                <X size={16} />
              </button>
            </header>

            <div className="audit-modal-body">
              <div className="audit-detail-grid">
                <div className="audit-detail-card">
                  <span className="audit-detail-label">نوع الإجراء</span>
                  <span className="audit-detail-val font-bold text-teal-800">{formatAuditAction(selectedEvent.action).label}</span>
                </div>
                <div className="audit-detail-card">
                  <span className="audit-detail-label">تاريخ ووقت التنفيذ</span>
                  <span className="audit-detail-val">{formatArabicDate(selectedEvent.createdAt)}</span>
                </div>
                <div className="audit-detail-card">
                  <span className="audit-detail-label">المسؤول / الفاعل</span>
                  <span className="audit-detail-val">{selectedEvent.actorName ?? "النظام التلقائي"}</span>
                </div>
                <div className="audit-detail-card">
                  <span className="audit-detail-label">عنوان الاتصال</span>
                  <span className="audit-detail-val">{selectedEvent.ipAddress ?? "داخلي / محمي"}</span>
                </div>
                <div className="audit-detail-card">
                  <span className="audit-detail-label">نوع الهدف المستهدف</span>
                  <span className="audit-detail-val">{formatAuditTargetType(selectedEvent.targetType)}</span>
                </div>
                <div className="audit-detail-card">
                  <span className="audit-detail-label">معرف السجل</span>
                  <span className="audit-detail-val font-semibold">{formatAuditTargetId(selectedEvent.targetId, selectedEvent.targetType)}</span>
                </div>
              </div>

              {selectedEvent.reason && (
                <div className="audit-detail-card" style={{ marginTop: "10px" }}>
                  <span className="audit-detail-label">سبب الإجراء والمبرر الرسمي</span>
                  <span className="audit-detail-val">{selectedEvent.reason}</span>
                </div>
              )}

              {selectedEvent.metadataJson && (
                <div style={{ marginTop: "14px" }}>
                  {(() => {
                    const friendlyEntries = parseAuditMetadata(selectedEvent.metadataJson);
                    return (
                      <div className="space-y-3">
                        {friendlyEntries.length > 0 && (
                          <div className="audit-detail-card" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                            <span className="audit-detail-label" style={{ color: "#0f766e", marginBottom: "8px", display: "block" }}>
                              تفاصيل وبيانات العملية:
                            </span>
                            <div style={{ display: "grid", gap: "8px" }}>
                              {friendlyEntries.map((entry, idx) => (
                                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
                                  <span style={{ color: "#64748b", fontWeight: 600 }}>{entry.keyLabel}:</span>
                                  <span style={{ color: "#0f172a", fontWeight: 700 }}>{entry.valueDisplay}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <details style={{ marginTop: "8px", fontSize: "11px", color: "#64748b" }}>
                          <summary style={{ cursor: "pointer", fontWeight: 700, padding: "4px 0" }}>
                            عرض كود البيانات التقنية (JSON)
                          </summary>
                          <div className="flex items-center justify-between my-1">
                            <span className="text-[11px] text-slate-500">Payload JSON:</span>
                            <button
                              type="button"
                              className="audit-btn py-1 px-2 text-xs"
                              onClick={() => copyMetadata(selectedEvent.metadataJson ?? "")}
                            >
                              {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                              {copied ? "تم النسخ" : "نسخ JSON"}
                            </button>
                          </div>
                          <pre className="audit-json-box">
                            {(() => {
                              try {
                                return JSON.stringify(JSON.parse(selectedEvent.metadataJson ?? ""), null, 2);
                              } catch {
                                return selectedEvent.metadataJson;
                              }
                            })()}
                          </pre>
                        </details>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </RoleDashboardShell>
  );
}
