import React from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import { cn } from '../../utils/cn.ts';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IconProps extends Omit<LucideProps, 'size'> {
  icon: LucideIcon;
  size?: IconSize;
  label?: string;
}

const sizeClasses: Record<IconSize, string> = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-4.5 h-4.5',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

export const Icon: React.FC<IconProps> = ({
  icon: LucideComponent,
  size = 'sm',
  strokeWidth = 1.85,
  label,
  className,
  ...props
}) => {
  return (
    <LucideComponent
      strokeWidth={strokeWidth}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      className={cn('shrink-0', sizeClasses[size], className)}
      {...props}
    />
  );
};

