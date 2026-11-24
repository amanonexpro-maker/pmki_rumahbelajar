import * as React from "react";
import Link from "next/link";
import { Icon, Skeleton } from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import { cn } from "@/lib/cn";

export interface SummaryStripItem {
  id: string;
  label: string;
  value: React.ReactNode;
  context?: React.ReactNode;
  href?: string;
  badge?: React.ReactNode;
}

export interface SummaryStripProps {
  items: SummaryStripItem[];
  ariaLabel?: string;
  bordered?: boolean;
  className?: string;
}

export const summaryStripGridClass =
  "flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-y-6 sm:gap-x-6 sm:divide-x sm:divide-border sm:pb-0";

/**
 * SummaryStrip (Fase 19 Step 2 - P3, W2, UI-UX §30).
 * Primitif strip ringkasan operasional dengan scroll-snap horizontal pada mobile (< 768px)
 * dan grid berkolom dengan pembatas garis pada tablet/desktop (>= 640px).
 * Server-safe (komponen server murni).
 */
export function SummaryStrip({
  items,
  ariaLabel = "Ringkasan operasional",
  bordered = true,
  className,
}: SummaryStripProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        bordered && "border-y border-border py-4 sm:py-5",
        className
      )}
    >
      <div className={summaryStripGridClass}>
        {items.map((item, idx) => {
          const inner = (
            <div
              className={cn(
                "p-4 rounded-card border border-border-subtle bg-surface sm:border-0 sm:bg-transparent sm:p-0",
                idx > 0 && "sm:pl-6"
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="type-h1 text-foreground tabular-nums tracking-tight">
                  {item.value}
                </span>
                <div className="flex items-center gap-1.5">
                  {item.badge}
                  {item.href && (
                    <Icon
                      icon={ICON_MAP.arrowUpRight}
                      size="sm"
                      aria-hidden="true"
                      className="opacity-70 text-primary group-hover:opacity-100 transition-opacity"
                    />
                  )}
                </div>
              </div>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {item.label}
              </p>
              {item.context && (
                <p className="mt-0.5 type-caption text-secondary-foreground">
                  {item.context}
                </p>
              )}
            </div>
          );

          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className="snap-start shrink-0 min-w-[78%] sm:min-w-0 group block text-left rounded-control transition-colors hover:bg-surface-subtle/70 focus-ring"
              >
                {inner}
              </Link>
            );
          }

          return (
            <div
              key={item.id}
              className="snap-start shrink-0 min-w-[78%] sm:min-w-0"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export interface SummaryStripSkeletonProps {
  count?: number;
  ariaLabel?: string;
  bordered?: boolean;
  className?: string;
}

/**
 * SummaryStripSkeleton (Fase 19 Step 2 - P4, R-MAJ-2).
 * Skeleton loader dekoratif untuk strip ringkasan operasional.
 * Menggunakan summaryStripGridClass yang sama persis agar kelas strip satu sumber kebenaran.
 * Server-safe (komponen server murni).
 */
export function SummaryStripSkeleton({
  count = 4,
  bordered = true,
  className,
}: SummaryStripSkeletonProps) {
  return (
    <section
      aria-hidden="true"
      className={cn(
        bordered && "border-y border-border py-4 sm:py-5",
        className
      )}
    >
      <div className={summaryStripGridClass}>
        {Array.from({ length: count }).map((_, idx) => (
          <Skeleton
            key={idx}
            className="min-w-[78%] sm:min-w-0 h-20 sm:h-16 rounded-card sm:rounded-none"
          />
        ))}
      </div>
    </section>
  );
}
