import * as React from "react";
import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  badge?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  backButton?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  badge,
  primaryAction,
  secondaryActions,
  backButton,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-3",
        className
      )}
    >
      <div className="space-y-1.5 min-w-0">
        {backButton && <div className="mb-3">{backButton}</div>}

        {eyebrow && (
          <div className="text-xs uppercase tracking-wider font-bold text-primary mb-2 select-none">
            {eyebrow}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-semibold leading-tight tracking-tight text-foreground">
            {title}
          </h1>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        {description && (
          <p className="text-sm text-secondary-foreground max-w-2xl leading-relaxed mt-1.5">
            {description}
          </p>
        )}
      </div>

      {(secondaryActions || primaryAction) && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 sm:pt-1">
          {secondaryActions}
          {primaryAction}
        </div>
      )}
    </header>
  );
}

