import * as React from "react";
import type { Viewport } from "next";
import { ThemeLock } from "@/components/layout/theme-lock";

/**
 * Public Route Group Layout — Light Lock (Fase 13b).
 * Public is expressive: identitas hangat (off-white + forest) dikunci ke light
 * (03 §7, §9). Tidak ada ThemePicker di route group ini; fungsi tema tetap
 * tersedia untuk Workspace. Preferensi tersimpan pengguna tidak diubah.
 */
export const viewport: Viewport = {
  colorScheme: "light",
};

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ThemeLock theme="light" />
      {children}
    </>
  );
}

