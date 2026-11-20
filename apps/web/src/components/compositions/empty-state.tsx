import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

/**
 * Calm, explanatory EmptyState (10 §16).
 * Always explains what is empty, whether normal, and the next step.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-dashed border-border bg-surface/70 px-6 py-10 text-center flex flex-col items-center justify-center gap-3",
        className
      )}
    >
      <div className="h-12 w-12 rounded-pill bg-surface-subtle border border-border text-muted-foreground flex items-center justify-center">
        <Icon icon={icon} size="md" />
      </div>

      <div className="space-y-1 max-w-md">
        <h3 className="type-title text-foreground">{title}</h3>
        <p className="type-body-sm text-secondary-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {(action || secondaryAction) && (
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

