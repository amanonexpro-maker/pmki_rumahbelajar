import * as React from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface ReviewItem {
  label: string;
  value: React.ReactNode;
}

export interface ReviewSectionProps {
  title: string;
  items: ReviewItem[];
  onEdit?: () => void;
  editLabel?: string;
  className?: string;
}

export function ReviewSection({
  title,
  items,
  onEdit,
  editLabel = "Ubah bagian ini",
  className,
}: ReviewSectionProps) {
  return (
    <section
      className={cn(
        "rounded-control border border-border bg-surface-subtle/50 p-4 sm:p-5 space-y-3",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border-subtle">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            {editLabel}
          </Button>
        )}
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
        {items.map((item) => (
          <div key={item.label} className="space-y-0.5">
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="font-medium text-foreground">{item.value || "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

