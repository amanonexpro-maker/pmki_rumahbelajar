"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { useTheme, type ThemePreference } from "./theme-provider";

export interface ThemePickerProps {
  className?: string;
  compact?: boolean;
}

const options: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Terang" },
  { value: "dark", label: "Gelap" },
  { value: "system", label: "Sistem" },
];

function emptySubscribe() {
  return () => {};
}

function useIsMounted(): boolean {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function ThemePicker({ className, compact = false }: ThemePickerProps) {
  const { theme, setTheme } = useTheme();
  const isMounted = useIsMounted();

  // Stabilize initial render to match SSR output and avoid hydration mismatch
  const currentTheme = isMounted ? theme : "light";
  const currentOption =
    options.find((opt) => opt.value === currentTheme) ?? options[0];
  const ThemeIcon =
    currentTheme === "dark" ? Moon : currentTheme === "system" ? Monitor : Sun;

  if (compact) {
    const cycleTheme = () => {
      const idx = options.findIndex((opt) => opt.value === currentTheme);
      const next = options[(idx + 1) % options.length] ?? options[0];
      setTheme(next.value);
    };

    return (
      <button
        type="button"
        onClick={cycleTheme}
        disabled={!isMounted}
        aria-label={`Tema tampilan: ${currentOption.label}. Klik untuk mengganti tema`}
        title={`Tema: ${currentOption.label} (klik untuk ubah)`}
        className={cn(
          "h-10 w-10 rounded-control border border-border bg-surface text-secondary-foreground hover:text-foreground hover:bg-surface-subtle inline-flex items-center justify-center transition-colors focus-ring cursor-pointer disabled:opacity-80",
          className
        )}
      >
        <ThemeIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
      </button>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <ThemeIcon
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-secondary-foreground"
      />
      <span className="sr-only">Tema tampilan</span>
      <Select
        value={currentTheme}
        disabled={!isMounted}
        onValueChange={(value) => {
          if (value === "light" || value === "dark" || value === "system") {
            setTheme(value);
          }
        }}
      >
        <SelectTrigger
          aria-label="Tema tampilan"
          className="min-h-11 sm:min-h-9 w-28 sm:w-26 px-2.5 py-1.5 text-xs font-semibold rounded-sm"
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
    </div>
  );
}

