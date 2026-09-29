import { ArrowUpLeft, CheckCircle2, ShieldCheck, Users } from "lucide-react";

export type MarketingLeadHandoffProps = {
  leadName: string;
  status: "new" | "contacted" | "interested" | "trial" | "enrolled";
  onHandoff: () => void;
};

export default function MarketingLeadHandoff({
  leadName,
  status,
  onHandoff,
}: MarketingLeadHandoffProps) {
  const ready = status === "interested" || status === "trial";
  return (
    <div className="marketing-lead-handoff">
      <div className="marketing-lead-handoff-heading">
        <span>
          <Users size={14} />
        </span>
        <div>
          <small>حدود التسليم</small>
          <strong>Marketing → R05</strong>
        </div>
      </div>
      <div className="marketing-lead-handoff-steps">
        <span className="complete">
          <CheckCircle2 size={12} /> مصدر الحملة
        </span>
        <span className={ready ? "complete" : "current"}>
          <CheckCircle2 size={12} /> اهتمام الأسرة
        </span>
        <span className="next">
          <ShieldCheck size={12} /> متابعة السكرتارية
        </span>
      </div>
      <small>
        {ready
          ? `${leadName} جاهز للتحويل إلى متابعة R05.`
          : "حوّلي فقط بعد تأكيد اهتمام الأسرة أو الحصة التجريبية."}
      </small>
      <button type="button" disabled={!ready} onClick={onHandoff}>
        تحويل إلى R05 <ArrowUpLeft size={13} />
      </button>
    </div>
  );
}
