/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Heart,
  Target,
  Compass,
  CheckCircle,
  Factory,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { Icon } from '../ui/index.ts';

/**
 * UI-12 About & Purpose Section
 * Editorial community narrative: Vision, Inclusive Mission, and Local Context of Kalirejo & Lawang.
 * Emphasizes human purpose and community collaboration over generic card grids.
 */
export const AboutSection: React.FC = () => {
  return (
    <section
      id="tentang"
      aria-labelledby="about-section-heading"
      className="scroll-mt-32 py-16 sm:py-24 bg-background border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
        {/* Section 1: Editorial Vision & Inclusivity Statement */}
        <div className="max-w-3xl space-y-4">
          <div className="type-eyebrow text-primary uppercase tracking-wider">
            Tentang Rumah Belajar Griya Asih
          </div>
          <h2
            id="about-section-heading"
            className="type-page-title text-foreground tracking-tight"
          >
            Mewujudkan Generasi Unggul dengan Kasih &amp; Karakter Luhur
          </h2>
          <p className="type-body text-secondary-foreground leading-relaxed">
            Hadir sebagai ruang belajar yang mendampingi anak-anak belajar dengan cara yang menyenangkan,
            kreatif, dan terbuka bagi semua. Kami percaya bahwa setiap anak memiliki potensi untuk menjadi hebat
            ketika didampingi dengan ketulusan dan bimbingan yang tepat.
          </p>
        </div>

        {/* Section 2: Asymmetric Two-Column Vision & Principles */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Visi Rumah Belajar */}
          <div className="lg:col-span-6 space-y-6 rounded-card bg-surface border border-border p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-control bg-primary-soft text-primary flex items-center justify-center">
                <Icon icon={Compass} size="sm" />
              </div>
              <div>
                <h3 className="type-title text-foreground">
                  Visi Rumah Belajar
                </h3>
                <p className="type-caption text-secondary-foreground">
                  Arah pelayanan pendidikan jangka panjang
                </p>
              </div>
            </div>

            <ul className="space-y-4 type-body-sm text-secondary-foreground">
              <li className="flex items-start gap-3">
                <Icon icon={CheckCircle} size="sm" className="text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Rumah Belajar Bersama:</strong> Menjadi wadah belajar bersama
                  bagi anak-anak yang memiliki minat dan mental belajar yang tangguh untuk maju.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Icon icon={CheckCircle} size="sm" className="text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Budaya Happy Learning:</strong> Mencerdaskan anak bangsa dengan
                  membiasakan rasa senang belajar sehingga anak tumbuh percaya diri dan penuh rasa ingin tahu.
                </span>
              </li>
            </ul>
          </div>

          {/* Right: Tujuan Pelaksanaan & Komitmen Inklusif */}
          <div className="lg:col-span-6 space-y-6 rounded-card bg-surface border border-border p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-control bg-warning-soft text-warning flex items-center justify-center">
                <Icon icon={Target} size="sm" />
              </div>
              <div>
                <h3 className="type-title text-foreground">
                  Tujuan &amp; Nilai Inklusif
                </h3>
                <p className="type-caption text-secondary-foreground">
                  Pelayanan terbuka tanpa sekat
                </p>
              </div>
            </div>

            <p className="type-body-sm text-secondary-foreground leading-relaxed">
              Sebagai wadah pengembangan pengetahuan dasar dan pembentukan mental kepribadian dengan{' '}
              <strong className="text-foreground">
                komitmen total untuk melayani tanpa memandang suku, agama, dan latar belakang budaya
              </strong>
              , serta melatih kemampuan belajar mandiri peserta didik demi masa depan yang lebih cerah.
            </p>

            <div className="p-3.5 rounded-control bg-surface-subtle border border-border text-xs text-foreground font-medium flex items-center gap-2.5">
              <Icon icon={Heart} size="sm" className="text-danger shrink-0" />
              <span>
                Prinsip Inklusif: Terbuka untuk seluruh anak di lingkungan masyarakat Kalirejo &amp; Lawang.
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Social Reality & Local Background (Dignified Narrative) */}
        <div className="rounded-card bg-surface border border-border p-6 sm:p-10 lg:p-12 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-surface-subtle border border-border text-xs font-semibold text-foreground">
                <Icon icon={Factory} size="xs" className="text-primary" />
                <span>Kondisi Sosial Wilayah</span>
              </div>

              <h3 className="type-h2 text-foreground tracking-tight">
                Latar Belakang Pelayanan di Wilayah Lawang, Jawa Timur
              </h3>

              <p className="type-body-sm text-secondary-foreground leading-relaxed">
                Rumah Belajar Griya Asih berlokasi di perbatasan antara dua kelurahan, yaitu{' '}
                <strong className="text-foreground">Kelurahan Kalirejo</strong> dan{' '}
                <strong className="text-foreground">Kelurahan Lawang</strong>, Kabupaten Malang.
                Kawasan ini merupakan area industri dan pabrik di mana mayoritas warga berada pada usia pekerja produktif
                dengan ritme kerja yang padat.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-secondary-foreground">
                <div className="flex items-start gap-2.5 p-3 rounded-control bg-surface-subtle border border-border-subtle">
                  <span className="text-primary font-bold">•</span>
                  <span>Anak asuh di RAAL Griya Asih yang memerlukan bimbingan belajar terarah.</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-control bg-surface-subtle border border-border-subtle">
                  <span className="text-primary font-bold">•</span>
                  <span>Kebutuhan bimbingan tambahan bagi keluarga berpenghasilan terbatas tanpa pungutan biaya.</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-control bg-surface-subtle border border-border-subtle">
                  <span className="text-primary font-bold">•</span>
                  <span>Pendampingan bagi anak yang orang tuanya memiliki jam kerja pabrik yang padat.</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-control bg-surface-subtle border border-border-subtle">
                  <span className="text-primary font-bold">•</span>
                  <span>Saat ini 80+ anak terdaftar aktif dari potensi 125 anak di sekitar lingkungan pelayanan.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-control overflow-hidden border border-border shadow-xs bg-surface-subtle">
                <img
                  src="/images/gallery/griya_asih_9.jpg"
                  alt="Anak-anak dan pengurus Rumah Belajar Griya Asih berfoto bersama"
                  className="w-full h-64 sm:h-72 object-cover object-top hover:scale-[1.02] transition-transform duration-500"
                  loading="lazy"
                />
                <div className="p-3 bg-surface border-t border-border text-center text-xs text-secondary-foreground">
                  Foto bersama peserta didik dan pengurus dengan seragam Griya Asih Lawang.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: 13 Tenaga Guru Relawan & Pendidik Dedikatif */}
        <div className="rounded-card bg-surface border border-border p-6 sm:p-8 lg:p-10 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-border">
            <div>
              <div className="type-eyebrow text-primary uppercase tracking-wider mb-1">
                Kekuatan Relawan &amp; Pendidik
              </div>
              <h3 className="type-h3 text-foreground">
                Didukung oleh 13 Tenaga Pengajar Berpengalaman
              </h3>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary-soft rounded-pill border border-primary/20 text-primary text-xs font-semibold">
              <Icon icon={GraduationCap} size="xs" />
              <span>Kolaborasi Guru Sekolah Katholik &amp; Sekolah Negeri Lawang</span>
            </div>
          </div>

          <p className="type-body-sm text-secondary-foreground leading-relaxed">
            Para pengajar Rumah Belajar Griya Asih berdomisili di seputar Kelurahan Kalirejo dan Kelurahan Lawang.
            Mereka berasal dari guru-guru sekolah Katholik dan guru sekolah negeri di Lawang yang dengan sukarela
            mempersembahkan waktu, keahlian, dan kasih demi masa depan anak-anak.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 text-xs">
            <div className="p-3 rounded-control bg-surface-subtle border border-border space-y-0.5">
              <p className="font-semibold text-foreground">Ms. Evi S.Pd</p>
              <p className="text-secondary-foreground">Sekolah Katholik Lawang</p>
              <span className="text-[11px] text-primary font-medium block">Koordinator Pelayanan</span>
            </div>
            <div className="p-3 rounded-control bg-surface-subtle border border-border space-y-0.5">
              <p className="font-semibold text-foreground">Ms. Lilian</p>
              <p className="text-secondary-foreground">Pengurus RAAL Lawang</p>
              <span className="text-[11px] text-primary font-medium block">Humas &amp; Pelayanan</span>
            </div>
            <div className="p-3 rounded-control bg-surface-subtle border border-border space-y-0.5">
              <p className="font-semibold text-foreground">Budi Santoso S.Pd</p>
              <p className="text-secondary-foreground">Guru SDN Lawang 1</p>
              <span className="text-[11px] text-muted-foreground block">Matematika Dasar</span>
            </div>
            <div className="p-3 rounded-control bg-surface-subtle border border-border space-y-0.5">
              <p className="font-semibold text-foreground">Theresia Maria S.Pd</p>
              <p className="text-secondary-foreground">Sekolah Katholik Lawang</p>
              <span className="text-[11px] text-muted-foreground block">Kelas Khusus Membaca</span>
            </div>
            <div className="p-3 rounded-control bg-surface-subtle border border-border space-y-0.5">
              <p className="font-semibold text-foreground">Paulus Hendra S.Si</p>
              <p className="text-secondary-foreground">Guru SMPN Lawang</p>
              <span className="text-[11px] text-muted-foreground block">Matematika SMP 7-8</span>
            </div>
            <div className="p-3 rounded-control bg-surface-subtle border border-border space-y-0.5">
              <p className="font-semibold text-foreground">Clara Novita S.Pd</p>
              <p className="text-secondary-foreground">Sekolah Katholik Lawang</p>
              <span className="text-[11px] text-muted-foreground block">Bahasa Inggris Percakapan</span>
            </div>
            <div className="p-3 rounded-control bg-surface-subtle border border-border space-y-0.5">
              <p className="font-semibold text-foreground">Agustinus Wibowo</p>
              <p className="text-secondary-foreground">Guru SDN Kalirejo</p>
              <span className="text-[11px] text-muted-foreground block">Bimbingan SD Kelas 1-3</span>
            </div>
            <div className="p-3 rounded-control bg-surface-subtle border border-border space-y-0.5">
              <p className="font-semibold text-foreground">Antonius Kevin S.Pd</p>
              <p className="text-secondary-foreground">Sekolah Katholik Lawang</p>
              <span className="text-[11px] text-muted-foreground block">Persiapan Ujian EBTA</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
