import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ICON_MAP } from "@/config/icons";
import { HOURS, UNIT } from "@/config/site";
import { formatToIndonesianStandard } from "@/utils/date-formatter";
import type { PublicPortalDataDTO } from "../types/public-types";

export interface PublicCuratedHomeProps {
  data: PublicPortalDataDTO;
}

function getProgramIconKey(id: string): string {
  if (id.includes("matematika")) return "math";
  if (id.includes("inggris") || id.includes("membaca")) return "literacy";
  return "karakter";
}

/**
 * PMKIMarkIcon — Logo Mark Huruf 'P' + Daun Tunas & Titik Emas
 * Diekstrak dari /pmki_app_icon.svg untuk representasi semantik brand PMKI.
 */
function PMKIMarkIcon({
  className = "w-6 h-6 text-primary",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="260 230 520 560"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d="M 285 248 L 568 248 C 685 248, 766 324, 766 444 C 766 566, 682 642, 560 642 L 474 642 L 474 756 C 474 769, 463 780, 450 780 C 437 780, 426 769, 426 756 L 426 576 C 374 554, 344 504, 344 434 L 344 424 L 534 326 C 548 319, 564 320, 577 328 L 648 374 C 653 378, 656 384, 656 391 L 656 436 C 656 508, 608 552, 526 572 C 496 580, 476 604, 474 636 L 474 642 L 426 642 L 426 766 C 426 773, 420 779, 413 779 L 291 779 C 284 779, 278 773, 278 766 L 278 255 C 278 251, 281 248, 285 248 Z M 450 518 C 452 478, 434 452, 375 452 C 375 504, 405 536, 444 544 L 450 546 Z M 458 544 C 460 478, 496 436, 571 436 C 571 504, 530 548, 466 562 L 458 564 Z"
      />
      <circle cx="571" cy="395" r="25" fill="#f7c042" />
    </svg>
  );
}

/**
 * PublicCuratedHome (Fase 14 Step 5: Gateway Komunitas & Storytelling Flow — Iterasi V2).
 * Server Component yang merender alur naratif 6 section berurutan:
 * 1. Hero: Emosi & Identitas (Editorial Newsreader serif, subjudul hangat, tanpa tombol CTA).
 * 2. Siapa Kami: Narasi misi kanonikal repo (id="siapa-kami" deep link contract).
 * 3. Quick Facts: Grid 2x2 horizontal padat dengan smart truncation (Jenjang, Biaya, Waktu, Lokasi).
 * 4. Sorotan Kabar: Bukti sosial dinamis (artikel dominan + album pendamping / fallback).
 * 5. Intip Program: Eksplorasi kurikulum 3 program utama dengan ikon semantik.
 * 6. Ajakan Bergabung: Jembatan konversi akhir (CTA primer ke /kontak?tab=siswa, secondary ke /kontak).
 */
