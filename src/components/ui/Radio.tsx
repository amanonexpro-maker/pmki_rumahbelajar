import React, { useId } from 'react';
import { cn } from '../../utils/cn.ts';

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  containerClassName?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      id: providedId,
      label,
      description,
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

    return (
      <label
        htmlFor={id}
        className={cn(
          'group inline-flex items-start gap-3 select-none',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          containerClassName
        )}
      >
        <span className="relative flex items-center justify-center mt-0.5 shrink-0">
          <input
            ref={ref}
            id={id}
            type="radio"
            disabled={disabled}
            aria-describedby={description ? descId : undefined}
            className={cn(
              'peer h-5 w-5 appearance-none rounded-pill border border-border-strong bg-surface transition-colors focus-ring',
              'checked:border-primary group-hover:border-primary',
              className
            )}
            {...props}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-2.5 w-2.5 rounded-pill bg-primary scale-0 peer-checked:scale-100 transition-transform"
          />
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
    );
  }
);

Radio.displayName = 'Radio';

export interface RadioGroupOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: RadioGroupOption[];
  error?: string;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  value,
  onChange,
  options,
  error,
  orientation = 'vertical',
  className,
}) => {
  const errorId = useId();

  return (
    <fieldset
      aria-describedby={error ? errorId : undefined}
      className={cn('space-y-2', className)}
    >
      {label && (
        <legend className="type-label text-foreground mb-1.5">{label}</legend>
      )}
      <div
        className={cn(
          'flex gap-3',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap gap-5'
        )}
      >
        {options.map((opt) => (
          <Radio
            key={opt.value}
            name={name}
            value={opt.value}
            checked={value === opt.value}
            disabled={opt.disabled}
            onChange={() => onChange?.(opt.value)}
            label={opt.label}
            description={opt.description}
          />
        ))}
      </div>
      {error && (
        <p id={errorId} role="alert" className="type-caption text-danger font-medium">
          {error}
        </p>
      )}
    </fieldset>
  );
};

