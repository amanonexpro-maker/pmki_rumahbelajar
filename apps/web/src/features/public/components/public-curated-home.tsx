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
 * PublicCuratedHome (Fase 14 Step 5: Gateway Komunitas & Storytelling Flow).
 * Server Component yang merender alur naratif 6 section berurutan:
 * 1. Hero: Emosi & Identitas (Editorial Newsreader serif, subjudul hangat, tanpa tombol CTA).
 * 2. Siapa Kami: Narasi misi kanonikal repo (id="siapa-kami" deep link contract).
 * 3. Quick Facts: Strip geser horizontal fakta praktis berakar config & service.
 * 4. Sorotan Kabar: Bukti sosial dinamis (artikel dominan + album pendamping / fallback).
 * 5. Intip Program: Eksplorasi kurikulum 3 program utama dengan ikon semantik.
 * 6. Ajakan Bergabung: Jembatan konversi akhir (CTA primer ke /kontak?tab=siswa, secondary ke /kontak).
 */
export function PublicCuratedHome({ data }: PublicCuratedHomeProps) {
  const latestArticle = data.newsItems?.[0];
  const latestAlbum = data.galleryItems?.[0];
  const topPrograms = data.programs.slice(0, 3);

  const PesertaIcon = ICON_MAP.peserta;
  const BiayaIcon = ICON_MAP.biaya;
  const WaktuIcon = ICON_MAP.waktu;
  const LokasiIcon = ICON_MAP.lokasi;
  const InfoIcon = ICON_MAP.info;

  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20 pb-12 sm:pb-16">
      {/* 1. HERO SECTION (Emosi & Identitas) */}
      <section
        id="beranda"
        aria-labelledby="home-hero-headline"
        className="pt-10 sm:pt-16 lg:pt-20 pb-6 sm:pb-8"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-left">
          <h1
            id="home-hero-headline"
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight"
          >
            {data.heroHeadline}
          </h1>
          <p className="font-sans text-base sm:text-lg text-secondary-foreground font-medium leading-snug">
            {data.heroSubheadline}
          </p>
          <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Mendampingi setiap anak menemukan kegembiraan belajar dengan pendekatan Happy Learning.
          </p>
        </div>
      </section>

      {/* 2. SIAPA KAMI? (Narasi Misi — id="siapa-kami") */}
      <section
        id="siapa-kami"
        aria-labelledby="siapa-kami-heading"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3 text-left scroll-mt-20"
      >
        <div className="flex items-center gap-2">
          {InfoIcon && <InfoIcon aria-hidden="true" className="w-4 h-4 text-primary shrink-0" />}
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

      {/* 3. QUICK FACTS STRIP (Fakta Praktis) */}
      <section
        aria-label="Fakta praktis bimbingan belajar"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="flex items-center gap-2 overflow-x-auto snap-x whitespace-nowrap scrollbar-none py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* Jenjang */}
          <div className="inline-flex shrink-0 snap-start items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface-subtle border border-border text-xs font-medium text-muted-foreground">
            {PesertaIcon && <PesertaIcon aria-hidden="true" className="w-3.5 h-3.5 text-primary shrink-0" />}
            <span className="text-foreground">{data.metrics?.educationLevelsValue ?? "TK – SMP Kelas 8"}</span>
          </div>

          {/* Biaya */}
          <div className="inline-flex shrink-0 snap-start items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface-subtle border border-border text-xs font-medium text-muted-foreground">
            {BiayaIcon && <BiayaIcon aria-hidden="true" className="w-3.5 h-3.5 text-primary shrink-0" />}
            <span className="text-foreground">Bebas biaya</span>
          </div>

          {/* Waktu */}
          <div className="inline-flex shrink-0 snap-start items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface-subtle border border-border text-xs font-medium text-muted-foreground">
            {WaktuIcon && <WaktuIcon aria-hidden="true" className="w-3.5 h-3.5 text-primary shrink-0" />}
            <span className="text-foreground">{HOURS.day} • {HOURS.window}</span>
          </div>

          {/* Lokasi */}
          <div className="inline-flex shrink-0 snap-start items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface-subtle border border-border text-xs font-medium text-muted-foreground">
            {LokasiIcon && <LokasiIcon aria-hidden="true" className="w-3.5 h-3.5 text-primary shrink-0" />}
            <span className="text-foreground">{UNIT.location}</span>
          </div>
        </div>
      </section>

      {/* 4. SOROTAN KABAR TERKINI (Bukti Sosial Dinamis) */}
      <section
        aria-labelledby="sorotan-kabar-heading"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-left"
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
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-left"
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
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 pt-4"
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
