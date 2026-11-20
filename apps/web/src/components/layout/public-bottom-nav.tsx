"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, PhoneCall, UserPlus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface BottomNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Path prefix yang dianggap aktif. Tanpa ini, item tidak pernah aktif (mis. anchor). */
  matchPaths?: string[];
  activeExact?: boolean;
  isPrimaryCTA?: boolean;
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { label: "Beranda", href: "/", icon: Home, matchPaths: ["/"], activeExact: true },
  { label: "Program", href: "/program", icon: BookOpen, matchPaths: ["/program"] },
  {
    label: "Daftar",
    href: "/pendaftaran",
    icon: UserPlus,
    matchPaths: ["/pendaftaran", "/registration"],
    isPrimaryCTA: true,
  },
  { label: "Kontak", href: "/kontak", icon: PhoneCall, matchPaths: ["/kontak"] },
];

function isItemActive(item: BottomNavItem, pathname: string): boolean {
  if (!item.matchPaths) return false;
  return item.matchPaths.some((path) =>
    item.activeExact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`)
  );
}

/**
 * Public Bottom Navigation (Fase 13c-1, UI-UX §30–31, 03 §9).
 * Hanya mobile (< md). Hanya dipasang di route group (public), bukan Workspace.
 * Touch target >= 44px (setiap item setinggi bar 64px), safe-area iOS dihormati.
 */
export function PublicBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi cepat situs publik"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border-subtle bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex h-16 items-stretch justify-around">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = isItemActive(item, pathname);
          const Icon = item.icon;
          return (
            <li key={item.label} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full min-h-11 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors duration-150 focus-ring",
                  active || item.isPrimaryCTA
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                  active && "font-semibold"
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center",
                    item.isPrimaryCTA && "rounded-full bg-primary-soft p-1"
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className="h-5 w-5"
                    strokeWidth={active ? 2 : 1.5}
                  />
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

