import React from 'react';
import { Skeleton } from '../ui/index.ts';
import { cn } from '../../utils/cn.ts';

export interface DataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  /**
   * Optional mobile row renderer (Sections 22, 31 & 40).
   * When provided, mobile viewports (<768px) render comfortable stacked rows
   * instead of forcing horizontal table scrolling.
   */
  renderMobileRow?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  loadingRows?: number;
  emptyState?: React.ReactNode;
  caption?: string;
  className?: string;
}

/**
 * DataTable Pattern (Sections 22, 27, 28, 31 & 45 of UI-UX-DESIGN-SYSTEM.md)
 * Structured comparison/scanning table on desktop with responsive mobile list recomposition.
 */
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
          'rounded-card bg-surface border border-border p-5 space-y-4',
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
        'rounded-card bg-surface border border-border overflow-hidden',
        className
      )}
    >
      {/* Mobile Compact List View (<768px) when renderMobileRow is provided */}
      {renderMobileRow && (
        <ul role="list" className="md:hidden divide-y divide-border">
          {data.map((row) => {
            const key = getRowKey(row);
            return (
              <li key={key} className="p-4 hover:bg-surface-subtle/60 transition-colors">
                {renderMobileRow(row)}
              </li>
            );
          })}
        </ul>
      )}

      {/* Desktop & Tablet Structured Table */}
      <div className={cn('overflow-x-auto', renderMobileRow && 'hidden md:block')}>
        <table className="w-full text-left border-collapse">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-surface-subtle/70 border-b border-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={cn(
                    'py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-secondary-foreground whitespace-nowrap',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {data.map((row) => {
              const key = getRowKey(row);
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'transition-colors hover:bg-surface-subtle/60',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        'py-3.5 px-4 align-middle text-foreground',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
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
