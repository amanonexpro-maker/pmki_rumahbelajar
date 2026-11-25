"use client";

import { cn } from "@/lib/cn";

export interface FilterSelectOption {
  value: string;
  label: string;
}

export interface GenericFilterSelectProps {
  label: string;
  options: readonly FilterSelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function GenericFilterSelect({
  label,
  options,
  value,
  onChange,
  className,
}: GenericFilterSelectProps) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-10 rounded-control border border-border bg-surface px-3 text-xs font-medium text-foreground focus-ring",
        className
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

