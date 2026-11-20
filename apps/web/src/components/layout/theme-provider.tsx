"use client";

import * as React from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  /** Kunci tema efektif per-rute (null = lepas). Tidak mengubah preferensi tersimpan. */
  lockTheme: (theme: ResolvedTheme | null) => void;
}

const STORAGE_KEY = "pmki_theme";

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined
);

function subscribeTheme(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark" || saved === "system") {
    return saved;
  }
  return "light";
}

function getStoredThemeServer(): ThemePreference {
  return "light";
}

function subscribeSystemTheme(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getSystemThemeClient(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getSystemThemeServer(): ResolvedTheme {
  return "light";
}

function applyThemeToDom(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [overrideTheme, setOverrideTheme] =
    React.useState<ThemePreference | null>(null);

  const storedTheme = React.useSyncExternalStore(
    subscribeTheme,
    getStoredTheme,
    getStoredThemeServer
  );

  const systemTheme = React.useSyncExternalStore(
    subscribeSystemTheme,
    getSystemThemeClient,
    getSystemThemeServer
  );

  // Route-level lock (mis. Public = Light). Preferensi pengguna tidak diubah/dihapus.
  const [lockedTheme, setLockedTheme] = React.useState<ResolvedTheme | null>(
    null
  );

  const theme: ThemePreference = overrideTheme ?? storedTheme;
  const preferredResolved: ResolvedTheme =
    theme === "system" ? systemTheme : theme;
  const resolvedTheme: ResolvedTheme = lockedTheme ?? preferredResolved;

  React.useEffect(() => {
    applyThemeToDom(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = React.useCallback((next: ThemePreference) => {
    setOverrideTheme(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme, lockTheme: setLockedTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
