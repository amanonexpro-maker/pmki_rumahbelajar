/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BookOpen,
  MapPin,
  Phone,
  Calendar,
  Clock,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Icon } from '../ui/index.ts';

interface FooterProps {
  onSelectTab: (tab: string) => void;
  onOpenDashboard: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab, onOpenDashboard }) => {
  return (
    <footer className="bg-surface-subtle text-secondary-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Identity & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-control bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs">
                <Icon icon={BookOpen} size="sm" />
              </div>
              <div>
                <h4 className="text-foreground font-bold text-base leading-tight">
                  Rumah Belajar Griya Asih
                </h4>
                <p className="text-xs text-primary font-medium">PMKI Mupel Jawa Timur</p>
              </div>
            </div>
            <p className="type-body-sm text-secondary-foreground leading-relaxed">
              Ruang belajar inklusif yang mendampingi anak bertumbuh lewat Happy Learning,
              mengembangkan nalar kreatif, dan memupuk karakter luhur tanpa memandang latar belakang suku dan agama.
            </p>
            <div className="pt-2 text-xs text-warning font-semibold italic">
              "Belajar itu bukan tentang menjadi sempurna, tetapi tentang menjadi lebih baik setiap hari."
            </div>
          </div>

          {/* Column 2: Program & Layanan */}
          <div className="space-y-4">
            <h4 className="text-foreground font-bold text-xs tracking-wider uppercase border-b border-border pb-2">
              Program Pembelajaran
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-secondary-foreground">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('program')}
                  className="hover:text-primary transition-colors text-left focus-ring rounded-xs cursor-pointer"
                >
                  Bimbingan Matematika &amp; Berhitung Ceria
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('program')}
                  className="hover:text-primary transition-colors text-left focus-ring rounded-xs cursor-pointer"
                >
                  Bahasa Inggris Praktis &amp; Percakapan
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('program')}
                  className="hover:text-primary transition-colors text-left focus-ring rounded-xs cursor-pointer"
                >
                  Pendidikan Karakter &amp; Budi Pekerti
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('program')}
                  className="hover:text-primary transition-colors text-left focus-ring rounded-xs cursor-pointer"
                >
                  Kelas Khusus Membaca (Literasi 1 Jam)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('program')}
                  className="hover:text-primary transition-colors text-left focus-ring rounded-xs cursor-pointer"
                >
                  Pemantapan Ujian SD &amp; SMP Kelas 7-8
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Jadwal & Lokasi */}
          <div className="space-y-4">
            <h4 className="text-foreground font-bold text-xs tracking-wider uppercase border-b border-border pb-2">
              Jadwal &amp; Lokasi Belajar
            </h4>
            <div className="space-y-3 text-xs sm:text-sm text-secondary-foreground">
              <div className="flex items-start gap-2.5">
                <Icon icon={Calendar} size="xs" className="text-primary shrink-0 mt-0.5" />
                <span>Setiap Hari <strong className="text-foreground">Sabtu</strong></span>
              </div>
              <div className="flex items-start gap-2.5">
                <Icon icon={Clock} size="xs" className="text-primary shrink-0 mt-0.5" />
                <span>Pukul <strong className="text-foreground">15.00 s/d 17.15 WIB</strong></span>
              </div>
              <div className="flex items-start gap-2.5">
                <Icon icon={MapPin} size="xs" className="text-primary shrink-0 mt-0.5" />
                <span>
                  RAAL (Rumah Asuh Anak &amp; Lansia) "Griya Asih", Lawang, Kab. Malang, Jawa Timur
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    (Wilayah Kelurahan Kalirejo &amp; Lawang)
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Column 4: Kontak Pengurus */}
          <div className="space-y-4">
            <h4 className="text-foreground font-bold text-xs tracking-wider uppercase border-b border-border pb-2">
              Hubungi Pengurus
            </h4>
            <div className="space-y-3 text-xs sm:text-sm text-secondary-foreground">
              <div>
                <span className="text-xs text-muted-foreground block">Koordinator Pelayanan:</span>
                <a
                  href="https://wa.me/628123235318"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground font-medium hover:text-primary flex items-center gap-2 mt-0.5 focus-ring rounded-xs"
                >
                  <Icon icon={Phone} size="xs" className="text-primary" />
                  <span>Ms. Evi (+62 812-323-5318)</span>
                </a>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Pengurus &amp; Humas:</span>
                <a
                  href="https://wa.me/6281332987491"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground font-medium hover:text-primary flex items-center gap-2 mt-0.5 focus-ring rounded-xs"
                >
                  <Icon icon={Phone} size="xs" className="text-primary" />
                  <span>Ms. Lilian (+62 813-3298-7491)</span>
                </a>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenDashboard}
                  className="w-full py-2.5 px-3 text-xs font-semibold rounded-control bg-surface hover:bg-surface-subtle text-foreground border border-border transition-colors flex items-center justify-center gap-2 focus-ring shadow-xs cursor-pointer"
                >
                  <Icon icon={Building} size="xs" className="text-primary" />
                  <span>Akses Portal Internal Pengurus &amp; Guru</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Platform Pelayanan Terpadu PMKI. Pilot: Rumah Belajar Griya Asih Lawang.</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-secondary-foreground">
              <Icon icon={ShieldCheck} size="xs" className="text-primary" />
              <span>Perlindungan Privasi Anak &amp; Data Aman</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
