/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calculator,
  Languages,
  HeartHandshake,
  BookOpenCheck,
  Check,
  GraduationCap,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Icon } from '../ui/index.ts';

interface ProgramSectionProps {
  onRegisterClick: () => void;
}

/**
 * UI-12 Program Section
 * Editorial curriculum showcase highlighting the 4 core learning areas
 * and targeted grade levels (TK through SMP 8) with semantic visual accents.
 */
export const ProgramSection: React.FC<ProgramSectionProps> = ({
  onRegisterClick,
}) => {
  const [activeTab, setActiveTab] = useState<'PROGRAM' | 'JENJANG'>('PROGRAM');

  return (
    <section
      id="program"
      aria-labelledby="program-section-heading"
      className="scroll-mt-32 py-16 sm:py-24 bg-surface border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Section Header & Tab Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="type-eyebrow text-primary uppercase tracking-wider">
              Kurikulum &amp; Layanan Belajar
            </div>
            <h2
              id="program-section-heading"
              className="type-page-title text-foreground tracking-tight"
            >
              Pilihan Program Pembelajaran Unggulan
            </h2>
            <p className="type-body-sm text-secondary-foreground leading-relaxed">
              Didesain khusus untuk membangun kecerdasan akademik sekaligus kematangan budi pekerti anak
              melalui metode bimbingan interaktif yang menyenangkan (<span className="text-primary font-medium">Happy Learning</span>).
            </p>
          </div>

          {/* Toggle Tab */}
          <div className="inline-flex p-1 bg-surface-subtle rounded-control border border-border shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('PROGRAM')}
              className={`px-4 py-2 rounded-sm text-xs sm:text-sm font-semibold transition-all cursor-pointer focus-ring ${
                activeTab === 'PROGRAM'
                  ? 'bg-surface text-foreground shadow-xs'
                  : 'text-secondary-foreground hover:text-foreground'
              }`}
            >
              Mata Pelajaran &amp; Kurikulum
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('JENJANG')}
              className={`px-4 py-2 rounded-sm text-xs sm:text-sm font-semibold transition-all cursor-pointer focus-ring ${
                activeTab === 'JENJANG'
                  ? 'bg-surface text-foreground shadow-xs'
                  : 'text-secondary-foreground hover:text-foreground'
              }`}
            >
              Sasaran Jenjang (TK – SMP 8)
            </button>
          </div>
        </div>

        {activeTab === 'PROGRAM' ? (
          /* Grid of 4 Programs with Semantic Visual Accents */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* 1. Matematika Ceria (Soft Blue / Info Accent) */}
            <div className="rounded-card p-6 bg-surface border border-info-border hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-control bg-info-soft text-info flex items-center justify-center">
                  <Icon icon={Calculator} size="md" />
                </div>
                <div>
                  <h3 className="type-title text-foreground">
                    1. Matematika Ceria
                  </h3>
                  <p className="type-caption text-secondary-foreground mt-1 leading-relaxed">
                    Belajar berhitung, penjumlahan, pengurangan, perkalian, pembagian, dan penalaran soal cerita dengan latihan terarah.
                  </p>
                </div>

                <ul className="space-y-2.5 type-caption text-secondary-foreground pt-3 border-t border-border-subtle">
                  <li className="flex items-start gap-2">
                    <Icon icon={Check} size="xs" className="text-info shrink-0 mt-0.5" />
                    <span>Latihan hitung angka besar &amp; soal cerita bertahap</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon icon={Check} size="xs" className="text-info shrink-0 mt-0.5" />
                    <span>Pemantapan persiapan ujian akhir SD (EBTA/EBTANAS)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon icon={Check} size="xs" className="text-info shrink-0 mt-0.5" />
                    <span>Metode penalaran matematika SMP Kelas 7 &amp; 8</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-border text-[11px] text-info font-semibold">
                Tersedia untuk jenjang TK, SD, dan SMP
              </div>
            </div>

            {/* 2. Bahasa Inggris Praktis (Lavender / Learning Accent) */}
            <div className="rounded-card p-6 bg-surface border border-learning-border hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-control bg-learning-soft text-learning flex items-center justify-center">
                  <Icon icon={Languages} size="md" />
                </div>
                <div>
                  <h3 className="type-title text-foreground">
                    2. Bahasa Inggris Praktis
                  </h3>
                  <p className="type-caption text-secondary-foreground mt-1 leading-relaxed">
                    Pengenalan kosa kata tematik, percakapan sehari-hari, tata bahasa praktis, dan role-play komunikasi aktif.
                  </p>
                </div>

                <ul className="space-y-2.5 type-caption text-secondary-foreground pt-3 border-t border-border-subtle">
                  <li className="flex items-start gap-2">
                    <Icon icon={Check} size="xs" className="text-learning shrink-0 mt-0.5" />
                    <span>Perbendaharaan kata tematik yang interaktif</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon icon={Check} size="xs" className="text-learning shrink-0 mt-0.5" />
                    <span>Teori dasar &amp; latihan soal bimbingan guru</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon icon={Check} size="xs" className="text-learning shrink-0 mt-0.5" />
                    <span>Latihan percakapan &amp; role play kontekstual</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-border text-[11px] text-learning font-semibold">
                Praktik Komunikasi &amp; Percakapan
              </div>
            </div>

            {/* 3. Pendidikan Karakter (Warm Green / Primary Accent) */}
            <div className="rounded-card p-6 bg-surface border border-success-border hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-control bg-success-soft text-success flex items-center justify-center">
                  <Icon icon={HeartHandshake} size="md" />
                </div>
                <div>
                  <h3 className="type-title text-foreground">
                    3. Pendidikan Karakter
                  </h3>
                  <p className="type-caption text-secondary-foreground mt-1 leading-relaxed">
                    Membiasakan respon santun, empati saling menolong, menghormati orang tua dan guru, serta menjaga privasi diri.
                  </p>
                </div>

                <ul className="space-y-2.5 type-caption text-secondary-foreground pt-3 border-t border-border-subtle">
                  <li className="flex items-start gap-2">
                    <Icon icon={Check} size="xs" className="text-success shrink-0 mt-0.5" />
                    <span>Pembiasaan salam santun &amp; ucapan terima kasih</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon icon={Check} size="xs" className="text-success shrink-0 mt-0.5" />
                    <span>Etika menghormati orang tua, guru, dan teman</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon icon={Check} size="xs" className="text-success shrink-0 mt-0.5" />
                    <span>Belajar menjaga batas privasi diri &amp; empati sosial</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-border text-[11px] text-success font-semibold">
                Fondasi Moral di Setiap Sesi Belajar
              </div>
            </div>

            {/* 4. Kelas Khusus Membaca (Warm Orange / Activity Accent) */}
            <div className="rounded-card p-6 bg-activity-soft/30 border border-activity-border hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-control bg-activity-soft text-activity flex items-center justify-center">
                  <Icon icon={BookOpenCheck} size="md" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="type-title text-foreground">
                      4. Kelas Khusus Membaca
                    </h3>
                    <span className="px-1.5 py-0.5 rounded-sm bg-activity text-white text-[10px] font-bold">
                      1 Jam
                    </span>
                  </div>
                  <p className="type-caption text-secondary-foreground mt-1 leading-relaxed">
                    Pendampingan intensif bagi anak-anak yang memerlukan asistensi membaca hingga mampu membaca mandiri dan percaya diri.
                  </p>
                </div>

                <div className="p-3 bg-surface rounded-control border border-activity-border/60 text-xs text-foreground space-y-1">
                  <p className="font-semibold text-activity flex items-center gap-1.5">
                    <Icon icon={Sparkles} size="xs" />
                    <span>Kisah Nyata Kemajuan:</span>
                  </p>
                  <p className="type-caption text-secondary-foreground leading-relaxed">
                    Siswa kelas 2 yang semula belum lancar kini telah berhasil membaca mandiri dengan percaya diri di tahun 2026/2027.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border text-[11px] text-activity font-semibold">
                Didampingi Guru Spesialis Membaca
              </div>
            </div>
          </div>
        ) : (
          /* Tab: Sasaran Jenjang Pendidikan (TK - SMP 8) */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* TK */}
            <div className="rounded-card bg-surface border border-border p-6 sm:p-8 space-y-4 shadow-xs">
              <span className="px-2.5 py-1 rounded-pill bg-primary-soft text-primary text-xs font-semibold uppercase tracking-wider inline-block">
                Jenjang Anak TK (A &amp; B)
              </span>
              <h3 className="type-title text-foreground">
                Pengenalan Dasar &amp; Huruf
              </h3>
              <p className="type-body-sm text-secondary-foreground leading-relaxed">
                Fokus pembelajaran dalam pengenalan angka, huruf, dan penjumlahan angka kecil dengan alat peraga visual yang menyenangkan.
              </p>
              <div className="bg-surface-subtle p-3.5 rounded-control border border-border-subtle text-xs text-secondary-foreground">
                <strong className="text-foreground">Asistensi Membaca:</strong> Disediakan sesi membaca paralel 1 jam agar peserta didik siap saat memasuki jenjang sekolah dasar.
              </div>
            </div>

            {/* SD */}
            <div className="rounded-card bg-surface border border-border p-6 sm:p-8 space-y-4 shadow-xs">
              <span className="px-2.5 py-1 rounded-pill bg-info-soft text-info text-xs font-semibold uppercase tracking-wider inline-block">
                Jenjang SD (Kelas 1 – 6)
              </span>
              <h3 className="type-title text-foreground">
                Penalaran &amp; Penguatan Ujian
              </h3>
              <p className="type-body-sm text-secondary-foreground leading-relaxed">
                Matematika angka besar, pengurangan, perkalian, soal cerita, serta Bahasa Inggris teori dan praktik percakapan sehari-hari.
              </p>
              <div className="bg-surface-subtle p-3.5 rounded-control border border-border-subtle text-xs text-secondary-foreground">
                <strong className="text-foreground">Khusus Kelas 6:</strong> Pemantapan soal-soal latihan intensif untuk persiapan menempuh ujian kelulusan sekolah dan EBTA.
              </div>
            </div>

            {/* SMP */}
            <div className="rounded-card bg-surface border-l-4 border-l-warning border-t border-r border-b border-border p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-pill bg-warning-soft text-warning text-xs font-semibold uppercase tracking-wider">
                  Jenjang SMP (Kelas 7 &amp; 8)
                </span>
                <span className="px-2 py-0.5 rounded-pill bg-primary text-primary-foreground text-[10px] font-bold">
                  Kelas Baru TA 2026/2027
                </span>
              </div>
              <h3 className="type-title text-foreground">
                Penalaran &amp; Role Play Percakapan
              </h3>
              <p className="type-body-sm text-secondary-foreground leading-relaxed">
                Dibuka untuk mengakomodasi kebutuhan siswa yang ingin melanjutkan bimbingan belajar dengan materi pendalaman matematika dan Bahasa Inggris aktif.
              </p>
              <div className="bg-surface-subtle p-3.5 rounded-control border border-border-subtle text-xs text-secondary-foreground">
                <strong className="text-foreground">Fokus Utama:</strong> Metode penalaran logika matematika dan dialog Bahasa Inggris lanjutan dengan bimbingan modul khusus.
              </div>
            </div>
          </div>
        )}

        {/* Welcoming Public CTA Strip Leading into Registration */}
        <div className="rounded-card bg-surface-subtle border border-border p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="type-title text-foreground">
              Ingin Mengikutsertakan Putra/Putri Anda?
            </h4>
            <p className="type-body-sm text-secondary-foreground max-w-2xl">
              Pendaftaran terbuka tanpa memandang latar belakang agama maupun suku. Seluruh kegiatan bimbingan belajar diselenggarakan cuma-cuma dengan kasih.
            </p>
          </div>
          <button
            type="button"
            onClick={onRegisterClick}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold shadow-xs transition-all active:scale-[0.985] focus-ring cursor-pointer"
          >
            <span>Isi Formulir Pendaftaran</span>
            <Icon icon={ArrowRight} size="xs" />
          </button>
        </div>
      </div>
    </section>
  );
};
