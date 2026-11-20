import React from 'react';
import { cn } from '../../utils/cn.ts';

export interface FormActionsProps {
  secondaryAction?: React.ReactNode;
  primaryAction: React.ReactNode;
  helperText?: React.ReactNode;
  className?: string;
}

/**
 * FormActions Pattern (UI-6 Section 26 & 28)
 * Consistent action bar for form steps and data-entry flows.
 * Ensures clear distinction between back/cancel and dominant forward/submit action.
 */
export const FormActions: React.FC<FormActionsProps> = ({
  secondaryAction,
  primaryAction,
  helperText,
  className,
}) => {
  return (
    <div
      className={cn(
        'pt-6 border-t border-border flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {secondaryAction}
        {helperText && (
          <span className="type-caption text-muted-foreground">
            {helperText}
          </span>
        )}
      </div>

      <div className="flex items-center justify-end gap-2.5">
        {primaryAction}
      </div>
    </div>
  );
};

