import Link from "next/link";
import { Home, Newspaper } from "lucide-react";
import { PublicNavbar } from "@/features/public";

/**
 * Custom Not-Found Page (Warm & Human, 10 §14, 03 §9).
 * Memberikan penjelasan yang bersahabat dan tautan navigasi yang jelas
 * ketika pengguna mengakses rute yang tidak ditemukan.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-md w-full text-center space-y-6 rounded-card bg-surface border border-border p-6 sm:p-8 shadow-xs">
          <div className="space-y-2">
            <span className="font-mono text-4xl sm:text-5xl font-bold text-primary">
              404
            </span>
            <h1 className="font-sans text-lg sm:text-xl font-bold text-foreground">
              Halaman Tidak Ditemukan
            </h1>
            <p className="text-xs sm:text-sm text-secondary-foreground leading-relaxed">
              Maaf, halaman atau warta yang Anda tuju tidak tersedia atau tautan telah dipindahkan ke alamat baru.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch justify-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary text-primary-foreground font-medium text-xs px-4 py-2.5 shadow-xs hover:bg-primary-hover focus-ring transition-colors"
            >
              <Home aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span>Kembali ke Beranda</span>
            </Link>

            <Link
              href="/kabar?tab=berita"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-surface border border-border text-foreground hover:bg-surface-subtle font-medium text-xs px-4 py-2.5 focus-ring transition-colors"
            >
              <Newspaper aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span>Lihat Kabar Griya Asih</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
