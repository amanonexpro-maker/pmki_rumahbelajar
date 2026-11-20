import React, { useId } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '../../utils/cn.ts';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
  indeterminate?: boolean;
  containerClassName?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      id: providedId,
      label,
      description,
      error,
      indeterminate = false,
      disabled,
      className,
      containerClassName,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const descId = `${id}-desc`;
    const errorId = `${id}-error`;

    return (
      <div className={cn('space-y-1', containerClassName)}>
        <label
          htmlFor={id}
          className={cn(
            'group inline-flex items-start gap-3 select-none',
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          )}
        >
          <span className="relative flex items-center justify-center mt-0.5 shrink-0">
            <input
              ref={(node) => {
                if (node) {
                  node.indeterminate = indeterminate;
                }
                if (typeof ref === 'function') {
                  ref(node);
                } else if (ref) {
                  ref.current = node;
                }
              }}
              id={id}
              type="checkbox"
              disabled={disabled}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={
                [description ? descId : undefined, error ? errorId : undefined]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              className={cn(
                'peer h-5 w-5 appearance-none rounded-xs border bg-surface transition-colors focus-ring',
                'checked:bg-primary checked:border-primary indeterminate:bg-primary indeterminate:border-primary',
                error
                  ? 'border-danger'
                  : 'border-border-strong group-hover:border-primary',
                className
              )}
              {...props}
            />
            {indeterminate ? (
              <Minus
                aria-hidden="true"
                strokeWidth={3}
                className="pointer-events-none absolute w-3.5 h-3.5 text-primary-foreground opacity-0 peer-indeterminate:opacity-100 transition-opacity"
              />
            ) : (
              <Check
                aria-hidden="true"
                strokeWidth={3}
                className="pointer-events-none absolute w-3.5 h-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity"
              />
            )}
          </span>

          {(label || description) && (
            <span className="space-y-0.5 text-sm">
              {label && (
                <span className="block font-medium text-foreground leading-snug">
                  {label}
                </span>
              )}
              {description && (
                <span
                  id={descId}
                  className="block type-caption text-secondary-foreground leading-relaxed"
                >
                  {description}
                </span>
              )}
            </span>
          )}
        </label>

        {error && (
          <p id={errorId} role="alert" className="type-caption text-danger font-medium pl-8">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

