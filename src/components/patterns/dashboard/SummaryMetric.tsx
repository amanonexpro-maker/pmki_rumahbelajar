import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Icon } from '../../ui/index.ts';
import type { DashboardSummaryItem } from './dashboardData.ts';

export interface SummaryMetricProps {
  items: DashboardSummaryItem[];
  onNavigate: (destination: string) => void;
}

/**
 * SummaryMetric (Sections 5, 11, 12, 15 of UI-UX-DESIGN-SYSTEM.md)
 * Lightweight inline operational summaries using typography and subtle dividers
 * rather than wrapping each number in an isolated card.
 */
export const SummaryMetric: React.FC<SummaryMetricProps> = ({
  items,
  onNavigate,
}) => {
  return (
    <section
      aria-label="Ringkasan operasional"
      className="border-y border-border py-5"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-6 sm:divide-x sm:divide-border">
        {items.map((item, idx) => {
          const inner = (
            <div className={idx > 0 ? 'sm:pl-6' : ''}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="type-h1 text-foreground tabular-nums tracking-tight">
                  {item.value}
                </span>
                {item.destination && (
                  <Icon
                    icon={ArrowUpRight}
                    size="xs"
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                )}
              </div>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {item.label}
              </p>
              <p className="mt-0.5 type-caption text-secondary-foreground">
                {item.context}
              </p>
            </div>
          );

          if (item.destination) {
            const dest = item.destination;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(dest)}
                className="group text-left rounded-control -m-2 p-2 transition-colors hover:bg-surface-subtle/70 cursor-pointer focus-ring"
              >
                {inner}
              </button>
            );
          }

          return <div key={item.id}>{inner}</div>;
        })}
      </div>
    </section>
  );
};

