"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  routeMatch?: string;
}

export const PUBLIC_NAV_ITEMS: readonly NavItem[] = [
  { id: "beranda", label: "Beranda", href: "/", routeMatch: "/" },
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
 * Public Menu FAB (Floating Action Button) — Fase 13m (UI-UX §31, 03 §9).
 * Memindahkan akses drawer dari header pojok kanan atas ke zona jempol
 * (pojok kanan bawah, tepat di atas PublicBottomNav).
 * Hanya aktif pada mobile (< md).
 */
export function PublicMenuFab() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = React.useState(pathname);

  // Close drawer upon navigation (state-during-render per React 19 rules)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // Close drawer on Escape key
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Tutup menu navigasi" : "Buka menu navigasi lengkap"}
        aria-expanded={open}
        aria-controls="public-fab-navigation"
        className="fixed bottom-[calc(4.75rem+max(env(safe-area-inset-bottom,0px),16px))] right-4 z-50 w-12 h-12 rounded-full bg-surface border border-border-subtle shadow-overlay flex items-center justify-center text-primary transition-transform active:scale-95 hover:bg-surface-subtle focus-ring cursor-pointer md:hidden"
      >
        {open ? (
          <X aria-hidden="true" className="w-5 h-5 text-foreground" />
        ) : (
          <Menu aria-hidden="true" className="w-5 h-5" />
        )}
      </button>

      {/* Drawer Overlay & Panel */}
      {open && (
        <div
          id="public-fab-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi lengkap"
          className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-xs flex flex-col justify-end md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-surface border-t border-border rounded-t-card p-5 pb-[calc(5rem+max(env(safe-area-inset-bottom,0px),16px))] shadow-overlay space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <p className="font-bold text-sm text-foreground">Menu Situs</p>
                <p className="text-xs text-muted-foreground">Rumah Belajar Griya Asih • Lawang</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="p-1 rounded-control text-muted-foreground hover:text-foreground focus-ring cursor-pointer"
              >
                <X aria-hidden="true" className="w-5 h-5" />
              </button>
            </div>

            <nav aria-label="Navigasi drawer" className="grid grid-cols-2 gap-2">
              {PUBLIC_NAV_ITEMS.map((link) => {
                const active =
                  link.routeMatch === "/"
                    ? pathname === "/"
                    : link.routeMatch
                    ? pathname.startsWith(link.routeMatch)
                    : false;

                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center px-3.5 py-2.5 rounded-control text-sm font-medium transition-colors focus-ring",
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

            <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-10 items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors focus-ring"
              >
                <Lock aria-hidden="true" className="w-3.5 h-3.5" />
                <span>Masuk ke Ruang Kerja Staf</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
