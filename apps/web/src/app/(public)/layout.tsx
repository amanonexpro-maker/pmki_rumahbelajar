import * as React from "react";
import type { Viewport } from "next";
import { PublicBottomNav } from "@/components/layout/public-bottom-nav";
import { ThemeLock } from "@/components/layout/theme-lock";
import { PublicFooter } from "@/features/public";

/**
 * Public Route Group Layout — Light Lock (Fase 13b) + Bottom Nav (Fase 13c-1) + Solo Source Footer (Fase 14 Step 4).
 * Public is expressive: identitas hangat (off-white + forest) dikunci ke light
 * (03 §7, §9). Tidak ada ThemePicker di route group ini; fungsi tema tetap
 * tersedia untuk Workspace. `viewportFit: cover` agar safe-area iOS terbaca
 * oleh Bottom Nav.
 */
export const viewport: Viewport = {
  colorScheme: "light",
  viewportFit: "cover",
};

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ThemeLock theme="light" />
      {/* Ruang bawah agar konten & footer tidak tertutup Bottom Nav (~68px + safe-area gesture bar) di mobile */}
      <div className="pb-[calc(4.75rem+max(env(safe-area-inset-bottom,0px),16px))] md:pb-0">
        {children}
        <PublicFooter />
      </div>
      <PublicBottomNav />
    </>
  );
}
