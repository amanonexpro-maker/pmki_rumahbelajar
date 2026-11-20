/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Phone,
  MessageCircle,
  MapPin,
  Send,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { Button, Icon } from '../ui/index.ts';

/**
 * UI-12 Contact & Community Section
 * Direct, warm community communication channels with Rumah Belajar coordinators
 * and WhatsApp inquiry integration.
 */
export const ContactSection: React.FC = () => {
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryMsg.trim()) return;

    // Direct to WhatsApp
    const text = `Halo Pengurus Rumah Belajar Griya Asih Lawang, nama saya ${inquiryName} (${inquiryPhone}). Pesan: ${inquiryMsg}`;
    window.open(`https://wa.me/628123235318?text=${encodeURIComponent(text)}`, '_blank');
    setSentSuccess(true);
  };

  return (
    <section
      id="kontak"
      aria-labelledby="contact-section-heading"
      className="scroll-mt-32 py-16 sm:py-24 bg-background border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="max-w-2xl space-y-3">
          <div className="type-eyebrow text-primary uppercase tracking-wider">
            Hubungi Pengurus
          </div>
          <h2
            id="contact-section-heading"
            className="type-page-title text-foreground tracking-tight"
          >
            Punya Pertanyaan atau Ingin Bergabung?
          </h2>
          <p className="type-body-sm text-secondary-foreground leading-relaxed">
            Kami dengan senang hati menyambut orang tua, calon peserta didik, maupun rekan relawan pendidik
            yang rindu melayani bersama demi masa depan anak-anak Lawang.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct WhatsApp Contact Cards */}
          <div className="lg:col-span-5 space-y-4">
            {/* Card Ms. Evi */}
            <div className="p-6 rounded-card bg-surface border border-border shadow-xs hover:shadow-md transition-shadow space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-control bg-primary-soft text-primary flex items-center justify-center font-bold text-base">
                  ME
                </div>
                <div>
                  <h4 className="type-title text-foreground">Ms. Evi S.Pd</h4>
                  <p className="text-xs text-primary font-semibold">
                    Koordinator Pelayanan &amp; Pengurus
                  </p>
                  <p className="type-caption text-secondary-foreground">Sekolah Katholik Lawang</p>
                </div>
              </div>
              <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-bold text-foreground">
                  +62 812-323-5318
                </span>
                <a
                  href="https://wa.me/628123235318?text=Halo%20Ms.%20Evi,%20saya%20ingin%20bertanya%20mengenai%20Rumah%20Belajar%20Griya%20Asih%20Lawang"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold shadow-xs transition-colors focus-ring"
                >
                  <Icon icon={MessageCircle} size="xs" />
                  <span>Chat WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Card Ms. Lilian */}
            <div className="p-6 rounded-card bg-surface border border-border shadow-xs hover:shadow-md transition-shadow space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-control bg-learning-soft text-learning flex items-center justify-center font-bold text-base">
                  ML
                </div>
                <div>
                  <h4 className="type-title text-foreground">Ms. Lilian</h4>
                  <p className="text-xs text-learning font-semibold">
                    Pengurus &amp; Humas Pelayanan
                  </p>
                  <p className="type-caption text-secondary-foreground">Pengurus RAAL Griya Asih</p>
                </div>
              </div>
              <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-bold text-foreground">
                  +62 813-3298-7491
                </span>
                <a
                  href="https://wa.me/6281332987491?text=Halo%20Ms.%20Lilian,%20saya%20ingin%20bertanya%20seputar%20Rumah%20Belajar%20Griya%20Asih"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-learning hover:opacity-90 text-white text-xs font-semibold shadow-xs transition-colors focus-ring"
                >
                  <Icon icon={MessageCircle} size="xs" />
                  <span>Chat WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Location & Service Center Strip */}
            <div className="p-5 rounded-card bg-surface-subtle border border-border shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-control bg-surface border border-border flex items-center justify-center shrink-0 mt-0.5">
                  <Icon icon={Building} size="xs" className="text-primary" />
                </div>
                <div className="text-xs leading-relaxed space-y-1">
                  <p className="font-semibold text-foreground">Alamat Sekretariat &amp; Lokasi Belajar:</p>
                  <p className="text-secondary-foreground">
                    RAAL (Rumah Asuh Anak &amp; Lansia) "Griya Asih", Kecamatan Lawang, Kabupaten Malang, Jawa Timur.
                  </p>
                  <p className="text-primary font-medium pt-0.5">
                    Pelayanan Terpadu PMKI Mupel Jawa Timur
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Direct Message Composer */}
          <div className="lg:col-span-7 bg-surface p-6 sm:p-8 rounded-card border border-border shadow-xs">
            <h3 className="type-h3 text-foreground mb-1">
              Kirim Pesan / Konfirmasi Cepat
            </h3>
            <p className="type-caption text-secondary-foreground mb-6 leading-relaxed">
              Pesan Anda akan otomatis terhubung ke aplikasi WhatsApp resmi pengurus Rumah Belajar Griya Asih.
            </p>

            {sentSuccess ? (
              <div className="p-6 bg-primary-soft/40 rounded-control border border-primary/20 text-center space-y-3">
                <div className="w-10 h-10 rounded-pill bg-primary text-primary-foreground flex items-center justify-center mx-auto">
                  <Icon icon={CheckCircle2} size="md" />
                </div>
                <h4 className="font-bold text-foreground text-base">Pesan Anda Siap Terkirim</h4>
                <p className="type-caption text-secondary-foreground">
                  Jendela WhatsApp telah terbuka untuk melanjutkan percakapan langsung dengan pengurus.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSentSuccess(false)}
                >
                  Kirim Pesan Baru
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="type-label block text-foreground mb-1.5">
                      Nama Anda *
                    </label>
                    <input
                      type="text"
                      required
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      placeholder="Nama Lengkap"
                      className="w-full h-10 px-3.5 py-2 rounded-control border border-border bg-surface text-foreground text-sm focus-ring"
                    />
                  </div>
                  <div>
                    <label className="type-label block text-foreground mb-1.5">
                      Nomor HP / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full h-10 px-3.5 py-2 rounded-control border border-border bg-surface text-foreground text-sm focus-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="type-label block text-foreground mb-1.5">
                    Pesan atau Pertanyaan *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={inquiryMsg}
                    onChange={(e) => setInquiryMsg(e.target.value)}
                    placeholder="Tuliskan pertanyaan mengenai pendaftaran siswa, penempatan kelas, jadwal belajar, atau informasi relawan..."
                    className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-foreground text-sm focus-ring"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  leftIcon={<Icon icon={Send} size="xs" />}
                >
                  Kirim via WhatsApp Resmi
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
