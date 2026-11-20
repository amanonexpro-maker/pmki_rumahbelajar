import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";
import type { PublicPortalDataDTO } from "../types/public-types";

export interface PublicCuratedHomeProps {
  data: PublicPortalDataDTO;
}

/**
 * Curated Public Gateway Home Component (Fase 13c-2, 03 §7, §15, UI-UX §24, §31, 10 §4, §21).
 * Restructures `/` into a high-conversion, low-fatigue gateway:
 * - Editorial Hero with Sentence case typography & 4 horizontal snap-scroll metric pills.
 * - Dual primary/outline conversion CTAs with thumb-zone ergonomics.
 * - Contextual Next Session card linking to `/program#jadwal`.
 * - Swipeable 3-program highlights carousel with fixed dimensions (zero CLS).
 * - Verified community story preview with single authentic photograph & canonical philosophy quote.
 * - Restrained final conversion teaser linking to `/pendaftaran` & `/kontak`.
 */
export function PublicCuratedHome({ data }: PublicCuratedHomeProps) {
  // Top 3 Curated Programs for Highlights Carousel
  const topPrograms = data.programs.slice(0, 3);

  // Social Proof Photograph (server-side signed URL or verified fallback asset)
  const featuredPhotoUrl =
    data.galleryItems[0]?.signedReadUrl ?? "/images/gallery/griya_asih_4.jpg";

  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20">
      {/* 1. HERO SECTION (Revised Gateway Fold — 5-Second Comprehension Gate) */}
      <section
        id="beranda"
        aria-labelledby="home-hero-title"
        className="bg-surface pt-10 sm:pt-16 pb-12 sm:pb-16 border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-3xl space-y-5 text-left">
            {/* Service Location Orientation Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-surface-subtle border border-border text-foreground text-xs sm:text-sm font-medium">
              <Sparkles
                aria-hidden="true"
                className="w-4 h-4 text-warning shrink-0"
              />
              <span>Pilot Pelayanan Terpadu {data.organizationName}</span>
            </div>

            {/* Expressive Editorial Headline (Newsreader Display Typography — Sentence case per 10 §5A) */}
            <div className="space-y-3">
              <h1
                id="home-hero-title"
                className="type-display-xl text-foreground tracking-tight text-balance"
              >
                Ayo belajar dan{" "}
                <span className="text-primary italic">tumbuh bersama.</span>
              </h1>

              <p className="font-display text-lg sm:text-xl font-medium text-foreground text-balance">
                Rumah belajar inklusif untuk anak usia TK hingga SMP di Lawang.{" "}
                <span className="text-secondary-foreground font-normal">
                  Mendampingi setiap anak menemukan kegembiraan belajar dengan pendekatan Happy Learning.
                </span>
              </p>
            </div>

            {/* METRIC PILLS ROW (Horizontal Scroll Snap — Touch Friendly) */}
            <div
              aria-label="Statistik kunci pelayanan"
              className="flex items-center gap-2.5 overflow-x-auto snap-x scrollbar-none py-1 -mx-4 px-4 sm:mx-0 sm:px-0"
            >
              <div className="inline-flex shrink-0 snap-start items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface-subtle border border-border text-xs font-medium text-foreground">
                <Users aria-hidden="true" className="w-3.5 h-3.5 text-primary" />
                <span>80+ Peserta Didik</span>
              </div>
              <div className="inline-flex shrink-0 snap-start items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface-subtle border border-border text-xs font-medium text-foreground">
                <HeartHandshake aria-hidden="true" className="w-3.5 h-3.5 text-primary" />
                <span>13 Pengajar Relawan</span>
              </div>
              <div className="inline-flex shrink-0 snap-start items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface-subtle border border-border text-xs font-medium text-foreground">
                <GraduationCap aria-hidden="true" className="w-3.5 h-3.5 text-primary" />
                <span>TK – SMP Kelas 8</span>
              </div>
              <div className="inline-flex shrink-0 snap-start items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface-subtle border border-border text-xs font-medium text-foreground">
                <Calendar aria-hidden="true" className="w-3.5 h-3.5 text-primary" />
                <span>Setiap Sabtu</span>
              </div>
            </div>

            {/* DUAL CTA BLOCK (Thumb-Zone Friendly: Full-width on mobile, inline on desktop) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                href="/pendaftaran"
                className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 px-7 py-3.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm shadow-xs transition-colors active:scale-[0.985] focus-ring"
              >
                <span>Daftar peserta didik baru</span>
                <ArrowRight aria-hidden="true" className="w-4 h-4" />
              </Link>

              <Link
                href="/program"
                className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 px-6 py-3.5 rounded-control bg-surface hover:bg-surface-subtle text-foreground font-medium text-sm border border-border shadow-xs transition-colors active:scale-[0.985] focus-ring"
              >
                <BookOpen aria-hidden="true" className="w-4 h-4 text-primary" />
                <span>Lihat program belajar</span>
              </Link>
            </div>
          </div>

          {/* 2. NEXT SESSION CARD (Contextual Saturday Info) */}
          <div className="rounded-card bg-surface-subtle border border-border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-pill bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Calendar aria-hidden="true" className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-foreground text-sm sm:text-base">
                  Sesi bimbingan belajar terdekat
                </p>
                <div className="flex flex-wrap items-center gap-2 text-secondary-foreground">
                  <span className="flex items-center gap-1">
                    <Clock aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Setiap hari {data.scheduleDay.toLowerCase()} • {data.scheduleHours}</span>
                  </span>
                  <span aria-hidden="true">•</span>
                  <span className="flex items-center gap-1">
                    <MapPin aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>RAAL Griya Asih Lawang</span>
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/program#jadwal"
              className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
            >
              <span>Lihat jadwal lengkap</span>
              <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. PROGRAM HIGHLIGHTS CAROUSEL (Swipeable Horizontal Strip — Zero CLS) */}
      <section aria-labelledby="highlights-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="type-eyebrow text-primary uppercase tracking-wider">
              Program Unggulan
            </p>
            <h2
              id="highlights-heading"
              className="type-display text-foreground tracking-tight"
            >
              Pendampingan belajar ramah anak
            </h2>
            <p className="text-xs sm:text-sm text-secondary-foreground max-w-2xl">
              Tiga pilar kegiatan belajar utama setiap Sabtu dengan pendampingan personal dari pengajar relawan.
            </p>
          </div>

          <Link
            href="/program"
            className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
          >
            <span>Lihat semua program &amp; kurikulum</span>
            <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Carousel Cards: Swipeable on mobile (snap-x), 3 columns on tablet/desktop */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {topPrograms.map((program) => (
            <div
              key={program.id}
              className="w-[280px] sm:w-[320px] shrink-0 snap-start p-5 rounded-card bg-surface border border-border shadow-xs flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-pill bg-primary-soft text-primary text-[11px] font-semibold">
                    Program {program.number}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[150px]">
                    {program.targetNote}
                  </span>
                </div>

                <h3 className="text-base font-bold text-foreground leading-snug">
                  {program.title}
                </h3>

                <p className="type-caption text-secondary-foreground leading-relaxed line-clamp-3">
                  {program.description}
                </p>
              </div>

              <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
                <span className="text-secondary-foreground font-medium truncate max-w-[200px]">
                  {program.highlights[0] ?? program.targetNote}
                </span>
                <Link
                  href="/program"
                  className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5 shrink-0"
                >
                  <span>Detail</span>
                  <ArrowRight aria-hidden="true" className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. COMMUNITY STORY PREVIEW (Social Proof — Single Authentic Photo & Canonical Quote) */}
      <section aria-labelledby="story-preview-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-card bg-surface border border-border p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Stable Aspect Photograph (Fixed 4:3 ratio to avoid CLS) */}
            <div className="lg:col-span-6">
              <figure className="rounded-card overflow-hidden border border-border bg-surface-subtle">
                <div className="relative aspect-4/3 w-full bg-surface-subtle">
                  <Image
                    src={featuredPhotoUrl}
                    alt="Suasana kegiatan belajar tatap muka di Rumah Belajar Griya Asih Lawang"
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    className="object-cover object-center"
                    loading="lazy"
                  />
                </div>
                <figcaption className="p-3 bg-surface border-t border-border text-[11px] text-secondary-foreground">
                  Foto dokumentasi kegiatan belajar bersama peserta didik dan pengajar relawan di Lawang.
                </figcaption>
              </figure>
            </div>

            {/* Right: Narrative Quote & Authentic Mission Value */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <div className="space-y-1">
                <p className="type-eyebrow text-primary uppercase tracking-wider">
                  Nilai Pelayanan
                </p>
                <h2
                  id="story-preview-heading"
                  className="type-display text-foreground tracking-tight"
                >
                  Setiap anak berhak bertumbuh dengan percaya diri
                </h2>
              </div>

              {/* Canonical Quote Ribbon */}
              <blockquote className="p-4 rounded-control bg-surface-subtle border-l-4 border-primary text-xs sm:text-sm text-foreground italic">
                {data.philosophyQuote}
                <footer className="mt-1 text-[11px] text-muted-foreground not-italic font-medium">
                  — Filosofi Pendampingan Rumah Belajar Griya Asih
                </footer>
              </blockquote>

              <p className="type-body-sm text-secondary-foreground leading-relaxed">
                Seluruh kegiatan bimbingan belajar dikelola secara sukarela oleh para pengajar relawan
                untuk membantu keluarga pekerja di kawasan Kalirejo dan Lawang, Kabupaten Malang.
              </p>

              <div className="pt-2">
                <Link
                  href="/gallery"
                  className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <span>Lihat dokumentasi &amp; cerita komunitas</span>
                  <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TEASER CONVERSION CTA (Restrained Closing Section) */}
      <section className="bg-surface-subtle border-t border-border py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="type-display text-foreground tracking-tight">
              {data.ctaHeadline}
            </h2>
            <p className="type-body text-secondary-foreground max-w-xl mx-auto">
              Pendaftaran peserta didik baru terbuka bagi jenjang TK hingga SMP Kelas 8. Mari bergabung bersama keluarga besar Rumah Belajar Griya Asih.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/pendaftaran"
              className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 px-7 py-3.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm shadow-xs transition-colors active:scale-[0.985] focus-ring"
            >
              <span>Daftar peserta didik baru</span>
              <ArrowRight aria-hidden="true" className="w-4 h-4" />
            </Link>

            <Link
              href="/kontak"
              className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 px-6 py-3.5 rounded-control bg-surface hover:bg-surface-subtle text-foreground font-semibold text-sm border border-border shadow-xs transition-colors active:scale-[0.985] focus-ring"
            >
              <MessageCircle aria-hidden="true" className="w-4 h-4 text-primary" />
              <span>Hubungi pengurus via WhatsApp</span>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            Sekretariat &amp; Tempat Belajar: {data.locationFull}
          </p>
        </div>
      </section>
    </div>
  );
}
