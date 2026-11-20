import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Clock,
  GraduationCap,
  MapPin,
  Sparkles,
} from "lucide-react";
import type { PublicPortalDataDTO } from "../types/public-types";

export interface PublicHeroProps {
  data: PublicPortalDataDTO;
}

/**
 * UI-12 Signature Public Hero Experience (`03 §7, §13–19`, `UI-UX §6, §11, §14–18`, `10 §21`).
 * - Stop-scrolling Moment 1: Hero rhythm `96px` (`py-16 lg:py-24` / `--space-24`).
 * - Uses Display Typography (`Newsreader`, `type-display-xl`) exclusively for public storytelling.
 * - Strictly 70% Neutral / 20% Forest / 10% Accent palette — zero gradients, zero blur blobs, zero visual noise.
 * - 5-Second Comprehension Gate (Gate 5): Who we are, for whom, when/where, and primary CTA immediately clear.
 */
export function PublicHero({ data }: PublicHeroProps) {
  return (
    <section
      id="beranda"
      aria-labelledby="hero-main-title"
      className="scroll-mt-28 bg-surface py-16 lg:py-24 border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Expressive Editorial Headline & Community Welcome */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Service Location Orientation Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-surface-subtle border border-border text-foreground text-xs sm:text-sm font-medium">
              <Sparkles
                aria-hidden="true"
                className="w-4 h-4 text-warning shrink-0"
              />
              <span>Pilot Pelayanan Terpadu {data.organizationName}</span>
            </div>

            {/* Expressive Editorial Headline (Newsreader Display Typography) */}
            <div className="space-y-3">
              <h1
                id="hero-main-title"
                className="type-display-xl text-foreground tracking-tight"
              >
                Ayo belajar dan{" "}
                <span className="text-primary italic">tumbuh bersama.</span>
              </h1>

              <p className="font-display text-xl sm:text-2xl font-medium text-foreground">
                {data.heroSubheadline}{" "}
                <span className="text-secondary-foreground">
                  {data.missionHeadline}
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base pt-1">
                <span className="font-semibold text-warning">
                  {data.sloganEnglish}
                </span>
                <span className="text-muted-foreground" aria-hidden="true">
                  •
                </span>
                <span className="text-secondary-foreground font-medium">
                  {data.sloganIndonesian}
                </span>
              </div>
            </div>

            {/* Human-Centered Purpose Sentence */}
            <p className="type-body text-secondary-foreground max-w-2xl leading-relaxed">
              Selamat datang di{" "}
              <strong className="text-foreground">
                {data.serviceUnitName}
              </strong>
              . Ruang belajar komunitas yang ramah dan inklusif untuk
              mendampingi peserta didik jenjang TK hingga SMP Kelas 8 menemukan
              kegembiraan belajar, mengembangkan nalar dan karakter budi
              pekerti, serta bertumbuh percaya diri bersama para{" "}
              <strong className="text-foreground">pengajar relawan</strong>{" "}
              melalui pendekatan{" "}
              <span className="text-primary font-semibold">Happy Learning</span>
              .
            </p>

            {/* Editorial Quote Ribbon */}
            <blockquote className="p-4 rounded-control bg-surface-subtle border-l-4 border-primary text-xs sm:text-sm text-foreground italic max-w-xl">
              {data.philosophyQuote}
            </blockquote>

            {/* Welcoming Primary & Secondary Actions (Sentence case per 10 §5A, touch >= 44px) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link
                href="/pendaftaran"
                className="inline-flex min-h-12 items-center justify-center gap-2 px-7 py-3.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-base shadow-xs transition-colors active:scale-[0.985] focus-ring"
              >
                <span>Daftar peserta didik baru</span>
                <ArrowRight aria-hidden="true" className="w-4 h-4" />
              </Link>

              <Link
                href="#program"
                className="inline-flex min-h-12 items-center justify-center gap-2 px-6 py-3.5 rounded-control bg-surface hover:bg-surface-subtle text-foreground font-medium text-base border border-border shadow-xs transition-colors active:scale-[0.985] focus-ring"
              >
                <GraduationCap
                  aria-hidden="true"
                  className="w-5 h-5 text-primary"
                />
                <span>Lihat program dan jadwal</span>
              </Link>
            </div>

            {/* Authentic Community Indicators (Not KPI Cards — Clean Border Strip) */}
            <dl className="pt-8 border-t border-border grid grid-cols-3 gap-4 max-w-lg">
              <div className="space-y-0.5">
                <dt className="text-xs text-secondary-foreground font-medium">
                  {data.metrics.registeredStudentsLabel}
                </dt>
                <dd className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                  {data.metrics.registeredStudentsValue}
                </dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs text-secondary-foreground font-medium">
                  {data.metrics.volunteerTeachersLabel}
                </dt>
                <dd className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">
                  {data.metrics.volunteerTeachersValue}
                </dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs text-secondary-foreground font-medium">
                  {data.metrics.educationLevelsLabel}
                </dt>
                <dd className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                  {data.metrics.educationLevelsValue}
                </dd>
              </div>
            </dl>
          </div>

          {/* Right Column: Authentic Classroom Photographic Composition */}
          <div className="lg:col-span-5">
            <div className="mx-auto max-w-md lg:max-w-none space-y-4">
              <figure className="rounded-card overflow-hidden border border-border bg-surface-subtle">
                <div className="relative w-full h-72 sm:h-80 bg-surface-subtle">
                  <Image
                    src="/images/gallery/griya_asih_4.jpg"
                    alt="Suasana kegiatan belajar tatap muka bersama pengajar relawan di Rumah Belajar Griya Asih Lawang"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 480px"
                    className="object-cover object-top"
                  />
                </div>
                <figcaption className="p-4 bg-surface border-t border-border space-y-1 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-pill bg-primary-soft text-primary text-[11px] font-semibold">
                      Suasana belajar ceria
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Tatap muka &amp; meja lipat mandiri
                    </span>
                  </div>
                  <p className="type-caption text-secondary-foreground leading-relaxed">
                    Pendampingan belajar penuh kasih dengan meja lipat
                    individual, membantu setiap peserta didik fokus memahami
                    materi pelajarannya.
                  </p>
                </figcaption>
              </figure>

              {/* Secondary Context Strip: Saturday Schedule & RAAL Lawang Anchor */}
              <div className="rounded-control bg-surface-subtle border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-pill bg-primary-soft text-primary flex items-center justify-center shrink-0">
                    <Calendar aria-hidden="true" className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      {data.scheduleDay}
                    </p>
                    <p className="text-xs text-secondary-foreground flex items-center gap-1">
                      <Clock
                        aria-hidden="true"
                        className="w-3.5 h-3.5 text-muted-foreground"
                      />
                      <span>{data.scheduleHours}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-secondary-foreground sm:border-l sm:border-border sm:pl-3">
                  <MapPin
                    aria-hidden="true"
                    className="w-4 h-4 text-primary shrink-0"
                  />
                  <span>RAAL Griya Asih Lawang</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

