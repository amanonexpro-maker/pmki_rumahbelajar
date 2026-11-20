"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, id: providedId, label, description, ...props }, ref) => {
  const generatedId = React.useId();
  const id = providedId || generatedId;

  const box = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={id}
      className={cn(
        "peer h-5 w-5 shrink-0 rounded-xs border border-border-strong bg-surface transition-[color,background-color,border-color,transform] duration-120 active:scale-[0.92] focus-ring cursor-pointer",
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
        "disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label && !description) return box;

  return (
    <div className="flex items-start gap-3 min-h-11 py-1.5">
      <div className="pt-0.5">{box}</div>
      <div className="space-y-0.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-foreground leading-snug cursor-pointer"
          >
            {label}
          </label>
        )}
        {description && (
          <p className="type-caption text-secondary-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
});

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

