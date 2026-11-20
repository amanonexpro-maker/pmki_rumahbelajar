import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn.ts';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      id: providedId,
      label,
      hint,
      error,
      required,
      disabled,
      rows = 3,
      className,
      containerClassName,
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

        <textarea
          ref={ref}
          id={id}
          rows={rows}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full rounded-control bg-surface px-3.5 py-2.5 text-sm text-foreground border transition-colors',
            'placeholder:text-muted-foreground focus-ring',
            'disabled:bg-surface-subtle disabled:text-muted-foreground disabled:cursor-not-allowed',
            error
              ? 'border-danger focus-visible:outline-danger'
              : 'border-border hover:border-border-strong focus-visible:border-primary',
            className
          )}
          {...props}
        />

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

Textarea.displayName = 'Textarea';

