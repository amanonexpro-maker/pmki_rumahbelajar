"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { cn } from "@/lib/cn";

export interface FilterSelectOption {
  value: string;
  label: string;
}

export interface GenericFilterSelectProps {
  id?: string;
  label: string;
  options: readonly FilterSelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function GenericFilterSelect({
  id,
  label,
  options,
  value,
  onChange,
  className,
}: GenericFilterSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        aria-label={label}
        className={cn(
          "h-10 sm:min-h-10 w-auto px-3 text-xs font-medium",
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

