"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ICON_MAP } from "@/config/icons";
import { UNIT } from "@/config/site";
import { cn } from "@/lib/cn";

export interface PublicNavbarProps {
  activeSection?: string;
}

const DESKTOP_NAV_ITEMS = [
  { label: "Beranda", href: "/", iconKey: "beranda" as const },
  { label: "Program", href: "/program", iconKey: "program" as const },
  { label: "Kabar", href: "/kabar", iconKey: "kabar" as const },
  { label: "Kontak", href: "/kontak", iconKey: "kontak" as const },
] as const;

/**
 * UI-12 Public Header (Fase 14 Step 3, 07 §13–14, UI-UX §31).
 * Struktur responsif dua-mode:
 * - Mobile (< md): HANYA [Logo Mark "P"] + [Teks HTML UNIT] + [Ikon Lock Portal Pengurus diskrit].
 * - Desktop (>= md): Logo & teks UNIT + Nav Inline 4-item (Beranda, Program, Kabar, Kontak) + Ikon Lock.
 * - Menggunakan UNIT dari config/site.ts dan ICON_MAP dari config/icons.ts (anti-hardcode, anti-drift).
 */
export function PublicNavbar({}: PublicNavbarProps = {}) {
  const pathname = usePathname();
  const LockIcon = ICON_MAP.portal;

  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-border-subtle pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Left Cluster: [Logo Mark "P"] + [Teks HTML UNIT dari config] */}
          <Link
            href="/"
            aria-label={`Kembali ke beranda ${UNIT.name} ${UNIT.location}`}
            className="group flex min-w-0 shrink-0 items-center gap-3 text-left focus-ring rounded-control p-1 min-h-11"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-surface border border-border-subtle overflow-hidden">
              <picture className="flex items-center justify-center">
                <source srcSet="/pmki_app_icon.svg" type="image/svg+xml" />
                <img
                  src="/pmki_app_icon.png"
                  alt={`Logo Mark ${UNIT.name}`}
                  width={32}
                  height={32}
                  className="h-7 w-7 object-contain"
                  loading="eager"
                />
              </picture>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="whitespace-nowrap text-sm font-bold leading-none text-foreground group-hover:text-primary transition-colors">
                  {UNIT.name}
                  <span className="text-muted-foreground font-normal text-xs ml-1.5 whitespace-nowrap">
                    • {UNIT.location}
                  </span>
                </span>
              </div>
              <p className="hidden sm:block whitespace-nowrap text-xs font-medium text-muted-foreground pt-0.5">
                Ayo belajar dan tumbuh bersama.
              </p>
            </div>
          </Link>

          {/* Right Cluster: Desktop Inline Nav (>= md) + Ikon Lock Diskrit */}
          <div className="flex items-center gap-4 lg:gap-6">
            {/* Desktop Navigation Links (>= md) */}
            <nav
              aria-label="Navigasi desktop situs publik"
              className="hidden md:flex items-center gap-6"
            >
              {DESKTOP_NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const NavIcon = ICON_MAP[item.iconKey];

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center text-sm transition-colors duration-200 focus-ring rounded-control px-2 py-1.5 min-h-11",
                      isActive
                        ? "text-primary font-semibold"
                        : "text-muted-foreground hover:text-primary font-normal"
                    )}
                  >
                    <NavIcon aria-hidden="true" className="w-4 h-4 shrink-0 mr-1.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Portal Pengurus Lock Icon (Mobile & Desktop) */}
            <Link
              href="/auth/login"
              aria-label="Masuk ke Ruang Kerja pengurus dan pengajar"
              title="Masuk ke Ruang Kerja"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-muted-foreground hover:text-primary transition-colors duration-200 focus-ring"
            >
              <LockIcon aria-hidden="true" className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
