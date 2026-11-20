import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from '../ui/index.ts';
import { cn } from '../../utils/cn.ts';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: React.ReactNode;
  description: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

/**
 * EmptyState Pattern (Section 27 of UI-UX-DESIGN-SYSTEM.md)
 * Explains what is empty, whether it is normal, and the next action.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-card border border-dashed border-border bg-surface-subtle/40',
        compact ? 'px-4 py-6' : 'px-6 py-10',
        className
      )}
    >
      {icon && (
        <div className="w-10 h-10 rounded-pill bg-primary-soft text-primary flex items-center justify-center mb-3">
          <Icon icon={icon} size="md" />
        </div>
      )}
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="type-caption text-secondary-foreground max-w-md mt-1 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
