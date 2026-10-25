import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Eye,
  UserPlus,
  RefreshCw,
  X,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  apiClient,
  type SessionRecord,
  type AttendanceItem,
  type SchedulingGroupRecord,
} from "@/lib/apiClient";
import { sessionStatusLabel } from "@/lib/statusLabels";

export interface SecretaryPulseTabProps {
  groups: SchedulingGroupRecord[];
  onDirectRegister: (offeringId?: string) => void;
}

export function SecretaryPulseTab({
  groups,
  onDirectRegister,
}: SecretaryPulseTabProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Roster modal states
  const [rosterSession, setRosterSession] = useState<SessionRecord | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [attendanceList, setAttendanceList] = useState<AttendanceItem[]>([]);
  const [rosterError, setRosterError] = useState<string | null>(null);

  const loadDaySessions = async () => {
    setLoading(true);
    try {
      const from = new Date(`${selectedDate}T00:00:00Z`).toISOString();
      const to = new Date(`${selectedDate}T23:59:59Z`).toISOString();
      const res = await apiClient.listSessions({ from, to });
      setSessions(res.items);
    } catch (cause) {
      toast.error("تعذر تحميل جدول اليوم", {
        description: cause instanceof Error ? cause.message : "خطأ في الاتصال بالخادم.",
      });
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDaySessions();
  }, [selectedDate]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const matchSearch =
        !search.trim() ||
        (session.courseName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (session.instructorName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (session.classroomName?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchStatus = statusFilter === "ALL" || session.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [sessions, search, statusFilter]);

  const stats = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter(s => s.status === "COMPLETED").length;
    const inProgress = sessions.filter(s => s.status === "IN_PROGRESS").length;
    const scheduled = sessions.filter(s => s.status === "SCHEDULED").length;
    return { total, completed, inProgress, scheduled };
  }, [sessions]);

  const handleOpenRoster = async (session: SessionRecord) => {
    setRosterSession(session);
    setRosterLoading(true);
    setRosterError(null);
    try {
      const res = await apiClient.getSessionAttendance(session.id);
      setAttendanceList(res.items);
    } catch (cause) {
      setRosterError(cause instanceof Error ? cause.message : "تعذر تحميل كشف الطلاب.");
      setAttendanceList([]);
    } finally {
      setRosterLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="secretary-pulse-container" dir="rtl">
      {/* Date Header & Quick Filter */}
      <div className="pulse-header-bar">
        <div className="pulse-date-control">
          <Calendar size={18} />
          <label htmlFor="pulse-date-picker">تاريخ الجدول:</label>
          <input
            id="pulse-date-picker"
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
          <button
            type="button"
            className="pulse-today-btn"
            onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
          >
            اليوم
          </button>
        </div>

        <div className="pulse-header-actions">
          <button
            type="button"
            className="pulse-refresh-btn"
            onClick={() => void loadDaySessions()}
            disabled={loading}
          >
            <RefreshCw size={14} /> تحديث
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="pulse-stats-grid">
        <div className="pulse-stat-card total">
          <div className="stat-label">
            <Calendar size={15} /> إجمالي حصص اليوم
          </div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="pulse-stat-card in-progress">
          <div className="stat-label">
            <PlayCircle size={15} /> جارية الآن
          </div>
          <div className="stat-value">{stats.inProgress}</div>
        </div>
        <div className="pulse-stat-card completed">
          <div className="stat-label">
            <CheckCircle2 size={15} /> مكتملة
          </div>
          <div className="stat-value">{stats.completed}</div>
        </div>
        <div className="pulse-stat-card scheduled">
          <div className="stat-label">
            <Clock size={15} /> قادمة / مجدولة
          </div>
          <div className="stat-value">{stats.scheduled}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="pulse-filter-bar">
        <div className="pulse-search-wrap">
          <Search size={15} />
          <input
            type="text"
            placeholder="بحث بالدورة، المدرب، أو القاعة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="pulse-status-tabs">
          <button
            type="button"
            className={statusFilter === "ALL" ? "active" : ""}
            onClick={() => setStatusFilter("ALL")}
          >
            الكل ({sessions.length})
          </button>
          <button
            type="button"
            className={statusFilter === "SCHEDULED" ? "active" : ""}
            onClick={() => setStatusFilter("SCHEDULED")}
          >
            مجدولة ({stats.scheduled})
          </button>
          <button
            type="button"
            className={statusFilter === "IN_PROGRESS" ? "active" : ""}
            onClick={() => setStatusFilter("IN_PROGRESS")}
          >
            جارية ({stats.inProgress})
          </button>
          <button
            type="button"
            className={statusFilter === "COMPLETED" ? "active" : ""}
            onClick={() => setStatusFilter("COMPLETED")}
          >
            مكتملة ({stats.completed})
          </button>
        </div>
      </div>

      {/* Sessions Timeline List */}
      <div className="pulse-sessions-list">
        {loading ? (
          <div className="pulse-empty-state">جارٍ تحميل جدول الحصص اليومي…</div>
        ) : filteredSessions.length === 0 ? (
          <div className="pulse-empty-state">
            <Calendar size={32} />
            <strong>لا توجد جلسات مجدولة في هذا التاريخ.</strong>
            <span>يمكنك تغيير التاريخ من شريط التحكم بأعلى الصفحة.</span>
          </div>
        ) : (
          filteredSessions.map(session => (
            <div key={session.id} className={`pulse-session-card ${session.status.toLowerCase()}`}>
              <div className="session-time-col">
                <span className="time-start">{formatTime(session.startAt)}</span>
                <span className="time-sep">إلى</span>
                <span className="time-end">{formatTime(session.endAt)}</span>
              </div>

              <div className="session-main-col">
                <div className="session-title-row">
                  <strong>{session.courseName ?? `جلسة ${session.sessionNumber}`}</strong>
                  <span className={`status-pill ${session.status.toLowerCase()}`}>
                    {sessionStatusLabel(session.status)}
                  </span>
                </div>
                <div className="session-details-row">
                  <span>
                    القاعة: <strong>{session.classroomName ?? "قاعة الفرع"}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    المدرب: <strong>{session.instructorName ?? "غير محدد"}</strong>
                  </span>
                  {session.substituteInstructorId && (
                    <span className="substitute-flag">
                      (المدرب البديل: {session.substituteInstructorName ?? "معين"})
                    </span>
                  )}
                  <span>·</span>
                  <span>حصة رقم {session.sessionNumber}</span>
                </div>
              </div>

              <div className="session-actions-col">
                <button
                  type="button"
                  className="pulse-action-btn roster"
                  onClick={() => handleOpenRoster(session)}
                >
                  <Eye size={14} /> كشف الحضور والطلاب
                </button>
                {session.courseOfferingId && (
                  <button
                    type="button"
                    className="pulse-action-btn register"
                    onClick={() => onDirectRegister(session.courseOfferingId!)}
                  >
                    <UserPlus size={14} /> تسجيل طالب
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Roster Modal */}
      {rosterSession && (
        <div className="r04-modal-overlay" onClick={() => setRosterSession(null)}>
          <div
            className="r04-modal-dialog pulse-roster-dialog"
            dir="rtl"
            onClick={e => e.stopPropagation()}
          >
            <div className="r04-modal-header">
              <div>
                <h2>كشف طلاب الجلسة والتحضير</h2>
                <p>
                  {rosterSession.courseName ?? `جلسة ${rosterSession.sessionNumber}`} · القاعة: {rosterSession.classroomName} · المدرب: {rosterSession.instructorName}
                </p>
              </div>
              <button
                type="button"
                className="r04-modal-close"
                onClick={() => setRosterSession(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="pulse-roster-body">
              {rosterLoading ? (
                <div className="r04-loading-hint">جارٍ جلب كشف الحضور من الخادم…</div>
              ) : rosterError ? (
                <div className="r04-inline-alert error">
                  <AlertCircle size={15} />
                  <span>{rosterError}</span>
                </div>
              ) : attendanceList.length === 0 ? (
                <div className="r04-empty-hint">لا يوجد طلاب مسجلون في هذه الجلسة.</div>
              ) : (
                <div className="pulse-roster-table-wrap">
                  <table className="pulse-roster-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>اسم الطالب</th>
                        <th>حالة الحضور</th>
                        <th>التأخير</th>
                        <th>وقت التسجيل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceList.map((item, idx) => (
                        <tr key={item.studentId}>
                          <td>{idx + 1}</td>
                          <td>
                            <strong>{item.studentName}</strong>
                          </td>
                          <td>
                            <span className={`roster-status-badge ${item.status.toLowerCase()}`}>
                              {item.status === "PRESENT"
                                ? "حاضر"
                                : item.status === "LATE"
                                ? "متأخر"
                                : item.status === "ABSENT"
                                ? "غائب"
                                : item.status === "EXCUSED"
                                ? "بعذر"
                                : "لم يسجل بعد"}
                            </span>
                          </td>
                          <td>
                            {item.status === "LATE" ? `${item.lateMinutes ?? 0} دقيقة` : "—"}
                          </td>
                          <td>
                            {item.updatedAt
                              ? new Date(item.updatedAt).toLocaleTimeString("ar-EG", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="r04-modal-footer">
              <button
                type="button"
                className="r04-btn-close"
                onClick={() => setRosterSession(null)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
