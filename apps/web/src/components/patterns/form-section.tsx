import * as React from "react";
import { cn } from "@/lib/cn";

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <fieldset className={cn("space-y-4 border-0 p-0 m-0", className)}>
      <div className="space-y-1">
        <legend className="type-title text-foreground">{title}</legend>
        {description && (
          <p className="type-body-sm text-secondary-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

