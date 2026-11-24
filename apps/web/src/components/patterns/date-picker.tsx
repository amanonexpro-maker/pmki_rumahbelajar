"use client";

import * as React from "react";
import { Button, Icon, Input } from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import { cn } from "@/lib/cn";
import { formatToIndonesianStandard } from "@/utils/date-formatter";

export interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  name?: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
  containerClassName?: string;
  placeholder?: string;
}

/**
 * DatePicker (Fase 19 Step 2 - P4, UI-UX §15, 03 §7).
 * Primitif input tanggal mobile-friendly dengan dua presentasi satu nilai:
 * - < 768px (mobile): Tampilan tanggal standar Indonesia + lapisan sentuh native transparan.
 * - >= 768px (desktop): Input tanggal native standar browser.
 */
export function DatePicker({
  id: providedId,
  value,
  onChange,
  name,
  label,
  hint,
  error,
  required,
  disabled,
  min,
  max,
  className,
  containerClassName,
  placeholder = "Pilih tanggal",
}: DatePickerProps) {
  const generatedId = React.useId();
  const baseId = providedId || generatedId;
  const mobileDisplayId = `${baseId}-mobile-display`;
  const mobileNativeId = `${baseId}-mobile-native`;
  const desktopNativeId = `${baseId}-desktop-native`;
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;

  const describedById = error ? errorId : hint ? hintId : undefined;
  const displayValue = value ? formatToIndonesianStandard(value) : "";

  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && (
        <>
          <label
            htmlFor={mobileDisplayId}
            className="type-label block text-foreground mb-1 md:hidden"
          >
            {label}
            {required && (
              <span aria-hidden="true" className="text-danger ml-0.5">
                *
              </span>
            )}
          </label>
          <label
            htmlFor={desktopNativeId}
            className="type-label block text-foreground mb-1 hidden md:block"
          >
            {label}
            {required && (
              <span aria-hidden="true" className="text-danger ml-0.5">
                *
              </span>
            )}
          </label>
        </>
      )}

      {/* Mobile Presentation (< 768px): Read-only styled display with transparent native picker overlay */}
      <div className="relative md:hidden">
        <div className="flex items-center">
          <Input
            id={mobileDisplayId}
            type="text"
            readOnly
            value={displayValue}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={describedById}
            className={cn("min-h-11 pr-12 cursor-pointer", className)}
          />
          <div
            aria-hidden="true"
            className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"
          >
            <Button
              type="button"
              size="icon"
              variant="secondary"
              disabled={disabled}
              tabIndex={-1}
              aria-hidden="true"
              className="min-h-11 sm:min-h-10 border-0 bg-transparent shadow-none"
            >
              <Icon
                icon={ICON_MAP.calendar}
                size="sm"
                aria-hidden="true"
                className="text-muted-foreground"
              />
            </Button>
          </div>
        </div>

        {/* Native Touch Layer Overlay for Mobile */}
        <input
          id={mobileNativeId}
          name={name}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedById}
          tabIndex={-1}
          className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
        />
      </div>

      {/* Desktop Presentation (>= 768px): Standard Native Date Input */}
      <div className="hidden md:block">
        <Input
          id={desktopNativeId}
          name={name}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedById}
          className={cn("min-h-11 sm:min-h-10", className)}
        />
      </div>

      {hint && !error && (
        <p id={hintId} className="type-caption text-secondary-foreground">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="type-caption text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
