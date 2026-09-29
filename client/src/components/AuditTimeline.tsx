import { Check, CircleAlert, Clock3, FileCheck2, X } from "lucide-react";
import type { ReactNode } from "react";

export type AuditEventTone =
  | "neutral"
  | "pending"
  | "approved"
  | "rejected"
  | "escalated";

export type AuditEvent = {
  id: string;
  title: string;
  description?: string;
  actor: string;
  timestamp: string;
  tone?: AuditEventTone;
  meta?: ReactNode;
};

function EventIcon({ tone }: { tone: AuditEventTone }) {
  if (tone === "approved") return <Check size={14} />;
  if (tone === "rejected") return <X size={14} />;
  if (tone === "pending") return <Clock3 size={14} />;
  if (tone === "escalated") return <CircleAlert size={14} />;
  return <FileCheck2 size={14} />;
}

export type AuditTimelineProps = {
  events: AuditEvent[];
  emptyLabel?: string;
  demo?: boolean;
};

export default function AuditTimeline({
  events,
  emptyLabel = "لا توجد أحداث مسجلة بعد.",
  demo = true,
}: AuditTimelineProps) {
  return (
    <div className="audit-timeline">
      {events.length ? (
        <ol className="audit-timeline-list">
          {events.map(event => {
            const tone = event.tone ?? "neutral";
            return (
              <li
                className={`audit-timeline-event audit-timeline-${tone}`}
                key={event.id}
              >
                <span className="audit-timeline-marker" aria-hidden="true">
                  <EventIcon tone={tone} />
                </span>
                <div className="audit-timeline-content">
                  <div className="audit-timeline-heading">
                    <strong>{event.title}</strong>
                    <time>{event.timestamp}</time>
                  </div>
                  <span className="audit-timeline-actor">
                    بواسطة {event.actor}
                  </span>
                  {event.description && <p>{event.description}</p>}
                  {event.meta && (
                    <div className="audit-timeline-meta">{event.meta}</div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="audit-timeline-empty">
          <Clock3 size={18} />
          <span>{emptyLabel}</span>
        </div>
      )}
      {demo && (
        <small className="audit-timeline-disclaimer">
          DEMO · السجل مؤقت داخل المتصفح ويحتاج Audit Log على الخادم.
        </small>
      )}
    </div>
  );
}
