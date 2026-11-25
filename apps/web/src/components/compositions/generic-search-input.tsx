"use client";

import * as React from "react";
import { SearchInput } from "./search-input";

export interface GenericSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function GenericSearchInput({
  value,
  onChange,
  placeholder = "Cari...",
  debounceMs = 300,
  className,
}: GenericSearchInputProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const [prevExternalValue, setPrevExternalValue] = React.useState(value);

  if (value !== prevExternalValue) {
    setPrevExternalValue(value);
    setLocalValue(value);
  }

  React.useEffect(() => {
    if (localValue === value) return;
    const timer = window.setTimeout(() => {
      onChange(localValue);
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [debounceMs, localValue, onChange, value]);

  return (
    <SearchInput
      value={localValue}
      onValueChange={setLocalValue}
      placeholder={placeholder}
      className={className}
    />
  );
}

