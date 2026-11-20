"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/cn";

export const RadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("grid gap-2.5", className)}
    {...props}
  />
));
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export const RadioGroupItem = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, id: providedId, label, description, ...props }, ref) => {
  const generatedId = React.useId();
  const id = providedId || generatedId;

  const radio = (
    <RadioGroupPrimitive.Item
      ref={ref}
      id={id}
      className={cn(
        "h-5 w-5 shrink-0 rounded-pill border border-border-strong bg-surface text-primary transition-colors focus-ring cursor-pointer",
        "data-[state=checked]:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-55",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="h-2.5 w-2.5 rounded-pill bg-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );

  if (!label && !description) return radio;

  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 min-h-11 rounded-control border border-border bg-surface px-3.5 py-2.5 cursor-pointer hover:bg-surface-subtle/60 transition-colors"
    >
      <span className="pt-0.5">{radio}</span>
      <span className="space-y-0.5">
        {label && (
          <span className="block text-sm font-medium text-foreground">
            {label}
          </span>
        )}
        {description && (
          <span className="block type-caption text-secondary-foreground">
            {description}
          </span>
        )}
      </span>
    </label>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

