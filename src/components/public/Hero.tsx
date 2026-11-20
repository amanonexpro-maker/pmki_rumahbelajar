/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowRight,
  Calendar,
  Sparkles,
  GraduationCap,
  Clock,
  MapPin,
} from 'lucide-react';
import { Icon } from '../ui/index.ts';

interface HeroProps {
  onRegisterClick: () => void;
  onExplorePrograms: () => void;
}

/**
 * UI-12 Signature Public Hero Experience
 * Expressive, warm, human-centered educational welcome for Rumah Belajar Griya Asih.
 * Combines editorial typography, authentic classroom photography, and welcoming actions.
 */
export const Hero: React.FC<HeroProps> = ({
  onRegisterClick,
  onExplorePrograms,
}) => {
  return (
    <section
      id="beranda"
      aria-labelledby="hero-main-title"
      className="scroll-mt-32 relative overflow-hidden bg-surface pt-10 pb-16 sm:pt-14 sm:pb-24 lg:pt-20 lg:pb-32 border-b border-border"
    >
      {/* Warm Ambient Radial Backdrop Motifs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-pill bg-primary-soft/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -right-24 w-80 h-80 rounded-pill bg-warning-soft/70 blur-3xl"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Expressive Headline & Community Welcome */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Service Location Orientation Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-primary-soft border border-primary/20 text-primary text-xs sm:text-sm font-semibold tracking-wide">
              <Icon icon={Sparkles} size="xs" className="text-warning shrink-0" />
              <span>Pilot Pelayanan Terpadu PMKI Mupel Jawa Timur</span>
            </div>

            {/* Expressive Editorial Headline */}
            <div className="space-y-3">
              <h1
                id="hero-main-title"
                className="type-display text-foreground tracking-tight"
              >
                Ayo Belajar &amp; <br />
                <span className="text-primary italic font-serif">
                  Tumbuh Bersama!
                </span>
              </h1>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-warning font-semibold text-base sm:text-lg">
                <span>"Dare to be Great"</span>
                <span className="text-muted-foreground" aria-hidden="true">•</span>
                <span className="text-secondary-foreground font-medium">
                  Berani Menjadi Unggul
                </span>
              </div>
            </div>

            {/* Human-Centered Purpose Sentence */}
            <p className="type-body text-secondary-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Selamat datang di <strong className="text-foreground">Rumah Belajar Griya Asih Lawang</strong>. 
              Ruang belajar yang ramah dan inklusif untuk mendampingi anak-anak menemukan kegembiraan belajar, 
              mengembangkan nalar dan karakter budi pekerti, serta bertumbuh percaya diri melalui pendekatan{' '}
              <span className="text-primary font-semibold">Happy Learning</span>.
            </p>

            {/* Editorial Quote Ribbon */}
            <blockquote className="p-4 rounded-control bg-surface-subtle border-l-4 border-primary text-xs sm:text-sm text-foreground italic max-w-xl mx-auto lg:mx-0">
              ”Belajar itu bukan tentang menjadi sempurna, tetapi tentang menjadi lebih baik setiap hari.”
            </blockquote>

            {/* Welcoming Primary & Secondary Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                type="button"
                onClick={onRegisterClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-base shadow-xs transition-all active:scale-[0.985] focus-ring cursor-pointer"
              >
                <span>Daftar Siswa Baru</span>
                <Icon icon={ArrowRight} size="sm" />
              </button>

              <button
                type="button"
                onClick={onExplorePrograms}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-control bg-surface hover:bg-surface-subtle text-foreground font-medium text-base border border-border shadow-xs transition-all active:scale-[0.985] focus-ring cursor-pointer"
              >
                <Icon icon={GraduationCap} size="sm" className="text-primary" />
                <span>Pilihan Program &amp; Jadwal</span>
              </button>
            </div>

            {/* Authentic Key Operational Indicators (No Manufactured Numbers) */}
            <div className="pt-8 border-t border-border grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-center">
              <div className="space-y-0.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">
                  80+
                </div>
                <div className="text-xs text-secondary-foreground font-medium">
                  Siswa Terdaftar
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-primary tabular-nums">
                  13
                </div>
                <div className="text-xs text-secondary-foreground font-medium">
                  Tenaga Guru Relawan
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-warning tabular-nums">
                  TK–SMP 8
                </div>
                <div className="text-xs text-secondary-foreground font-medium">
                  Jenjang Pendidikan
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Photographic Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none space-y-4">
              {/* Primary Authentic Classroom Photo */}
              <div className="relative rounded-card overflow-hidden border border-border bg-surface-subtle shadow-xs">
                <img
                  src="/images/gallery/griya_asih_4.jpg"
                  alt="Suasana kegiatan belajar interaktif di Rumah Belajar Griya Asih"
                  className="w-full h-72 sm:h-80 object-cover object-top hover:scale-[1.02] transition-transform duration-500"
                  loading="eager"
                />
                <div className="p-4 bg-surface border-t border-border space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-2 py-0.5 rounded-pill bg-primary-soft text-primary text-[11px] font-semibold">
                      Suasana Belajar Ceria
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Tatap Muka &amp; Meja Mandiri
                    </span>
                  </div>
                  <p className="type-caption text-secondary-foreground leading-relaxed">
                    Pendampingan belajar penuh kasih dengan meja lipat individual, 
                    membantu setiap anak fokus memahami materi pelajarannya.
                  </p>
                </div>
              </div>

              {/* Secondary Context Strip: Schedule & Location Anchor */}
              <div className="rounded-control bg-surface-subtle border border-border p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-pill bg-primary-soft text-primary flex items-center justify-center shrink-0">
                    <Icon icon={Calendar} size="xs" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      Setiap Hari Sabtu
                    </p>
                    <p className="text-[11px] text-secondary-foreground flex items-center gap-1">
                      <Icon icon={Clock} size="xs" className="text-muted-foreground" />
                      <span>15.00 – 17.15 WIB</span>
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-secondary-foreground border-l border-border pl-3">
                  <Icon icon={MapPin} size="xs" className="text-primary shrink-0" />
                  <span className="truncate">RAAL Griya Asih Lawang</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
