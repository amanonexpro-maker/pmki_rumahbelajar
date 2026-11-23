import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { UNIT } from "@/config/site";
import {
  KontakActionCenter,
  PublicNavbar,
} from "@/features/public";

export const metadata: Metadata = {
  title: `Kontak & Layanan Komunitas | ${UNIT.name} ${UNIT.location}`,
  description: `Informasi narahubung resmi, alamat fisik belajar, pendaftaran peserta didik baru, relawan pengajar, serta dukungan bagi anak-anak di ${UNIT.name} ${UNIT.location}.`,
};

function KontakActionCenterSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-96 rounded-card bg-surface-subtle border border-border-subtle animate-pulse flex items-center justify-center text-xs text-muted-foreground"
    >
      Memuat pusat layanan...
    </div>
  );
}

/**
 * PublicContactPage (Fase 14 Step 8: Action Center Multi-Tujuan & Pelunasan TD-ADDR).
 * Server Component yang menyajikan:
 * 1. Header Editorial: Judul sans-serif, subjudul komunitas, tanpa tombol CTA di header.
 * 2. KontakActionCenter: Segmented control 4-tab diisolasi dalam Suspense (Cache Components enabled).
 * 3. Teaser Penutup: Cross-link ke Program, Galeri Dokumentasi, dan Warta Kabar.
 * 4. Pelunasan TD-ADDR: Bebas dari hardcode alamat dan bebas dari field yatim locationFull/subDistrictsLabel.
 */
export default async function PublicContactPage() {
  "use cache";
  cacheLife("hours");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicNavbar activeSection="kontak" />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-14">
          {/* 1. Header Editorial (Pusat Pelayanan Komunitas, Tanpa CTA Button) */}
          <div className="space-y-2 max-w-2xl text-left">
            <p className="type-eyebrow text-primary uppercase tracking-wider">
              Pusat Pelayanan &amp; Komunitas
            </p>
            <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Kontak &amp; Layanan Komunitas
            </h1>
            <p className="font-sans text-xs sm:text-sm text-secondary-foreground leading-relaxed">
              Informasi narahubung resmi, alamat fisik belajar, pendaftaran peserta didik baru, relawan pengajar, serta dukungan bimbingan belajar gratis di {UNIT.name} {UNIT.location}.
            </p>
          </div>

          {/* 2. Interactive Segmented Action Center Leaf (Suspended for instant static shell) */}
          <Suspense fallback={<KontakActionCenterSkeleton />}>
            <KontakActionCenter />
          </Suspense>

          {/* 3. Teaser Penutup (Cross-link Editorial ke Program & Kabar) */}
          <section
            aria-labelledby="kontak-teaser-heading"
            className="pt-8 border-t border-border space-y-6"
          >
            <div className="space-y-1">
              <h2
                id="kontak-teaser-heading"
                className="text-sm font-semibold tracking-wide text-foreground uppercase"
              >
                Jelajahi lebih lanjut
              </h2>
              <p className="text-xs text-muted-foreground">
                Kenali lebih dalam kurikulum bimbingan belajar dan dokumentasi hangat kegiatan kami.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Teaser 1: Program Detail */}
              <div className="p-5 rounded-card bg-surface border border-border shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                    Kurikulum &amp; Jadwal
                  </p>
                  <h3 className="text-base font-bold text-foreground">
                    Program Bimbingan Belajar
                  </h3>
                  <p className="text-xs text-secondary-foreground leading-relaxed">
                    Pelajari 4 program bimbingan belajar, metode penalaran matematika, literasi membaca, dan profil 13 pengajar relawan.
                  </p>
                </div>
                <div>
                  <Link
                    href="/program"
                    className="inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline focus-ring rounded-xs"
                  >
                    <span>Lihat detail program &rarr;</span>
                  </Link>
                </div>
              </div>

              {/* Teaser 2: Galeri Dokumentasi */}
              <div className="p-5 rounded-card bg-surface border border-border shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                    Dokumentasi Foto
                  </p>
                  <h3 className="text-base font-bold text-foreground">
                    Galeri Griya Asih
                  </h3>
                  <p className="text-xs text-secondary-foreground leading-relaxed">
                    Lihat foto-foto hangat keceriaan dan interaksi anak-anak saat belajar bersama di Griya Asih Lawang.
                  </p>
                </div>
                <div>
                  <Link
                    href="/kabar?tab=galeri"
                    className="inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline focus-ring rounded-xs"
                  >
                    <span>Lihat galeri kegiatan &rarr;</span>
                  </Link>
                </div>
              </div>

              {/* Teaser 3: Warta Kabar Komunitas */}
              <div className="p-5 rounded-card bg-surface border border-border shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                    Warta Komunitas
                  </p>
                  <h3 className="text-base font-bold text-foreground">
                    Kabar &amp; Cerita Terbaru
                  </h3>
                  <p className="text-xs text-secondary-foreground leading-relaxed">
                    Baca warta kemajuan belajar anak, kisah inspiratif, serta agenda refleksi pengajar relawan.
                  </p>
                </div>
                <div>
                  <Link
                    href="/kabar?tab=berita"
                    className="inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline focus-ring rounded-xs"
                  >
                    <span>Baca kabar terbaru &rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
