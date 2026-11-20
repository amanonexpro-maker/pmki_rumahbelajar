"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Icon, Input } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface SearchInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange"
  > {
  value: string;
  onValueChange: (value: string) => void;
  clearLabel?: string;
  containerClassName?: string;
}

export function SearchInput({
  value,
  onValueChange,
  placeholder = "Cari peserta didik...",
  clearLabel = "Hapus kata pencarian",
  containerClassName,
  className,
  ...props
}: SearchInputProps) {
  return (
    <Input
      type="search"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      placeholder={placeholder}
      leftIcon={<Icon icon={Search} size="sm" />}
      rightElement={
        value.length > 0 ? (
          <button
            type="button"
            onClick={() => onValueChange("")}
            aria-label={clearLabel}
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors focus-ring cursor-pointer"
          >
            <Icon icon={X} size="xs" />
          </button>
        ) : undefined
      }
      containerClassName={cn("w-full", containerClassName)}
      className={className}
      {...props}
    />
  );
}

