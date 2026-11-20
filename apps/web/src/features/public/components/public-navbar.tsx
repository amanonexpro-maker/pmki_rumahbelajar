"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  HeartHandshake,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { ThemePicker } from "@/components/layout/theme-picker";
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
  { id: "jadwal", label: "Jadwal Belajar", href: "/#jadwal" },
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
  { id: "kontak", label: "Kontak", href: "/#kontak" },
];

/**
 * UI-12 Public Header & Mobile Navigation (`07 §13–14`, `10 §5A`, `UI-UX §31`).
 * - Navigation labels use Title Case (`10 §5A`).
 * - Mobile touch targets strictly >= 44px (`min-h-11`).
 * - Restrained secondary Portal Pengurus action.
 */
export function PublicNavbar({ activeSection }: PublicNavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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
      {/* Top Institutional Service Context Strip */}
      <div className="bg-surface-subtle text-secondary-foreground border-b border-border-subtle">
        <div className="max-w-7xl mx-auto flex min-h-9 items-center justify-between gap-4 px-4 text-xs sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 text-primary font-semibold">
            <HeartHandshake aria-hidden="true" className="w-3.5 h-3.5" />
            <span>PMKI Mupel Jawa Timur</span>
          </span>
          <div className="flex shrink-0 items-center gap-4 sm:gap-6">
            <span className="hidden md:inline text-secondary-foreground">
              Pelayanan pendidikan kasih &amp; karakter bangsa
            </span>
            <span className="hidden sm:inline font-semibold text-warning tracking-wide">
              &ldquo;Dare to be Great&rdquo;{" "}
              <span className="font-normal text-muted-foreground">
                (Berani menjadi unggul)
              </span>
            </span>
            <ThemePicker className="text-secondary-foreground hover:text-foreground" />
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
          {/* Brand Identity */}
          <Link
            href="/"
            aria-label="Kembali ke beranda Rumah Belajar Griya Asih Lawang"
            className="group flex min-w-0 shrink-0 items-center gap-3 text-left focus-ring rounded-control p-1 min-h-11"
          >
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-control bg-surface border border-border-subtle overflow-hidden">
              <Image
                src="/pmki_logo.svg"
                alt="Logo PMKI - Rumah Belajar Griya Asih Lawang"
                width={40}
                height={40}
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-base sm:text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                  Rumah Belajar Griya Asih
                </span>
                <span className="hidden lg:inline-flex rounded-pill bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
                  Lawang
                </span>
              </div>
              <p className="whitespace-nowrap text-xs font-medium text-secondary-foreground">
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

          {/* Right Action: Secondary Internal Workspace Portal Link */}
          <div className="hidden shrink-0 items-center gap-3 xl:flex">
            <Link
              href="/workspace"
              className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-control bg-surface hover:bg-surface-subtle text-foreground border border-border px-4 py-2 text-xs font-semibold shadow-xs transition-colors active:scale-[0.985] focus-ring"
            >
              <LayoutDashboard
                aria-hidden="true"
                className="w-4 h-4 text-primary"
              />
              <span>Portal Pengurus</span>
            </Link>
          </div>

          {/* Mobile Controls (>= 44px touch targets) */}
          <div className="flex shrink-0 items-center gap-2 xl:hidden">
            <Link
              href="/workspace"
              aria-label="Buka portal ruang kerja pengurus dan pengajar"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border p-2.5 text-secondary-foreground hover:text-foreground hover:bg-surface-subtle focus-ring"
            >
              <LayoutDashboard
                aria-hidden="true"
                className="w-5 h-5 text-primary"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control p-2.5 text-secondary-foreground hover:text-foreground hover:bg-surface-subtle focus-ring cursor-pointer"
              aria-label={
                mobileMenuOpen
                  ? "Tutup menu navigasi"
                  : "Buka menu navigasi utama"
              }
              aria-expanded={mobileMenuOpen}
              aria-controls="public-mobile-navigation"
            >
              {mobileMenuOpen ? (
                <X aria-hidden="true" className="w-6 h-6" />
              ) : (
                <Menu aria-hidden="true" className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (Touch Target >= 44px) */}
      {mobileMenuOpen && (
        <div
          id="public-mobile-navigation"
          className="border-b border-border bg-surface px-4 pb-6 pt-3 shadow-overlay xl:hidden"
        >
          <nav
            aria-label="Navigasi seluler situs publik"
            className="grid grid-cols-2 gap-2 border-b border-border-subtle pb-4"
          >
            {PUBLIC_NAV_ITEMS.map((link) => {
              const active = isItemActive(link);
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center text-left px-3.5 py-2.5 rounded-control text-sm font-medium transition-colors focus-ring",
                    active
                      ? "bg-primary-soft font-semibold text-primary"
                      : "text-secondary-foreground hover:bg-surface-subtle hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4">
            <Link
              href="/workspace"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex min-h-11 items-center justify-center gap-2 py-2.5 px-4 rounded-control bg-surface-subtle hover:bg-surface text-foreground border border-border font-semibold text-xs shadow-xs focus-ring"
            >
              <LayoutDashboard
                aria-hidden="true"
                className="w-4 h-4 text-primary"
              />
              <span>Akses portal pengurus &amp; pengajar</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

