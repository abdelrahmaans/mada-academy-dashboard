import { AlertCircle, ArrowUpRight, ShieldCheck } from "lucide-react";

export type EscalationBannerProps = {
  escalated: boolean;
  message: string;
  allowedMessage?: string;
  nextAction?: string;
};

export default function EscalationBanner({
  escalated,
  message,
  allowedMessage,
  nextAction,
}: EscalationBannerProps) {
  return (
    <div
      className={`escalation-banner ${escalated ? "is-escalated" : "is-allowed"}`}
      role="status"
    >
      <span className="escalation-banner-icon">
        {escalated ? <AlertCircle size={15} /> : <ShieldCheck size={15} />}
      </span>
      <span className="escalation-banner-copy">
        <strong>{escalated ? "يتطلب تصعيدًا" : "ضمن نطاق الصلاحية"}</strong>
        <small>{escalated ? message : (allowedMessage ?? message)}</small>
        {nextAction && (
          <em>
            <ArrowUpRight size={12} /> {nextAction}
          </em>
        )}
      </span>
    </div>
  );
}