export function PublicCuratedHome({ data }: PublicCuratedHomeProps) {
  const latestArticle = data.newsItems?.[0];
  const latestAlbum = data.galleryItems?.[0];
  const topPrograms = data.programs.slice(0, 3);

  const quickFactsData = [
    {
      label: "JENJANG",
      iconKey: "peserta",
      fullValue: data?.metrics?.educationLevelsValue || "TK hingga SMP Kelas 8",
      shortValue: "TK – SMP 8",
    },
    {
      label: "BIAYA",
      iconKey: "biaya",
      fullValue: "GRATIS / BEBAS BIAYA",
      shortValue: "GRATIS",
    },
    {
      label: "WAKTU",
      iconKey: "waktu",
      fullValue: `${HOURS.day} • ${HOURS.window}`,
      shortValue: "Sabtu 15-17",
    },
    {
      label: "LOKASI",
      iconKey: "lokasi",
      fullValue: UNIT.location,
      shortValue: UNIT.location,
    },
  ];

  return (
    <div className="pb-16 sm:pb-24">
      {/* 1. HERO SECTION (Emosi & Identitas) */}
      <section
        id="beranda"
        aria-labelledby="home-hero-headline"
        className="pt-10 sm:pt-16 lg:pt-20 pb-8 sm:pb-12"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <h1
            id="home-hero-headline"
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight tracking-tight"
          >
            {data.heroHeadline}
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-secondary-foreground mt-4 max-w-2xl leading-snug">
            {data.heroSubheadline}
          </p>
          <p className="text-base text-muted-foreground mt-3 max-w-xl leading-relaxed">
            Mendampingi setiap anak menemukan kegembiraan belajar dengan pendekatan Happy Learning.
          </p>
        </div>
      </section>

      {/* 2. SIAPA KAMI? (Narasi Misi — id="siapa-kami") */}
      <section
        id="siapa-kami"
        aria-labelledby="siapa-kami-heading"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-0 space-y-3 text-left scroll-mt-20"
      >
        <div className="flex items-center gap-2">
          <PMKIMarkIcon className="w-6 h-6 text-primary shrink-0" />
          <h2
            id="siapa-kami-heading"
            className="font-sans text-base sm:text-lg font-bold text-foreground tracking-tight"
          >
            Siapa Kami?
          </h2>
        </div>
        <p className="font-sans text-xs sm:text-sm text-secondary-foreground leading-relaxed">
          Rumah Belajar Griya Asih Lawang hadir untuk mewujudkan generasi unggul dengan kasih dan karakter luhur. Kami mendampingi peserta didik belajar dengan cara yang menyenangkan, kreatif, dan terbuka bagi semua—karena setiap anak memiliki potensi untuk bertumbuh ketika didampingi dengan ketulusan dan bimbingan yang tepat.
        </p>
      </section>

      {/* 3. QUICK FACTS STRIP (Compact Horizontal Grid 2x2) */}
      <section
        aria-label="Fakta praktis bimbingan belajar"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-6 sm:pb-8"
      >
        <div className="grid grid-cols-2 gap-2 mt-4 md:mt-5">
          {quickFactsData.map((fact) => (
            <div
              key={fact.label}
              className="flex items-center gap-2 p-2 bg-surface border border-border-subtle rounded-lg min-h-[48px]"
              aria-label={`${fact.label}: ${fact.fullValue}`}
            >
              {/* A. IKON KECIL (VALIDASI KEY EKSPLISIT) */}
              {(() => {
                const IconComp = ICON_MAP[fact.iconKey];
                if (!IconComp) return null;
                return (
                  <IconComp
                    className="w-4 h-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                );
              })()}

              {/* B. TEKS STACKED MICRO (LABEL ATAS, NILAI BAWAH) */}
              <div className="flex flex-col justify-center overflow-hidden w-full">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground leading-none mb-0.5 truncate">
                  {fact.label}
                </span>
                <span className="text-xs font-semibold text-foreground leading-tight whitespace-nowrap">
                  {fact.shortValue}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. SOROTAN KABAR TERKINI (Bukti Sosial Dinamis) */}
      <section
        aria-labelledby="sorotan-kabar-heading"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-4 text-left"
      >
        <div className="flex items-center justify-between">
          <h2
            id="sorotan-kabar-heading"
            className="font-sans text-base sm:text-lg font-bold text-foreground tracking-tight"
          >
            Kabar Terbaru
          </h2>
          <Link
            href="/kabar"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>Lihat semua kabar</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {latestArticle || latestAlbum ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Kolom Kiri (Dominan): Artikel Terbaru */}
            {latestArticle ? (
              <div className={latestAlbum ? "md:col-span-7" : "md:col-span-12"}>
                <Link
                  href={`/kabar/${latestArticle.slug}`}
                  className="group flex gap-3 p-3.5 rounded-card bg-surface border border-border hover:border-primary/40 transition-colors h-full"
                >
                  <div className="relative w-20 h-20 shrink-0 rounded-card overflow-hidden bg-surface-subtle border border-border-subtle">
                    <Image
                      src={latestArticle.coverSignedUrl}
                      alt={latestArticle.title}
                      fill
                      sizes="80px"
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="flex flex-col justify-between min-w-0 flex-1 space-y-1">
                    <div>
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                        {latestArticle.categoryLabel}
                      </span>
                      <h3 className="font-sans font-bold text-sm text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {latestArticle.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {latestArticle.excerpt}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {formatToIndonesianStandard(latestArticle.publishedDateFormatted)}
                    </span>
                  </div>
                </Link>
              </div>
            ) : null}

            {/* Kolom Kanan (Pendamping): Album Galeri */}
            {latestAlbum ? (
              <div className={latestArticle ? "md:col-span-5" : "md:col-span-12"}>
                <Link
                  href={latestAlbum.slug ? `/kabar/${latestAlbum.slug}` : "/kabar?tab=galeri"}
                  className="group flex flex-col justify-between p-3.5 rounded-card bg-surface border border-border hover:border-primary/40 transition-colors h-full space-y-2.5"
                >
                  <div className="relative aspect-video w-full rounded-card overflow-hidden bg-surface-subtle border border-border-subtle">
                    <Image
                      src={latestAlbum.signedReadUrl}
                      alt={latestAlbum.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                      {latestAlbum.title}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {latestAlbum.categoryLabel} • {formatToIndonesianStandard(latestAlbum.capturedDate)}
                    </p>
                  </div>
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          /* Graceful Empty State (CLS=0, Konsisten dengan nada komunitas) */
          <div className="p-6 rounded-card bg-surface border border-border-subtle text-center space-y-2">
            <p className="text-xs font-semibold text-foreground">
              Kabar pertama segera hadir.
            </p>
            <p className="text-xs text-muted-foreground">
              Dokumentasi kegiatan dan artikel bimbingan belajar akan ditampilkan di sini.
            </p>
          </div>
        )}
      </section>

      {/* 5. INTIP PROGRAM (Eksplorasi Kurikulum) */}
      <section
        aria-labelledby="intip-program-heading"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-4 text-left"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="type-eyebrow text-primary uppercase tracking-wider">
              Program Unggulan
            </p>
            <h2
              id="intip-program-heading"
              className="font-sans text-base sm:text-lg font-bold text-foreground tracking-tight"
            >
              Pendampingan belajar ramah anak
            </h2>
          </div>
          <Link
            href="/program"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span>Detail kurikulum</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="space-y-2.5">
          {topPrograms.map((program) => {
            const iconKey = getProgramIconKey(program.id);
            const ProgramIcon = ICON_MAP[iconKey] ?? ICON_MAP.program;

            return (
              <div
                key={program.id}
                className="flex items-center gap-3 p-3.5 rounded-card bg-surface border border-border hover:border-primary/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-control bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  {ProgramIcon && <ProgramIcon aria-hidden="true" className="w-4 h-4 shrink-0" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-sans font-medium text-sm text-foreground truncate">
                    {program.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {program.targetNote}
                  </p>
                </div>
                <Link
                  href="/program"
                  className="text-xs text-primary font-semibold hover:underline shrink-0 ml-2"
                >
                  Lihat
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. AJAKAN BERGABUNG (Final Conversion Bridge) */}
      <section
        aria-labelledby="cta-heading"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 py-12 sm:py-16"
      >
        <div className="space-y-2 max-w-xl mx-auto">
          <h2
            id="cta-heading"
            className="font-sans text-lg sm:text-xl font-bold text-foreground tracking-tight"
          >
            {data.ctaHeadline}
          </h2>
          <p className="font-sans text-xs sm:text-sm text-secondary-foreground leading-relaxed">
            Pendaftaran peserta didik baru terbuka bagi jenjang TK hingga SMP Kelas 8. Mari bergabung bersama keluarga besar Rumah Belajar Griya Asih.
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-2.5 pt-2">
          <Link
            href="/kontak?tab=siswa"
            className="w-full min-h-12 inline-flex items-center justify-center px-6 py-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm shadow-xs transition-colors duration-200 active:scale-[0.985] focus-ring"
          >
            Daftarkan anak sekarang
          </Link>
          <div>
            <Link
              href="/kontak"
              className="inline-flex items-center justify-center text-xs text-muted-foreground hover:text-primary transition-colors py-1.5 focus-ring rounded-control"
            >
              Ada pertanyaan? Chat pengurus →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
