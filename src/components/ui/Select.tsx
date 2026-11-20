import React, { useId } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn.ts';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
  leftIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id: providedId,
      label,
      hint,
      error,
      options,
      placeholder,
      leftIcon,
      required,
      disabled,
      className,
      containerClassName,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;

    const describedBy = [
      hint && !error ? hintId : undefined,
      error ? errorId : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <label htmlFor={id} className="type-label block text-foreground">
            {label}
            {required && (
              <span aria-hidden="true" className="text-danger ml-0.5">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 text-muted-foreground flex items-center"
            >
              {leftIcon}
            </span>
          )}

          <select
            ref={ref}
            id={id}
            required={required}
            disabled={disabled}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
            className={cn(
              'w-full h-10 appearance-none rounded-control bg-surface pl-3.5 pr-9 py-2 text-sm text-foreground border transition-colors',
              'focus-ring cursor-pointer',
              'disabled:bg-surface-subtle disabled:text-muted-foreground disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              error
                ? 'border-danger focus-visible:outline-danger'
                : 'border-border hover:border-border-strong focus-visible:border-primary',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 w-4 h-4 text-muted-foreground"
          />
        </div>

        {hint && !error && (
          <p id={hintId} className="type-caption text-muted-foreground">
            {hint}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="type-caption text-danger flex items-center gap-1.5 font-medium"
          >
            <AlertCircle aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

