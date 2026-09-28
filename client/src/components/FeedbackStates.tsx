import {
  AlertCircle,
  CheckCircle2,
  LockKeyhole,
  RefreshCw,
  SearchX,
  LoaderCircle,
} from "lucide-react";
import type { ReactNode } from "react";

type BaseStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
};

function stateClasses(kind: string, compact: boolean, className?: string) {
  return [
    "role-feedback-state",
    `role-feedback-${kind}`,
    compact ? "role-feedback-compact" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function LoadingState({
  label = "جارٍ تحميل البيانات…",
  compact = false,
  className,
}: {
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={stateClasses("loading", compact, className)} role="status" aria-live="polite">
      <LoaderCircle className="role-feedback-spinner" size={compact ? 17 : 22} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  compact = false,
  className,
}: BaseStateProps) {
  return (
    <div className={stateClasses("empty", compact, className)} role="status">
      <SearchX size={compact ? 18 : 24} aria-hidden="true" />
      <strong>{title}</strong>
      {description && <span>{description}</span>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "تعذر تحميل البيانات",
  description = "حدثت مشكلة مؤقتة في قراءة هذه المساحة.",
  action,
  compact = false,
  className,
}: BaseStateProps) {
  return (
    <div className={stateClasses("error", compact, className)} role="alert">
      <AlertCircle size={compact ? 18 : 24} aria-hidden="true" />
      <strong>{title}</strong>
      <span>{description}</span>
      {action ?? (
        <button type="button" onClick={() => window.location.reload()}>
          <RefreshCw size={14} aria-hidden="true" /> إعادة المحاولة
        </button>
      )}
    </div>
  );
}

export function LockedState({
  title = "هذه المساحة مقفولة لهذا الدور",
  description = "اطلب التصعيد من المسؤول المختص عند الحاجة.",
  action,
  compact = false,
  className,
}: BaseStateProps) {
  return (
    <div className={stateClasses("locked", compact, className)} role="note">
      <LockKeyhole size={compact ? 17 : 22} aria-hidden="true" />
      <strong>{title}</strong>
      <span>{description}</span>
      {action}
    </div>
  );
}

export function SuccessState({
  title,
  description,
  compact = true,
  className,
}: Omit<BaseStateProps, "action">) {
  return (
    <div className={stateClasses("success", compact, className)} role="status">
      <CheckCircle2 size={compact ? 17 : 22} aria-hidden="true" />
      <strong>{title}</strong>
      {description && <span>{description}</span>}
    </div>
  );
}
