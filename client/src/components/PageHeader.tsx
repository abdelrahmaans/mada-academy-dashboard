import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  copyClassName?: string;
  actionsClassName?: string;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  copyClassName,
  actionsClassName,
}: PageHeaderProps) {
  return (
    <section className={["role-page-header", className].filter(Boolean).join(" ")}>
      <div
        className={["role-page-header-copy", copyClassName]
          .filter(Boolean)
          .join(" ")}
      >
        {eyebrow && <div className="role-page-header-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && (
        <div
          className={["role-page-header-actions", actionsClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {actions}
        </div>
      )}
    </section>
  );
}
