import React from "react";
import { CalendarCheck, Users } from "lucide-react";
import type { MySupervisionGroup, SessionRecord } from "@/lib/apiClient";
import { groupStatusLabel } from "@/lib/statusLabels";
import { formatDate } from "@/pages/InstructorDeskTypes";

export interface InstructorSupervisionViewProps {
  supervisionGroups: MySupervisionGroup[];
  supervisionError: string | null;
  sessions: SessionRecord[];
  onRetry: () => void;
  onViewAttendance: (sessionId: string) => void;
}

export function InstructorSupervisionView({
  supervisionGroups,
  supervisionError,
  sessions,
  onRetry,
  onViewAttendance,
}: InstructorSupervisionViewProps) {
  return (
    <section className="r04-live-panel">
      <div className="r04-live-panel-head">
        <div>
          <h2>الجروبات المفوض بمتابعتها</h2>
          <p>تكليفات نشطة من مدير الفرع، داخل نطاق فرعك فقط.</p>
        </div>
      </div>
      {supervisionError && (
        <section className="r04-live-alert" role="alert">
          <strong>تعذر تحميل تكليفات الإشراف</strong>
          <p>{supervisionError}</p>
          <button type="button" onClick={onRetry}>
            إعادة المحاولة
          </button>
        </section>
      )}
      {!supervisionError && supervisionGroups.length === 0 && (
        <div className="r04-live-empty">
          <Users size={22} />
          <strong>لا توجد جروبات مفوض إليك بمتابعتها حاليًا.</strong>
          <span>يظهر هنا فقط ما عيّنه مدير الفرع لحسابك.</span>
        </div>
      )}
      {!supervisionError && supervisionGroups.length > 0 && (
        <div className="r04-live-supervision-list">
          {supervisionGroups.map(group => {
            const groupSessions = sessions.filter(
              item => item.courseOfferingId === group.groupId
            );
            return (
              <article
                className="r04-live-supervision-card"
                key={group.assignmentId}
              >
                <div className="r04-live-supervision-main">
                  <strong>{group.courseName}</strong>
                  <small>
                    {formatDate(group.startDate)} – {formatDate(group.endDate)} ·{" "}
                    {groupStatusLabel(group.status)}
                  </small>
                  <div className="r04-live-supervision-permissions">
                    {group.canReadAttendance && <span>قراءة الحضور</span>}
                    {group.canReadEvaluations && <span>قراءة التقييمات</span>}
                    {group.canDecideEvaluations && <span>قرار نشر/إرجاع</span>}
                  </div>
                </div>
                {group.canReadAttendance && (
                  <button
                    type="button"
                    className="r04-live-primary"
                    disabled={groupSessions.length === 0}
                    onClick={() => {
                      if (!groupSessions[0]) return;
                      onViewAttendance(groupSessions[0].id);
                    }}
                  >
                    <CalendarCheck size={14} /> عرض الحضور (
                    {groupSessions.length})
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
