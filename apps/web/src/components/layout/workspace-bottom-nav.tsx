"use client";

import * as React from "react";
import Link from "next/link";
import { ICON_MAP } from "@/config/icons";
import type { UserPersona } from "@/lib/auth/personas";
import { cn } from "@/lib/cn";
import { MobileNavigation } from "./mobile-navigation";
import { type SidebarNavGroup, type SidebarNavItem } from "./sidebar";

export interface WorkspaceBottomNavProps {
  /** Sumber tunggal menu: kirim `navGroups` dari AppShell (JANGAN duplikasi list). */
  groups: SidebarNavGroup[];
  /** Daftar izin user; dipakai filter yang sama dengan SidebarNavigation. */
  userPermissions?: string[];
  /** Persona user untuk filter grup menu di drawer "Lainnya". */
  userPersona?: UserPersona;
  /** Path aktif dari usePathname() (dioper dari AppShell agar tidak dobel hook). */
  currentPath: string;
  /** Aksi footer tambahan di drawer "Lainnya" (mis. tombol Keluar di mobile). */
  footerActionSlot?: React.ReactNode;
}

const PRIORITY_HREFS: readonly string[] = [
  "/workspace",
  "/workspace/students",
  "/workspace/attendance",
  "/workspace/academic",
] as const;

/**
 * Workspace Bottom Navigation Bar (Fase 19 Step 2 - P1, UI-UX §30–31, 03 §9).
 * - Navigasi 1-tap mobile (< md:hidden) dengan 5 slot: 4 slot prioritas + 1 slot "Lainnya".
 * - Slot 1–4 difilter berdasarkan izin user (requiredPermission).
 * - Slot 5 selalu "Lainnya" yang membuka drawer samping untuk seluruh modul dan preferensi.
 * - Touch target >= 44px (min-h-11), safe-area padding dihormati.
 * - Menggunakan token semantik tanpa hardcoded hex (anti-drift).
 */
export function WorkspaceBottomNav({
  groups,
  userPermissions,
  userPersona,
  currentPath,
  footerActionSlot,
}: WorkspaceBottomNavProps) {
  const [moreOpen, setMoreOpen] = React.useState(false);

  // Filter seluruh item yang lolos izin persis seperti pada SidebarNavigation (sidebar.tsx:46-49)
  const allVisibleItems = React.useMemo(() => {
    return groups
      .flatMap((group) => group.items)
      .filter((item) => {
        if (!item.requiredPermission || !userPermissions) return true;
        return userPermissions.includes(item.requiredPermission);
      });
  }, [groups, userPermissions]);

  // Ambil maksimal 4 slot prioritas sesuai urutan kanonik href
  const priorityItems = React.useMemo(() => {
    return PRIORITY_HREFS.map((href) =>
      allVisibleItems.find((item) => item.href === href)
    ).filter((item): item is SidebarNavItem => item !== undefined);
  }, [allVisibleItems]);

  const LainnyaIcon = ICON_MAP.lainnya;

  // Cek apakah halaman aktif merupakan salah satu item prioritas
  const isPriorityActive = (href: string) => {
    if (href === "/workspace") {
      return currentPath === "/workspace";
    }
    return currentPath === href || currentPath.startsWith(`${href}/`);
  };

  // Jika halaman aktif bukan salah satu dari 4 slot prioritas, tandai menu "Lainnya"
  const isOtherActive =
    !priorityItems.some((item) => isPriorityActive(item.href)) &&
    currentPath.startsWith("/workspace");

  return (
    <>
      <nav
        aria-label="Navigasi cepat workspace"
        className="fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border pb-[max(env(safe-area-inset-bottom,0px),16px)] md:hidden"
      >
        <ul className="flex h-16 items-stretch justify-around">
          {priorityItems.map((item) => {
            const isActive = isPriorityActive(item.href);
            const IconComponent = item.icon;

            return (
              <li key={item.id} className="flex-1 min-w-0">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-full min-h-[44px] w-full flex-col items-center justify-center gap-1 py-2 text-[10px] transition-colors duration-200 focus-ring rounded-xs",
                    isActive
                      ? "font-semibold text-primary"
                      : "font-normal text-muted-foreground hover:text-foreground"
                  )}
                >
                  <IconComponent
                    aria-hidden="true"
                    className="w-5 h-5 shrink-0"
                    strokeWidth={2}
                  />
                  <span className="truncate max-w-full px-1">{item.label}</span>
                </Link>
              </li>
            );
          })}

          {/* Slot ke-5: "Lainnya" */}
          <li className="flex-1 min-w-0">
            <button
              type="button"
              aria-label="Menu lainnya"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex h-full min-h-[44px] w-full flex-col items-center justify-center gap-1 py-2 text-[10px] transition-colors duration-200 focus-ring rounded-xs",
                moreOpen || isOtherActive
                  ? "font-semibold text-primary"
                  : "font-normal text-muted-foreground hover:text-foreground"
              )}
            >
              <LainnyaIcon
                aria-hidden="true"
                className="w-5 h-5 shrink-0"
                strokeWidth={2}
              />
              <span className="truncate max-w-full px-1">Lainnya</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Drawer Menu Lengkap */}
      <MobileNavigation
        open={moreOpen}
        onOpenChange={setMoreOpen}
        groups={groups}
        currentPath={currentPath}
        userPermissions={userPermissions}
        userPersona={userPersona}
        footerActionSlot={footerActionSlot}
      />
    </>
  );
}

