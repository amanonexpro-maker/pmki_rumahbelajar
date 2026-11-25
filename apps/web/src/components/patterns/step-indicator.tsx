import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

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

export function StepIndicator({
  steps,
  currentStep,
  onStepClick,
  className,
}: StepIndicatorProps) {
  return (
    <nav aria-label="Tahapan formulir" className={cn("w-full", className)}>
      <ol className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const canClick = Boolean(onStepClick) && isCompleted;

          const pill = (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 sm:gap-2 rounded-pill border px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                isCurrent &&
                  "border-primary bg-primary-soft text-primary font-semibold",
                isCompleted &&
                  "border-success/30 bg-success-soft/60 text-success-foreground",
                !isCurrent &&
                  !isCompleted &&
                  "border-border bg-surface text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-pill text-[11px] font-bold",
                  isCurrent && "bg-primary text-primary-foreground",
                  isCompleted && "bg-success text-white",
                  !isCurrent &&
                    !isCompleted &&
                    "bg-surface-subtle text-secondary-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3" aria-hidden="true" />
                ) : (
                  step.number
                )}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
              <span className={cn("sm:hidden", !isCurrent && "sr-only")}>
                {step.shortLabel ?? step.label}
              </span>
            </span>
          );

          return (
            <li
              key={step.number}
              className="flex items-center gap-2 shrink-0"
              aria-current={isCurrent ? "step" : undefined}
            >
              {canClick ? (
                <button
                  type="button"
                  onClick={() => onStepClick?.(step.number)}
                  className="cursor-pointer focus-ring rounded-pill"
                >
                  {pill}
                </button>
              ) : (
                pill
              )}
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="h-px w-4 bg-border shrink-0"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

