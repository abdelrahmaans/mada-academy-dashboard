import { Check, CircleAlert, Clock3, Megaphone } from "lucide-react";

export type CampaignWorkflowStatus =
  | "draft"
  | "in_review"
  | "active"
  | "paused"
  | "completed";

export type CampaignWorkflowProps = {
  status: CampaignWorkflowStatus;
  campaignName: string;
  onSubmitForReview?: () => void;
};

const steps: Array<{ id: CampaignWorkflowStatus; label: string }> = [
  { id: "draft", label: "مسودة" },
  { id: "in_review", label: "مراجعة" },
  { id: "active", label: "نشطة" },
  { id: "completed", label: "مكتملة" },
];

export default function CampaignWorkflow({
  status,
  campaignName,
  onSubmitForReview,
}: CampaignWorkflowProps) {
  const currentIndex =
    status === "paused" ? 2 : steps.findIndex(step => step.id === status);
  return (
    <section
      className="campaign-workflow"
      aria-label={`مسار الحملة ${campaignName}`}
    >
      <div className="campaign-workflow-heading">
        <span>
          <Megaphone size={15} />
        </span>
        <div>
          <small>مسار الحملة</small>
          <strong>{campaignName}</strong>
        </div>
        <b className={status}>
          {status === "paused"
            ? "متوقفة مؤقتًا"
            : steps.find(step => step.id === status)?.label}
        </b>
      </div>
      <div className="campaign-workflow-steps">
        {steps.map((step, index) => (
          <span
            key={step.id}
            className={
              index < currentIndex
                ? "complete"
                : index === currentIndex
                  ? "current"
                  : "upcoming"
            }
          >
            {index < currentIndex ? (
              <Check size={12} />
            ) : index === currentIndex ? (
              <Clock3 size={12} />
            ) : (
              <i />
            )}
            {step.label}
          </span>
        ))}
      </div>
      {status === "draft" && onSubmitForReview && (
        <button type="button" onClick={onSubmitForReview}>
          <CircleAlert size={13} /> إرسال للمراجعة قبل النشر
        </button>
      )}
      {status === "paused" && (
        <small className="campaign-workflow-note">
          الحملة متوقفة مؤقتًا؛ راجعي سبب الإيقاف قبل إعادة التنشيط.
        </small>
      )}
    </section>
  );
}
