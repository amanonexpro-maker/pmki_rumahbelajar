import * as React from "react";
import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";

export type ListSkeletonVariant =
  | "media"
  | "report"
  | "publication"
  | "attendance";

export interface ListSkeletonProps {
  variant?: ListSkeletonVariant;
  count?: number;
  className?: string;
}

/**
 * Reusable Structured List Skeleton (UI-UX §24, 08: Skeleton sesuai struktur).
 * Mirrors the exact responsive geometry of MediaCard, GovernanceReportCard,
 * PublishingItemCard, and AttendanceListItem without global spinners.
 */
export function ListSkeleton({
  variant = "report",
  count = 4,
  className,
}: ListSkeletonProps) {
  const items = Array.from({ length: count });

  if (variant === "media") {
    return (
      <div
        aria-hidden="true"
        className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}
      >
        {items.map((_, i) => (
          <div
            key={i}
            className="rounded-card border border-border bg-surface p-5 sm:p-4 space-y-3 sm:space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-5 w-20 rounded-pill" />
                <Skeleton className="h-5 w-32 rounded-pill" />
              </div>
              <Skeleton className="w-full aspect-[4/5] sm:aspect-[16/10] rounded-control" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-11 sm:h-8 w-28 rounded-control" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "attendance") {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "rounded-card border border-border bg-surface divide-y divide-border-subtle overflow-hidden",
          className
        )}
      >
        {items.map((_, i) => (
          <div key={i} className="p-5 sm:p-4 space-y-3">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 sm:h-3.5 w-32" />
            </div>
            <div className="grid grid-cols-4 sm:flex gap-1.5 sm:gap-2">
              <Skeleton className="h-11 sm:h-9 sm:w-20 rounded-control" />
              <Skeleton className="h-11 sm:h-9 sm:w-20 rounded-control" />
              <Skeleton className="h-11 sm:h-9 sm:w-20 rounded-control" />
              <Skeleton className="h-11 sm:h-9 sm:w-20 rounded-control" />
            </div>
            <Skeleton className="h-11 sm:h-10 w-full rounded-control" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "publication") {
    return (
      <div aria-hidden="true" className={cn("space-y-4", className)}>
        {items.map((_, i) => (
          <div
            key={i}
            className="rounded-card border border-border bg-surface p-5 sm:p-4 space-y-3 sm:space-y-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2 flex-1 min-w-[200px] max-w-xl">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-pill" />
                  <Skeleton className="h-5 w-24 rounded-pill" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-11 sm:h-8 w-36 rounded-control" />
            </div>
            <Skeleton className="h-2 w-full rounded-pill" />
          </div>
        ))}
      </div>
    );
  }

  // Default: "report" (GovernanceReportCard)
  return (
    <div aria-hidden="true" className={cn("space-y-4", className)}>
      {items.map((_, i) => (
        <div
          key={i}
          className="rounded-card border border-border bg-surface p-5 sm:p-4 lg:p-5 space-y-3 sm:space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-2 flex-1 max-w-xl">
              <Skeleton className="h-5 w-2/3" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-24 rounded-pill" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-3.5 w-32" />
            </div>
            <Skeleton className="h-11 sm:h-8 w-36 rounded-control" />
          </div>
          <Skeleton className="h-2 w-full rounded-pill" />
          <Skeleton className="h-16 w-full rounded-control" />
        </div>
      ))}
    </div>
  );
}

