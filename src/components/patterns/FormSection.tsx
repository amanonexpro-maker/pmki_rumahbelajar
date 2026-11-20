import React from 'react';
import { cn } from '../../utils/cn.ts';

export interface FormSectionProps {
  title: string;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  divider?: boolean;
}

/**
 * FormSection Pattern (Section 20 of UI-UX-DESIGN-SYSTEM.md & UI-6 Section 7)
 * Uses open typography and spacing hierarchy rather than nested cards to group related domain fields.
 */
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  badge,
  children,
  className,
  divider = false,
}) => {
  return (
    <section
      className={cn(
        'space-y-4',
        divider && 'pt-6 border-t border-border',
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="type-title text-foreground">{title}</h3>
          {badge}
        </div>
        {description && (
          <p className="type-caption text-secondary-foreground leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>

      <div className="space-y-4">{children}</div>
    </section>
  );
};

