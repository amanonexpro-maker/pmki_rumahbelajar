import React from 'react';
import { cn } from '../../utils/cn.ts';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  lines?: number;
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded-xs',
  circular: 'h-10 w-10 rounded-pill',
  rectangular: 'h-24 w-full rounded-control',
  card: 'h-36 w-full rounded-card border border-border-subtle',
};

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  lines = 1,
  className,
  ...props
}) => {
  if (variant === 'text' && lines > 1) {
    return (
      <div
        role="status"
        aria-label="Memuat konten..."
        className={cn('space-y-2', className)}
        {...props}
      >
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className={cn(
              'animate-pulse bg-surface-subtle rounded-xs h-4',
              idx === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
            )}
          />
        ))}
        <span className="sr-only">Memuat...</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Memuat konten..."
      className={cn(
        'animate-pulse bg-surface-subtle',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <span className="sr-only">Memuat...</span>
    </div>
  );
};

