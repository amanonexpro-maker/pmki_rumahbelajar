import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn.ts';
import { Icon } from '../ui/index.ts';

export interface StepItem {
  number: number;
  label: string;
  shortLabel?: string;
}

export interface StepIndicatorProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
  className?: string;
}

/**
 * StepIndicator Pattern (UI-6 Section 6)
 * Restrained multi-step indicator for desktop and mobile.
 * Completed, current, and upcoming states use check icons, step numbers, font weight,
 * and semantic ARIA attributes rather than relying solely on color.
 */
export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  onStepClick,
  className,
}) => {
  const activeStepObj =
    steps.find((s) => s.number === currentStep) || steps[0];
  const totalSteps = steps.length;

  return (
    <nav
      aria-label="Tahapan pengisian formulir"
      className={cn('w-full', className)}
    >
      {/* Mobile Compact Indicator */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="type-caption font-semibold text-primary">
            Langkah {currentStep} dari {totalSteps}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {activeStepObj.label}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`Langkah ${currentStep} dari ${totalSteps}: ${activeStepObj.label}`}
          className="h-1.5 w-full rounded-pill bg-surface-subtle overflow-hidden"
        >
          <div
            className="h-full bg-primary transition-all duration-200 rounded-pill"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop Horizontal Stepper */}
      <ol className="hidden sm:flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isClickable = Boolean(onStepClick && isCompleted);

          return (
            <React.Fragment key={step.number}>
              <li className="flex items-center">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick?.(step.number)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={cn(
                    'group flex items-center gap-2.5 py-1 rounded-control text-left transition-colors focus-ring',
                    isClickable ? 'cursor-pointer' : 'cursor-default'
                  )}
                >
                  <span
                    className={cn(
                      'w-6 h-6 rounded-pill flex items-center justify-center text-xs font-semibold transition-colors shrink-0 border',
                      isCurrent &&
                        'bg-primary text-primary-foreground border-primary ring-3 ring-primary-soft',
                      isCompleted &&
                        'bg-primary-soft text-primary border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground',
                      !isCurrent &&
                        !isCompleted &&
                        'bg-surface-subtle text-muted-foreground border-border'
                    )}
                  >
                    {isCompleted ? (
                      <Icon icon={Check} size="xs" strokeWidth={2.5} />
                    ) : (
                      step.number
                    )}
                  </span>

                  <span
                    className={cn(
                      'text-xs transition-colors',
                      isCurrent
                        ? 'font-bold text-foreground'
                        : isCompleted
                        ? 'font-medium text-secondary-foreground group-hover:text-foreground'
                        : 'font-normal text-muted-foreground'
                    )}
                  >
                    {step.shortLabel || step.label}
                    <span className="sr-only">
                      {isCompleted
                        ? ' (Selesai)'
                        : isCurrent
                        ? ' (Langkah saat ini)'
                        : ' (Belum diisi)'}
                    </span>
                  </span>
                </button>
              </li>

              {index < steps.length - 1 && (
                <li
                  aria-hidden="true"
                  className="flex-1 mx-3 h-px bg-border"
                >
                  <div
                    className={cn(
                      'h-full transition-all duration-200',
                      isCompleted ? 'bg-primary w-full' : 'w-0'
                    )}
                  />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

