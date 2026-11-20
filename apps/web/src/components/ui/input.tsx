import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id: providedId,
      label,
      hint,
      error,
      leftIcon,
      rightElement,
      required,
      disabled,
      className,
      containerClassName,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const id = providedId || generatedId;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;

    const describedBy =
      [hint && !error ? hintId : undefined, error ? errorId : undefined]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <label htmlFor={id} className="type-label block text-foreground mb-1">
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

          <input
            ref={ref}
            id={id}
            required={required}
            disabled={disabled}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
            className={cn(
              "w-full min-h-11 sm:min-h-10 rounded-control bg-surface px-3.5 py-2 text-sm text-foreground border transition-colors",
              "placeholder:text-muted-foreground focus-ring",
              "disabled:bg-surface-subtle disabled:text-muted-foreground disabled:cursor-not-allowed",
              leftIcon && "pl-10",
              rightElement && "pr-10",
              error
                ? "border-danger focus-visible:border-danger focus-visible:ring-1 focus-visible:ring-danger/20"
                : "border-border hover:border-border-strong focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20",
              className
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3 flex items-center text-muted-foreground">
              {rightElement}
            </div>
          )}
        </div>

        {hint && !error && (
          <p id={hintId} className="type-caption text-muted-foreground mt-1">
            {hint}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="type-caption text-danger flex items-center gap-1.5 font-medium min-h-[1.25rem] mt-1"
          >
            <AlertCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

