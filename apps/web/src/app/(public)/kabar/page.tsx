import { Suspense } from "react";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { HOURS } from "@/config/site";
import {
  getPublicPortalData,
  KabarFeedView,
  PublicNavbar,
} from "@/features/public";

export const metadata: Metadata = {
  title: "Kabar Griya Asih | Rumah Belajar Griya Asih Lawang",
  description:
    "Kabar terkini seputar kegiatan bimbingan belajar, kisah kemajuan anak, dan dokumentasi komunitas Rumah Belajar Griya Asih di Lawang.",
};

function KabarFeedSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="min-h-[500px] rounded-card bg-surface-subtle border border-border-subtle animate-pulse p-6 space-y-6"
    >
      <div className="flex gap-2">
        <div className="h-10 w-24 bg-border rounded-pill" />
        <div className="h-10 w-24 bg-border rounded-pill" />
        <div className="h-10 w-24 bg-border rounded-pill" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 bg-surface rounded-card border border-border" />
        ))}
      </div>
    </div>
  );
}

const UPCOMING_EVENTS = [
  {
    id: "event-sesi-mingguan",
    date: `${HOURS.day} (${HOURS.window})`,
    title: "Sesi Bimbingan Belajar Mingguan",
    description:
      "Pembiasaan salam santun, bimbingan Matematika Ceria, Literasi Membaca, Bahasa Inggris, dan Pendidikan Karakter di RAAL Griya Asih.",
  },
  {
    id: "event-evaluasi-bulanan",
    date: "Sabtu Pekan Terakhir Setiap Bulan",
    title: "Evaluasi & Refleksi Pengajar Relawan",
    description:
      "Koordinasi berkala perkembangan belajar peserta didik dan pemantapan modul bimbingan antar pengajar relawan.",
  },
  {
    id: "event-ppdb-semester",
    date: "Tahun Ajaran 2026/2027",
    title: "Pendaftaran Peserta Didik Baru Terbuka",
    description:
      "Terbuka bagi anak jenjang TK hingga SMP Kelas 8 di wilayah Kelurahan Kalirejo, Lawang, dan sekitarnya tanpa pungutan biaya.",
  },
];

/**
 * PublicKabarPage (Fase 14 Step 7 & Fase 16 Step 3.2 R3).
 * Server Component dengan modern Cache Components (ISR 1h):
 * 1. Header Editorial: Judul sans-serif, subjudul komunitas, tanpa tombol CTA.
 * 2. Segmented Control & Feed Hybrid: Client-side URL query tab terisolasi dalam Suspense boundary.
 * 3. Lightbox Album: Interaksi modal imersif untuk melihat dokumentasi foto.
 * 4. Agenda Mendatang Widget: Timeline vertikal sederhana tanggal penting kegiatan belajar.
 */
export default async function PublicKabarPage() {
  "use cache";
  cacheLife("hours");
  const data = await getPublicPortalData();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicNavbar activeSection="kabar" />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          {/* 1. Header Editorial (Emosi Komunitas) */}
          <div className="space-y-2 max-w-2xl text-left">
            <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Kabar Griya Asih
            </h1>
            <p className="font-sans text-xs sm:text-sm text-secondary-foreground leading-relaxed">
              Cerita kebaikan, dokumentasi kegiatan belajar, dan warta terkini seputar kebersamaan anak-anak dan pengajar relawan di Rumah Belajar Griya Asih, Lawang.
            </p>
          </div>

          {/* 2 & 3 & 4. Filter Segmented Control, Feed Hybrid Kartu, & Lightbox Album */}
          <Suspense fallback={<KabarFeedSkeleton />}>
            <KabarFeedView
              newsItems={data.newsItems}
              galleryItems={data.galleryItems}
            />
          </Suspense>

          {/* 5. Agenda Mendatang Widget */}
          <section
            id="agenda"
            aria-labelledby="agenda-heading"
            className="pt-10 border-t border-border space-y-6 text-left"
          >
            <div className="space-y-1">
              <span className="font-bold text-xs uppercase tracking-wider text-primary">
                Catat Tanggal Penting
              </span>
              <h2
                id="agenda-heading"
                className="font-sans text-base sm:text-lg font-bold text-foreground tracking-tight"
              >
                Agenda &amp; Jadwal Kegiatan
              </h2>
            </div>

            {/* List Timeline Vertikal Simpel */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border-subtle">
              {UPCOMING_EVENTS.map((event) => (
                <div key={event.id} className="relative flex items-start gap-3">
                  {/* Dot Indicator */}
                  <div
                    className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-primary shrink-0"
                    aria-hidden="true"
                  />
                  <div className="space-y-0.5 text-xs">
                    <p className="font-bold text-foreground font-mono tabular-nums">
                      {event.date}
                    </p>
                    <p className="text-secondary-foreground font-medium text-xs sm:text-sm">
                      {event.title}
                    </p>
                    <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed max-w-xl">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
