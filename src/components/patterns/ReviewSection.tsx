import React from 'react';
import { cn } from '../../utils/cn.ts';
import { Button } from '../ui/index.ts';

export interface ReviewItem {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

export interface ReviewSectionProps {
  title: string;
  items: ReviewItem[];
  onEdit?: () => void;
  editLabel?: string;
  className?: string;
}

/**
 * ReviewSection Pattern (UI-6 Section 19 & 26)
 * Displays a calm, structured review group (e.g., Peserta, Wali, Pendidikan, Persetujuan)
 * with a direct action to return to that step for correction without losing entered data.
 */
export const ReviewSection: React.FC<ReviewSectionProps> = ({
  title,
  items,
  onEdit,
  editLabel = 'Ubah',
  className,
}) => {
  return (
    <section
      className={cn(
        'py-4 border-b border-border last:border-b-0 space-y-3',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {onEdit && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onEdit}
            aria-label={`${editLabel} bagian ${title}`}
          >
            {editLabel}
          </Button>
        )}
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={cn(item.fullWidth && 'sm:col-span-2')}
          >
            <dt className="type-caption text-secondary-foreground">
              {item.label}
            </dt>
            <dd className="font-medium text-foreground mt-0.5 break-words">
              {item.value || (
                <span className="text-muted-foreground italic">
                  Tidak diisi
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

