import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn.ts';

export interface ChangeItem {
  label: string;
  previousValue?: React.ReactNode;
  newValue: React.ReactNode;
}

export interface ChangeSummaryProps {
  items: ChangeItem[];
  title?: string;
  className?: string;
}

/**
 * ChangeSummary Pattern (UI-9 Sections 17 & 24)
 * Presents consequential state changes (previous vs new value)
 * in a human-readable, respectful format without exposing raw data dumps.
 */
export const ChangeSummary: React.FC<ChangeSummaryProps> = ({
  items,
  title,
  className,
}) => {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        'rounded-md border border-border bg-surface-subtle/50 p-3.5 space-y-2 text-xs',
        className
      )}
      aria-label="Ringkasan perubahan data"
    >
      {title && (
        <h4 className="font-semibold text-foreground tracking-tight">
          {title}
        </h4>
      )}
      <ul className="space-y-2 divide-y divide-border/60">
        {items.map((item, idx) => (
          <li
            key={idx}
            className={cn(
              'flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between',
              idx > 0 && 'pt-2'
            )}
          >
            <span className="font-medium text-secondary-foreground">
              {item.label}:
            </span>
            <div className="flex items-center gap-2 text-foreground font-semibold">
              {item.previousValue !== undefined ? (
                <>
                  <span className="line-through text-muted-foreground font-normal">
                    {item.previousValue}
                  </span>
                  <ArrowRight
                    className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-foreground">{item.newValue}</span>
                </>
              ) : (
                <span>{item.newValue}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

