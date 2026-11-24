import * as React from "react";
import { cn } from "@/lib/cn";

export interface MobileCardListProps<T = unknown> {
  item?: T;
  title?: React.ReactNode;
  badge?: React.ReactNode;
  primaryMeta?: React.ReactNode;
  secondaryMeta?: React.ReactNode;
  action?: React.ReactNode;
  renderItem?: (item: T) => React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

/**
 * MobileCardList (Fase 19 Step 2 - P3, W3, §1.C).
 * Primitif presentational untuk kartu-baris mobile pada DataTable.renderMobileRow (< 768px).
 * Merender root div (tanpa elemen list semantik karena disediakan oleh DataTable).
 */
export function MobileCardList<T = unknown>({
  item,
  title,
  badge,
  primaryMeta,
  secondaryMeta,
  action,
  renderItem,
  className,
  children,
}: MobileCardListProps<T>) {
  if (renderItem && item !== undefined) {
    return (
      <div className={cn("space-y-2", className)}>
        {renderItem(item)}
      </div>
    );
  }

  if (children) {
    return (
      <div className={cn("space-y-2", className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Baris 1: Identitas utama + status badge */}
      {(title || badge) && (
        <div className="flex items-start justify-between gap-2">
          {typeof title === "string" ? (
            <p className="text-base font-semibold text-foreground leading-snug">
              {title}
            </p>
          ) : (
            title
          )}
          {badge}
        </div>
      )}

      {/* Baris 2: Metadata utama */}
      {primaryMeta && (
        <div className="text-xs text-secondary-foreground leading-normal">
          {primaryMeta}
        </div>
      )}

      {/* Baris 3: Metadata sekunder (opsional) */}
      {secondaryMeta && (
        <div className="text-xs text-muted-foreground leading-normal">
          {secondaryMeta}
        </div>
      )}

      {/* Baris 4: Maksimal satu aksi primer */}
      {action && (
        <div
          className="pt-1 flex items-center justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          {action}
        </div>
      )}
    </div>
  );
}

