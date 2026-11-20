import Link from "next/link";
import { MessageCircle, ShieldCheck } from "lucide-react";

/**
 * Minimalist Sitemap & Trust Signal Footer (Fase 13e, UI-UX §28, 07 §25).
 * - Ultra-compact vertical profile (< 150px height on mobile, < 200px total).
 * - 3 clean rows: Brand & Trust, Essential Links, and Utility/Legal.
 * - Eliminated redundant program & schedule lists (already fully served on /program & /kontak).
 */
export function PublicFooter() {
  return (
    <footer className="bg-surface-subtle text-secondary-foreground border-t border-border py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* BARIS 1: Brand & Privacy Trust Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-control bg-surface border border-border-subtle flex items-center justify-center shrink-0 overflow-hidden">
              <picture className="flex items-center justify-center">
                <source srcSet="/pmki_logo.svg" type="image/svg+xml" />
                <img
                  src="/pmki_logo.png"
                  alt="Logo PMKI - Rumah Belajar Griya Asih"
                  width={24}
                  height={24}
                  className="w-5 h-5 object-contain"
                  loading="lazy"
                />
              </picture>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-sm text-foreground">
                PMKI Griya Asih
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                • Lawang, Kab. Malang
              </span>
            </div>
          </div>

          {/* Privacy Trust Signal */}
          <div className="inline-flex items-center gap-1.5 text-xs text-secondary-foreground font-medium self-start sm:self-center">
            <ShieldCheck
              aria-hidden="true"
              className="w-4 h-4 text-primary shrink-0"
            />
            <span>Data Anak Terlindungi</span>
          </div>
        </div>

        {/* BARIS 2: Essential Sitemap Links Row */}
        <nav
          aria-label="Tautan navigasi footer"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground pt-1"
        >
          <Link
            href="/"
            className="hover:text-primary transition-colors focus-ring rounded-xs py-1"
          >
            Beranda
          </Link>
          <Link
            href="/program"
            className="hover:text-primary transition-colors focus-ring rounded-xs py-1"
          >
            Program
          </Link>
          <Link
            href="/gallery"
            className="hover:text-primary transition-colors focus-ring rounded-xs py-1"
          >
            Galeri
          </Link>
          <Link
            href="/news"
            className="hover:text-primary transition-colors focus-ring rounded-xs py-1"
          >
            Berita
          </Link>
          <Link
            href="/kontak"
            className="hover:text-primary transition-colors focus-ring rounded-xs py-1"
          >
            Kontak
          </Link>
          <Link
            href="/auth/login"
            className="hover:text-primary transition-colors focus-ring rounded-xs py-1 text-xs text-muted-foreground/80 sm:ml-auto"
          >
            Portal Pengurus
          </Link>
        </nav>

        {/* BARIS 3: Utility & WhatsApp Row */}
        <div className="border-t border-border-subtle pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            © 2026 Platform Pelayanan Terpadu PMKI. Pilot: RAAL Griya Asih Lawang.
          </p>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              Chat Pengurus:
            </span>
            <a
              href="https://wa.me/628123235318"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Hubungi Ms. Evi melalui WhatsApp"
              className="inline-flex min-h-8 items-center gap-1 px-2 py-1 rounded-control bg-surface hover:bg-surface-subtle border border-border text-[11px] font-medium text-foreground hover:text-primary transition-colors focus-ring"
            >
              <MessageCircle aria-hidden="true" className="w-3 h-3 text-primary" />
              <span>Ms. Evi</span>
            </a>
            <a
              href="https://wa.me/6281332987491"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Hubungi Ms. Lilian melalui WhatsApp"
              className="inline-flex min-h-8 items-center gap-1 px-2 py-1 rounded-control bg-surface hover:bg-surface-subtle border border-border text-[11px] font-medium text-foreground hover:text-primary transition-colors focus-ring"
            >
              <MessageCircle aria-hidden="true" className="w-3 h-3 text-primary" />
              <span>Ms. Lilian</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
