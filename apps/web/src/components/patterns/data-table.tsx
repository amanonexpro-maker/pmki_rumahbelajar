import * as React from "react";
import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface DataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  /**
   * Required mobile recomposition renderer (UI-UX §31 & 07 §19).
   * At < 768px (including 375px), DataTable renders as stacked vertical items
   * rather than squeezing a desktop table into horizontal scrolling.
   */
  renderMobileRow: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  loadingRows?: number;
  emptyState?: React.ReactNode;
  caption?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  renderMobileRow,
  onRowClick,
  loading = false,
  loadingRows = 4,
  emptyState,
  caption,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div
        className={cn(
          "rounded-card bg-surface border border-border p-5 space-y-4",
          className
        )}
      >
        {Array.from({ length: loadingRows }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-4 py-2 border-b border-border-subtle last:border-none"
          >
            <div className="space-y-2 flex-1">
              <Skeleton variant="text" className="w-1/3 h-4" />
              <Skeleton variant="text" className="w-1/2 h-3" />
            </div>
            <Skeleton variant="text" className="w-20 h-6 rounded-pill" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div
      className={cn(
        "rounded-card bg-surface border border-border overflow-hidden",
        className
      )}
    >
      {/* Mobile Recomposition List (< 768px) */}
      <ul role="list" className="md:hidden divide-y divide-border">
        {data.map((row) => {
          const key = getRowKey(row);
          return (
            <li
              key={key}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "p-4 transition-colors",
                onRowClick && "cursor-pointer hover:bg-surface-subtle/60"
              )}
            >
              {renderMobileRow(row)}
            </li>
          );
        })}
      </ul>

      {/* Desktop & Tablet Structured Comparison Table (>= 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-border bg-surface-subtle/50">
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={cn(
                    "px-4 py-3 sm:px-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground select-none",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right",
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {data.map((row) => {
              const key = getRowKey(row);
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "transition-colors duration-150",
                    onRowClick && "cursor-pointer hover:bg-surface-subtle/60"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        "px-4 py-3.5 sm:px-5 sm:py-4 text-sm text-foreground align-middle",
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right",
                        col.className
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

