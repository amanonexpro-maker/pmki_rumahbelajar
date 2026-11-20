"use client";

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
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { PublicPortalDataDTO } from "../types/public-types";

export interface PublicCuratedHomeProps {
  data: PublicPortalDataDTO;
}

/**
 * Curated Public Gateway Home Component (Fase 13c-2, Mobile Refinement).
 * - Restrained typography scale on mobile (24-28px, line-height 1.2-1.3).
 * - Concise, non-redundant schedule card with explicit 14.45 WIB arrival guidance.
 * - Swipeable 3-program carousel with 18% peek preview & interactive dot indicators.
 * - Single authentic classroom photograph (4:3 zero CLS) & canonical philosophy quote.
 */
export function PublicCuratedHome({ data }: PublicCuratedHomeProps) {
  // Top 3 Curated Programs for Highlights Carousel
  const topPrograms = data.programs.slice(0, 3);

  // Social Proof Photograph (server-side signed URL or verified fallback asset)
  const featuredPhotoUrl =
    data.galleryItems[0]?.signedReadUrl ?? "/images/gallery/griya_asih_4.jpg";

  // Carousel scroll position tracking for dot indicators
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [activeProgramIndex, setActiveProgramIndex] = React.useState(0);

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const card = el.firstElementChild as HTMLElement | null;
    const cardWidth = card?.offsetWidth ?? 280;
    const index = Math.round(scrollLeft / (cardWidth + 16));
    setActiveProgramIndex(
      Math.min(Math.max(index, 0), topPrograms.length - 1)
    );
  };

  const scrollToProgram = (index: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const cardWidth = card?.offsetWidth ?? 280;
    el.scrollTo({ left: index * (cardWidth + 16), behavior: "smooth" });
    setActiveProgramIndex(index);
  };

  return (
    <div className="space-y-10 sm:space-y-14 lg:space-y-18">
      {/* 1. HERO SECTION (Revised Mobile-First Gateway Fold) */}
      <section
        id="beranda"
        aria-labelledby="home-hero-title"
        className="bg-surface pt-8 sm:pt-14 pb-10 sm:pb-14 border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          <div className="max-w-3xl space-y-4 sm:space-y-5 text-left">
            {/* Expressive Editorial Headline (Mobile Scale: 26-28px, line-height 1.25) */}
            <div className="space-y-2.5">
              <h1
                id="home-hero-title"
                className="font-display text-[26px] leading-[1.22] sm:text-4xl sm:leading-[1.18] lg:text-5xl lg:leading-[1.12] font-bold text-foreground tracking-tight text-balance"
              >
                Ayo belajar dan{" "}
                <span className="text-primary italic">tumbuh bersama.</span>
              </h1>

              <p className="text-sm sm:text-base leading-relaxed text-secondary-foreground font-normal text-balance">
                Rumah belajar inklusif untuk anak usia TK hingga SMP di Lawang. Mendampingi setiap anak menemukan kegembiraan belajar dengan pendekatan Happy Learning.
              </p>
            </div>

            {/* METRIC PILLS ROW (Horizontal Scroll Snap — Touch Friendly) */}
            <div
              aria-label="Statistik kunci pelayanan"
              className="flex items-center gap-2 overflow-x-auto snap-x scrollbar-none py-1 -mx-4 px-4 sm:mx-0 sm:px-0"
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

            {/* Secondary Action: Explore Programs (Subtle Ghost) */}
            <div className="pt-1">
              <Link
                href="/program"
                className="inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 rounded-control bg-surface hover:bg-surface-subtle text-foreground font-medium text-xs sm:text-sm border border-border shadow-xs transition-colors active:scale-[0.985] focus-ring"
              >
                <BookOpen aria-hidden="true" className="w-4 h-4 text-primary" />
                <span>Lihat program belajar</span>
                <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* 2. NEXT SESSION CARD (Concise Non-Redundant Schedule with Arrival Guidance) */}
          <div className="rounded-card bg-surface-subtle border border-border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-pill bg-primary-soft text-primary flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Calendar aria-hidden="true" className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-left">
                <p className="font-bold text-foreground text-sm sm:text-base">
                  Sesi bimbingan belajar terdekat
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-secondary-foreground">
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <Clock aria-hidden="true" className="w-3.5 h-3.5 text-primary" />
                    <span>Setiap Sabtu • {data.scheduleHours}</span>
                  </span>
                  <span aria-hidden="true" className="text-muted-foreground">•</span>
                  <span className="flex items-center gap-1">
                    <MapPin aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>RAAL Griya Asih Lawang</span>
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Hadir pukul 14.45 WIB untuk persiapan salam santun dan presensi.
                </p>
              </div>
            </div>

            <Link
              href="/program#jadwal"
              className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0 self-start sm:self-center"
            >
              <span>Lihat jadwal lengkap</span>
              <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. PROGRAM HIGHLIGHTS CAROUSEL (18% Peek Preview, Swipeable, Zero CLS) */}
      <section aria-labelledby="highlights-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-left">
          <div className="space-y-1">
            <p className="type-eyebrow text-primary uppercase tracking-wider">
              Program Unggulan
            </p>
            <h2
              id="highlights-heading"
              className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-normal leading-tight"
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

        {/* Carousel Swipe Area with 18% Peek Preview on Mobile */}
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-3 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {topPrograms.map((program) => (
            <div
              key={program.id}
              className="w-[82vw] max-w-[290px] sm:w-[320px] shrink-0 snap-start p-5 rounded-card bg-surface border border-border shadow-xs flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors text-left"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-pill bg-primary-soft text-primary text-[11px] font-semibold">
                    Program {program.number}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[140px]">
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
                <span className="text-secondary-foreground font-medium truncate max-w-[190px]">
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

        {/* Affordance Indicators: 3 Dots + Mobile Swipe Hint */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <div className="flex items-center gap-1.5" aria-label="Indikator program">
            {topPrograms.map((program, idx) => (
              <button
                key={program.id}
                type="button"
                onClick={() => scrollToProgram(idx)}
                aria-label={`Pilih program ${idx + 1}: ${program.title}`}
                className={cn(
                  "h-2 rounded-full transition-all duration-200 focus-ring cursor-pointer",
                  activeProgramIndex === idx
                    ? "w-6 bg-primary"
                    : "w-2 bg-border hover:bg-muted-foreground/40"
                )}
              />
            ))}
          </div>

          <span className="text-[11px] text-muted-foreground sm:hidden font-medium">
            Geser untuk program lainnya →
          </span>
        </div>
      </section>

      {/* 4. COMMUNITY STORY PREVIEW (Social Proof — Single Authentic Photo & Canonical Quote) */}
      <section aria-labelledby="story-preview-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-card bg-surface border border-border p-5 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
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
                <figcaption className="p-3 bg-surface border-t border-border text-[11px] text-secondary-foreground text-left">
                  Foto dokumentasi kegiatan belajar bersama peserta didik dan pengajar relawan di Lawang.
                </figcaption>
              </figure>
            </div>

            {/* Right: Narrative Quote & Authentic Mission Value */}
            <div className="lg:col-span-6 space-y-4 text-left">
              <div className="space-y-1">
                <p className="type-eyebrow text-primary uppercase tracking-wider">
                  Nilai Pelayanan
                </p>
                <h2
                  id="story-preview-heading"
                  className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-normal leading-tight"
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

              <div className="pt-1">
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
      <section className="bg-surface-subtle border-t border-border py-10 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5 sm:space-y-6">
          <div className="space-y-2">
            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-normal leading-tight">
              {data.ctaHeadline}
            </h2>
            <p className="type-body text-secondary-foreground max-w-xl mx-auto">
              Pendaftaran peserta didik baru terbuka bagi jenjang TK hingga SMP Kelas 8. Mari bergabung bersama keluarga besar Rumah Belajar Griya Asih.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <Link
              href="/pendaftaran"
              className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 px-7 py-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm shadow-xs transition-colors active:scale-[0.985] focus-ring"
            >
              <span>Daftar peserta didik baru</span>
              <ArrowRight aria-hidden="true" className="w-4 h-4" />
            </Link>

            <Link
              href="/kontak"
              className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 px-6 py-3 rounded-control bg-surface hover:bg-surface-subtle text-foreground font-semibold text-sm border border-border shadow-xs transition-colors active:scale-[0.985] focus-ring"
            >
              <MessageCircle aria-hidden="true" className="w-4 h-4 text-primary" />
              <span>Hubungi pengurus via WhatsApp</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
