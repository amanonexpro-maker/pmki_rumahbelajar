"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { cn } from "@/lib/cn";

export interface PublicNavbarProps {
  activeSection?: string;
}

const PUBLIC_NAV_ITEMS: {
  id: string;
  label: string;
  href: string;
  routeMatch?: string;
}[] = [
  { id: "beranda", label: "Beranda", href: "/#beranda", routeMatch: "/" },
  { id: "tentang", label: "Tentang Kami", href: "/#tentang" },
  {
    id: "program",
    label: "Program & Kelas",
    href: "/program",
    routeMatch: "/program",
  },
  { id: "jadwal", label: "Jadwal Belajar", href: "/program#jadwal" },
  {
    id: "galeri",
    label: "Dokumentasi",
    href: "/gallery",
    routeMatch: "/gallery",
  },
  { id: "berita", label: "Publikasi", href: "/news", routeMatch: "/news" },
  {
    id: "pendaftaran",
    label: "Pendaftaran",
    href: "/pendaftaran",
    routeMatch: "/pendaftaran",
  },
  { id: "kontak", label: "Kontak", href: "/kontak", routeMatch: "/kontak" },
];

/**
 * UI-12 Public Header & Mobile Navigation (`07 §13–14`, `10 §5A`, `UI-UX §31`).
 * Fase 13b: header ringkas (h-14), tanpa ThemePicker (Public dikunci light),
 * akses staff = ikon diskrit (Lock) menuju /auth/login.
 * - Navigation labels use Title Case (`10 §5A`).
 * - Touch targets strictly >= 44px (`min-h-11`).
 */
export function PublicNavbar({ activeSection }: PublicNavbarProps) {
  const pathname = usePathname();

  const isItemActive = (item: (typeof PUBLIC_NAV_ITEMS)[number]): boolean => {
    if (activeSection && activeSection === item.id) return true;
    if (item.routeMatch && item.routeMatch !== "/" && pathname === item.routeMatch) {
      return true;
    }
    if (item.id === "beranda" && pathname === "/" && !activeSection) {
      return true;
    }
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Brand Identity */}
          <Link
            href="/"
            aria-label="Kembali ke beranda Rumah Belajar Griya Asih Lawang"
            className="group flex min-w-0 shrink-0 items-center gap-3 text-left focus-ring rounded-control p-1 min-h-11"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface border border-border-subtle overflow-hidden">
              <picture className="flex items-center justify-center">
                <source srcSet="/pmki_logo.svg" type="image/svg+xml" />
                <img
                  src="/pmki_logo.png"
                  alt="Logo PMKI - Rumah Belajar Griya Asih Lawang"
                  width={32}
                  height={32}
                  className="h-7 w-7 object-contain"
                  loading="eager"
                />
              </picture>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-sm font-bold leading-none text-foreground group-hover:text-primary transition-colors">
                  Rumah Belajar Griya Asih
                  <span className="text-muted-foreground font-normal text-xs ml-1 whitespace-nowrap">
                    • Lawang
                  </span>
                </span>
              </div>
              <p className="hidden sm:block whitespace-nowrap text-xs font-medium text-secondary-foreground pt-0.5">
                Ayo belajar dan tumbuh bersama.
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links (Title Case per 10 §5A) */}
          <nav
            aria-label="Navigasi utama situs publik"
            className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex"
          >
            {PUBLIC_NAV_ITEMS.map((link) => {
              const active = isItemActive(link);
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center whitespace-nowrap rounded-control px-3 py-2 text-xs 2xl:text-[13px] font-medium transition-colors focus-ring",
                    active
                      ? "bg-primary-soft text-primary font-semibold"
                      : "text-secondary-foreground hover:text-foreground hover:bg-surface-subtle"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: ikon akses staf diskrit (tanpa label, bukan CTA) */}
          <div className="flex shrink-0 items-center">
            <Link
              href="/auth/login"
              aria-label="Masuk ke Ruang Kerja pengurus dan pengajar"
              title="Masuk ke Ruang Kerja"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-muted-foreground hover:text-primary transition-colors focus-ring"
            >
              <Lock aria-hidden="true" className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

