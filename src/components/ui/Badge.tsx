import React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '../../utils/cn.ts';

export type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'learning'
  | 'activity'
  | 'confidential';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral:
    'bg-surface-subtle text-secondary-foreground border-border',
  primary:
    'bg-primary-soft text-primary border-primary/20',
  success:
    'bg-success-soft text-success-foreground border-success-border',
  warning:
    'bg-warning-soft text-warning-foreground border-warning-border',
  danger:
    'bg-danger-soft text-danger-foreground border-danger-border',
  info:
    'bg-info-soft text-info-foreground border-info-border',
  learning:
    'bg-learning-soft text-learning-foreground border-learning-border',
  activity:
    'bg-activity-soft text-activity-foreground border-activity-border',
  confidential:
    'bg-warning-soft text-warning-foreground border-warning-border',
};

const dotClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-muted-foreground',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  learning: 'bg-learning',
  activity: 'bg-activity',
  confidential: 'bg-warning',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[11px] gap-1',
  md: 'px-2.5 py-0.5 text-xs gap-1.5',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  icon,
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill border font-semibold leading-snug whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {variant === 'confidential' && !icon && (
        <Lock aria-hidden="true" className="w-3 h-3 shrink-0" />
      )}
      {icon && <span className="shrink-0 inline-flex">{icon}</span>}
      {dot && !icon && variant !== 'confidential' && (
        <span
          aria-hidden="true"
          className={cn('w-1.5 h-1.5 rounded-pill shrink-0', dotClasses[variant])}
        />
      )}
      <span>{children}</span>
    </span>
  );
};

