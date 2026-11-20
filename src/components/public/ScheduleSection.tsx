/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Icon } from '../ui/index.ts';

/**
 * UI-12 Schedule Section
 * Clear, expressive Saturday timetable showing the actual learning schedule (15.00 - 17.15 WIB)
 * at RAAL Griya Asih Lawang with structured phase progression.
 */
export const ScheduleSection: React.FC = () => {
  const timeSlots = [
    {
      time: '14.45 – 15.00 WIB',
      activity: 'Kedatangan & Pembiasaan Salam',
      desc: 'Siswa hadir, saling menyapa dengan sopan (selamat sore), menaruh tas dengan tertib, dan menyiapkan meja lipat.',
      tag: 'Penyambutan',
      accentColor: 'border-l-primary',
      tagBadge: 'bg-primary-soft text-primary',
    },
    {
      time: '15.00 – 15.45 WIB',
      activity: 'Sesi Pembelajaran I: Matematika & Berhitung',
      desc: 'Bimbingan berhitung, penjumlahan, perkalian, penalaran soal cerita, dan pemantapan materi persiapan EBTA.',
      tag: 'Akademik',
      accentColor: 'border-l-info',
      tagBadge: 'bg-info-soft text-info',
    },
    {
      time: '15.00 – 16.00 WIB',
      activity: 'Kelas Khusus Membaca Intensif (1 Jam Paralel)',
      desc: 'Sesi paralel intensif 1 jam bagi anak TK & siswa yang memerlukan asistensi kelancaran membaca mandiri.',
      tag: 'Literasi Khusus',
      accentColor: 'border-l-activity',
      tagBadge: 'bg-activity-soft text-activity',
    },
    {
      time: '15.45 – 16.30 WIB',
      activity: 'Sesi Pembelajaran II: Bahasa Inggris & Percakapan',
      desc: 'Kosa kata baru tematik, latihan tata bahasa praktis, dialog percakapan sehari-hari, dan role-play seru.',
      tag: 'Bahasa',
      accentColor: 'border-l-learning',
      tagBadge: 'bg-learning-soft text-learning',
    },
    {
      time: '16.30 – 17.15 WIB',
      activity: 'Sesi Pembelajaran III: Pendidikan Karakter & Budi Pekerti',
      desc: 'Pembiasaan respon santun, empati saling menolong, etika menghormati orang tua dan guru, serta refleksi bersama.',
      tag: 'Karakter',
      accentColor: 'border-l-success',
      tagBadge: 'bg-success-soft text-success',
    },
  ];

  return (
    <section
      id="jadwal"
      aria-labelledby="schedule-section-heading"
      className="scroll-mt-32 py-16 sm:py-24 bg-background border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Schedule Orientation & Location Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <div className="type-eyebrow text-primary uppercase tracking-wider">
                Jadwal &amp; Waktu Pelayanan
              </div>
              <h2
                id="schedule-section-heading"
                className="type-page-title text-foreground tracking-tight"
              >
                Waktu Pelaksanaan Bimbingan Belajar
              </h2>
              <p className="type-body-sm text-secondary-foreground leading-relaxed">
                Dilaksanakan secara berkala setiap akhir pekan agar tidak mengganggu jadwal sekolah formal anak-anak.
              </p>
            </div>

            {/* High-Visibility Anchor Cards */}
            <div className="rounded-card bg-surface border border-border p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-control bg-primary-soft/60 border border-primary/20">
                <div className="w-12 h-12 rounded-pill bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <Icon icon={Calendar} size="md" />
                </div>
                <div>
                  <span className="text-xs text-primary font-bold uppercase tracking-wider block">
                    Hari Pelaksanaan
                  </span>
                  <p className="text-xl sm:text-2xl font-extrabold text-foreground">
                    Setiap Hari SABTU
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-control bg-warning-soft/60 border border-warning-border">
                <div className="w-12 h-12 rounded-pill bg-warning text-white flex items-center justify-center shrink-0">
                  <Icon icon={Clock} size="md" />
                </div>
                <div>
                  <span className="text-xs text-warning-foreground font-bold uppercase tracking-wider block">
                    Jam Belajar
                  </span>
                  <p className="text-xl sm:text-2xl font-extrabold text-foreground">
                    15.00 – 17.15 WIB
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-control bg-surface-subtle border border-border">
                <div className="w-10 h-10 rounded-control bg-surface text-foreground border border-border flex items-center justify-center shrink-0 mt-0.5">
                  <Icon icon={MapPin} size="sm" className="text-primary" />
                </div>
                <div>
                  <span className="text-xs text-secondary-foreground font-semibold uppercase tracking-wider block">
                    Tempat Belajar
                  </span>
                  <p className="text-sm font-bold text-foreground">
                    RAAL (Rumah Asuh Anak &amp; Lansia) "Griya Asih"
                  </p>
                  <p className="type-caption text-secondary-foreground mt-0.5 leading-relaxed">
                    Kecamatan Lawang, Kabupaten Malang, Jawa Timur (Akses mudah dari Kelurahan Kalirejo &amp; Lawang).
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance Guidelines Card */}
            <div className="p-4 rounded-control bg-surface border border-border text-xs text-secondary-foreground space-y-2 shadow-xs">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Icon icon={AlertCircle} size="xs" className="text-primary" />
                <span>Ketentuan Kehadiran Peserta:</span>
              </div>
              <ul className="space-y-1 list-disc pl-5 type-caption">
                <li>Diharapkan hadir 15 menit sebelum kegiatan dimulai untuk pembiasaan salam.</li>
                <li>Membawa alat tulis pribadi; meja lipat mandiri disediakan di ruangan.</li>
                <li>Jika berhalangan hadir (sakit/keperluan penting), mohon konfirmasi melalui WhatsApp guru kelas.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Time Slot Timeline Breakdown */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-foreground font-bold text-base sm:text-lg">
              <Icon icon={Clock} size="sm" className="text-primary" />
              <span>Susunan Alur Pembelajaran Setiap Sesi Sabtu</span>
            </div>

            <div className="space-y-3.5">
              {timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className={`p-4 sm:p-5 rounded-control border border-border ${slot.accentColor} border-l-4 bg-surface shadow-xs transition-all hover:bg-surface-subtle/50`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-xs font-bold text-foreground font-mono">
                      {slot.time}
                    </span>
                    <span className={`self-start sm:self-auto px-2 py-0.5 rounded-pill text-[10px] font-semibold border border-transparent ${slot.tagBadge}`}>
                      {slot.tag}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-foreground">
                    {slot.activity}
                  </h4>
                  <p className="type-caption text-secondary-foreground mt-1 leading-relaxed">
                    {slot.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
