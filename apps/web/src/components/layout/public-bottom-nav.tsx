"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ICON_MAP } from "@/config/icons";
import { cn } from "@/lib/cn";

interface BottomNavItem {
  readonly label: string;
  readonly href: string;
  readonly iconKey: "beranda" | "program" | "kabar" | "kontak";
}

const BOTTOM_NAV_ITEMS: readonly BottomNavItem[] = [
  { label: "Beranda", href: "/", iconKey: "beranda" },
  { label: "Program", href: "/program", iconKey: "program" },
  { label: "Kabar", href: "/kabar", iconKey: "kabar" },
  { label: "Kontak", href: "/kontak", iconKey: "kontak" },
] as const;

/**
 * Public Bottom Navigation Bar (Fase 14 Step 3, UI-UX §30–31, 03 §9).
 * - 4 item kanonik: [Beranda] [Program] [Kabar] [Kontak].
 * - Item "Daftar" dihapus total dari bottom nav.
 * - Mobile-only (< md). Seluruh item proporsional setara tanpa hierarki buatan.
 * - Touch target >= 44px (min-h-11), safe-area padding dihormati.
 * - Menggunakan ICON_MAP dari registry semantik (anti-drift).
 */
export function PublicBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi cepat situs publik"
      className="fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border-subtle pb-[max(env(safe-area-inset-bottom,0px),16px)] md:hidden"
    >
      <ul className="flex h-16 items-stretch justify-around">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = ICON_MAP[item.iconKey];

          return (
            <li key={item.label} className="flex-1 min-w-0">
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
                <Icon
                  aria-hidden="true"
                  className="w-5 h-5 shrink-0"
                  strokeWidth={2}
                />
                <span className="truncate max-w-full px-1">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
