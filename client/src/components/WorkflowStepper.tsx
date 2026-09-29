import {
  Check,
  CircleAlert,
  Clock3,
  FileText,
  ShieldCheck,
} from "lucide-react";

export type WorkflowStepStatus = "complete" | "current" | "upcoming" | "halted";

export type WorkflowStep = {
  id: string;
  label: string;
  caption?: string;
  status: WorkflowStepStatus;
};

export type WorkflowStepperProps = {
  steps: WorkflowStep[];
  title?: string;
  description?: string;
};

function StepIcon({
  status,
  index,
}: {
  status: WorkflowStepStatus;
  index: number;
}) {
  if (status === "complete") return <Check size={13} />;
  if (status === "current") return <Clock3 size={13} />;
  if (status === "halted") return <CircleAlert size={13} />;
  if (index === 0) return <FileText size={13} />;
  return <ShieldCheck size={13} />;
}

export default function WorkflowStepper({
  steps,
  title = "مسار الطلب",
  description = "الحالة الحالية والخطوة التالية في دورة القرار.",
}: WorkflowStepperProps) {
  return (
    <section className="workflow-stepper" aria-label={title}>
      <div className="workflow-stepper-heading">
        <div>
          <strong>{title}</strong>
          <small>{description}</small>
        </div>
        <span>
          {steps.find(step => step.status === "current")?.label ?? "مكتمل"}
        </span>
      </div>
      <ol className="workflow-stepper-list">
        {steps.map((step, index) => (
          <li
            className={`workflow-stepper-step workflow-stepper-${step.status}`}
            key={step.id}
          >
            <span className="workflow-stepper-marker" aria-hidden="true">
              <StepIcon status={step.status} index={index} />
            </span>
            <div>
              <strong>{step.label}</strong>
              {step.caption && <small>{step.caption}</small>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
