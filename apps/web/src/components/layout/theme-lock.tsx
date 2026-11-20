"use client";

import * as React from "react";
import { useTheme, type ResolvedTheme } from "./theme-provider";

/**
 * Mengunci tema efektif selama komponen ter-mount (mis. route group Public = light).
 * Preferensi pengguna di localStorage TIDAK diubah; kunci dilepas saat unmount
 * sehingga Workspace kembali memakai preferensi (03 §7, §9).
 */
export function ThemeLock({ theme }: { theme: ResolvedTheme }) {
  const { lockTheme } = useTheme();

  React.useLayoutEffect(() => {
    lockTheme(theme);
    return () => lockTheme(null);
  }, [lockTheme, theme]);

  return null;
}

