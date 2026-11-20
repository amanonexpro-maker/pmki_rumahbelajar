import * as React from "react";
import { cn } from "@/lib/cn";

export interface StatSummaryItem {
  id: string;
  label: string;
  value: React.ReactNode;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
  onClick?: () => void;
}

export interface StatSummaryProps {
  items: StatSummaryItem[];
  className?: string;
}

export function StatSummary({ items, className }: StatSummaryProps) {
  return (
    <section
      aria-label="Ringkasan indikator operasional"
      className={cn(
        "rounded-card bg-surface border border-border grid grid-cols-2 lg:grid-cols-4 overflow-hidden",
        className
      )}
    >
      {items.map((item, index) => {
        const borderClasses = cn(
          index % 2 === 0 ? "border-r border-border" : "",
          index < 2 && items.length > 2
            ? "border-b border-border lg:border-b-0"
            : "",
          index < items.length - 1
            ? "lg:border-r lg:border-border"
            : "lg:border-r-0"
        );

        const content = (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="type-caption font-semibold text-secondary-foreground">
                {item.label}
              </span>
              {item.badge}
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="type-h2 text-foreground tabular-nums">
                {item.value}
              </span>
            </div>
            {item.meta && (
              <p className="mt-1 type-caption text-muted-foreground truncate">
                {item.meta}
              </p>
            )}
          </>
        );

        if (item.onClick) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={cn(
                "p-4 sm:p-5 text-left transition-colors hover:bg-surface-subtle/70 cursor-pointer focus-ring",
                borderClasses
              )}
            >
              {content}
            </button>
          );
        }

        return (
          <div key={item.id} className={cn("p-4 sm:p-5", borderClasses)}>
            {content}
          </div>
        );
      })}
    </section>
  );
}

