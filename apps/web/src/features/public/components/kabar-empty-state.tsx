import * as React from "react";
import Link from "next/link";

/**
 * KabarEmptyState (Fase 14 Step 3, 10 §4 Tone of Voice - Warm & Human).
 * Menampilkan pesan ramah komunitas saat feed kabar belum memiliki entri aktif.
 */
export function KabarEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-card bg-surface border border-border-subtle space-y-4">
      {/* Tunas/Sprout Illustration (Stroke 2, Semantic Primary Token) */}
      <div className="w-16 h-16 rounded-pill bg-primary-soft flex items-center justify-center text-primary">
        <svg
          className="w-8 h-8 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M7 20h10" />
          <path d="M10 20c0-4.5 1.5-7.5 4-10" />
          <path d="M14 10c0-3.3 2.7-6 6-6 0 3.3-2.7 6-6 6z" />
          <path d="M12 14c-3.3 0-6-2.7-6-6 3.3 0 6 2.7 6 6z" />
        </svg>
      </div>

      <div className="max-w-md space-y-1.5">
        <h2 className="text-base sm:text-lg font-bold text-foreground">
          Kabar pertama segera hadir.
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Sambil menunggu, intip program bimbingan belajar kami atau jelajahi kegiatan bersama anak-anak.
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/program"
          className="inline-flex min-h-11 items-center justify-center gap-1.5 px-5 py-2.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs sm:text-sm transition-colors duration-200 focus-ring shadow-xs"
        >
          <span>Lihat program belajar</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

