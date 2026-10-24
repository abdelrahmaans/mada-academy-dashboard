import React from "react";
import { CalendarCheck } from "lucide-react";
import type { SessionRecord } from "@/lib/apiClient";
import { sessionStatusLabel } from "@/lib/statusLabels";
import { formatDate, formatTime } from "@/pages/InstructorDeskTypes";

export interface InstructorSessionsViewProps {
  sessions: SessionRecord[];
  selectedSessionId: string;
  onSelectSession: (id: string) => void;
  branch: string;
  currentUserId?: string;
}

export function InstructorSessionsView({
  sessions,
  selectedSessionId,
  onSelectSession,
  branch,
  currentUserId,
}: InstructorSessionsViewProps) {
  return (
    <section className="r04-live-panel">
      <div className="r04-live-panel-head">
        <div>
          <h2>حصصي وجلسات المتابعة</h2>
          <p>{sessions.length} جلسة ضمن آخر 30 يومًا والقادم 60 يومًا.</p>
        </div>
      </div>
      <div className="r04-live-session-list">
        {sessions.map(session => (
          <button
            type="button"
            className={`r04-live-session ${session.id === selectedSessionId ? "selected" : ""}`}
            key={session.id}
            onClick={() => onSelectSession(session.id)}
          >
            <span className="r04-live-session-icon">
              <CalendarCheck size={17} />
            </span>
            <span className="r04-live-session-main">
              <strong>
                {session.courseName ?? `جلسة ${session.sessionNumber}`}
              </strong>
              <small>
                {session.branchName ?? branch} ·{" "}
                {session.classroomName ?? "قاعة غير محددة"}
              </small>
              <small>
                {formatDate(session.startAt)} ·{" "}
                {formatTime(session.startAt)}–{formatTime(session.endAt)}
              </small>
              {currentUserId &&
                session.instructorId !== currentUserId &&
                session.substituteInstructorId !== currentUserId && (
                  <small className="r04-live-supervision-label">
                    متابعة مفوضة · قراءة فقط
                  </small>
                )}
            </span>
            <span
              className={`r04-live-status ${session.status === "COMPLETED" ? "completed" : ""}`}
            >
              {sessionStatusLabel(session.status)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
