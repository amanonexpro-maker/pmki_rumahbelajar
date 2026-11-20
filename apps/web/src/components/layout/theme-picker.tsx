"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTheme, type ThemePreference } from "./theme-provider";

export interface ThemePickerProps {
  className?: string;
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

export function ThemePicker({ className }: ThemePickerProps) {
  const { theme, setTheme } = useTheme();
  const isMounted = useIsMounted();

  // Stabilize initial render to match SSR output and avoid hydration mismatch
  const currentTheme = isMounted ? theme : "light";
  const ThemeIcon =
    currentTheme === "dark" ? Moon : currentTheme === "system" ? Monitor : Sun;

  return (
    <label className={cn("inline-flex items-center gap-2", className)}>
      <ThemeIcon
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-secondary-foreground"
      />
      <span className="sr-only">Tema tampilan</span>
      <select
        aria-label="Tema tampilan"
        value={currentTheme}
        disabled={!isMounted}
        onChange={(event) => {
          const value = event.target.value;
          if (value === "light" || value === "dark" || value === "system") {
            setTheme(value);
          }
        }}
        className="min-h-10 sm:min-h-9 min-w-24 rounded-sm border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors focus-ring cursor-pointer disabled:opacity-80"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

