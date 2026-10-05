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
    <section className={["role-page-header", "welcome-row", className].filter(Boolean).join(" ")}>
      <div
        className={["role-page-header-copy", "welcome-copy", copyClassName]
          .filter(Boolean)
          .join(" ")}
      >
        {eyebrow && <div className="role-page-header-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && (
        <div
          className={["role-page-header-actions", "welcome-actions", actionsClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {actions}
        </div>
      )}
    </section>
  );
}
