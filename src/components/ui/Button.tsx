import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.ts';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'soft'
  | 'ghost'
  | 'destructive'
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs border border-transparent',
  secondary:
    'bg-surface text-foreground hover:bg-surface-subtle border border-border shadow-xs',
  soft:
    'bg-primary-soft text-primary hover:bg-primary-soft-hover border border-transparent',
  ghost:
    'bg-transparent text-secondary-foreground hover:bg-surface-subtle hover:text-foreground border border-transparent',
  destructive:
    'bg-danger text-white hover:opacity-92 shadow-xs border border-transparent',
  link:
    'bg-transparent text-primary hover:text-primary-hover underline-offset-4 hover:underline p-0 h-auto border-transparent shadow-none',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-sm',
  md: 'h-10 px-4 text-sm gap-2 rounded-control',
  lg: 'h-11 px-5 text-base gap-2.5 rounded-md',
  icon: 'h-9 w-9 p-0 rounded-control',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      fullWidth = false,
      type = 'button',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          'inline-flex items-center justify-center font-semibold select-none cursor-pointer focus-ring',
          'transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-150 active:scale-[0.985]',
          'disabled:opacity-55 disabled:pointer-events-none disabled:cursor-not-allowed disabled:active:scale-100',
          variantClasses[variant],
          variant !== 'link' && sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0 inline-flex">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && rightIcon && (
          <span className="shrink-0 inline-flex">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

