/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { storage } from '../../services/storage.ts';
import { MediaAsset } from '../../types/index.ts';
import { Eye, ShieldCheck } from 'lucide-react';
import { Badge, Button, Dialog, Icon } from '../ui/index.ts';

/**
 * UI-12 Gallery & Community Documentation Section
 * Editorial asymmetric photo showcase with canonical Dialog lightbox
 * and verified guardian media consent safeguard.
 */
export const GallerySection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeMedia, setActiveMedia] = useState<MediaAsset | null>(null);

  const mediaList = storage.getMediaAssets().filter((m) => m.isEligibleForPublic);

  const categories = [
    { id: 'ALL', label: 'Semua Dokumentasi' },
    { id: 'KEGIATAN_BELAJAR', label: 'Kegiatan Belajar' },
    { id: 'PENGURUS', label: 'Pengurus & Guru' },
    { id: 'DOKUMENTASI_ACARA', label: 'Acara & Perayaan' },
  ];

  const filteredMedia =
    selectedCategory === 'ALL'
      ? mediaList
      : mediaList.filter((m) => m.category === selectedCategory);

  return (
    <section
      id="galeri"
      aria-labelledby="gallery-section-heading"
      className="scroll-mt-32 py-16 sm:py-24 bg-surface border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="type-eyebrow text-primary uppercase tracking-wider">
              Galeri &amp; Dokumentasi Kegiatan
            </div>
            <h2
              id="gallery-section-heading"
              className="type-page-title text-foreground tracking-tight"
            >
              Momen Kebersamaan di Rumah Belajar Griya Asih
            </h2>
            <p className="type-body-sm text-secondary-foreground leading-relaxed">
              Keceriaan, kesungguhan belajar, dan interaksi hangat antara para guru pendamping
              serta adik-adik peserta didik di Lawang.
            </p>
          </div>

          {/* Privacy Verification Safeguard Ribbon */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-surface-subtle border border-border text-xs text-secondary-foreground self-start md:self-auto">
            <Icon icon={ShieldCheck} size="xs" className="text-primary shrink-0" />
            <span>Dokumentasi publik terverifikasi izin wali</span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          role="tablist"
          aria-label="Filter kategori galeri"
          className="flex flex-wrap items-center gap-2"
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-pill text-xs sm:text-[13px] font-semibold transition-all cursor-pointer focus-ring ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-surface-subtle hover:bg-surface text-secondary-foreground hover:text-foreground border border-border'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Editorial Media Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredMedia.map((item, index) => {
            // Asymmetric visual variety: highlight first photo as featured
            const isFeatured = index === 0 && selectedCategory === 'ALL';

            return (
              <div
                key={item.id}
                onClick={() => setActiveMedia(item)}
                tabIndex={0}
                role="button"
                aria-label={`Buka foto: ${item.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveMedia(item);
                  }
                }}
                className={`group relative rounded-card overflow-hidden border border-border bg-surface-subtle shadow-xs hover:shadow-md transition-all cursor-pointer focus-ring flex flex-col justify-between ${
                  isFeatured ? 'sm:col-span-2 lg:col-span-2' : ''
                }`}
              >
                <div className={`overflow-hidden bg-surface-subtle ${isFeatured ? 'h-64 sm:h-80' : 'h-56 sm:h-64'}`}>
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    loading="lazy"
                  />
                </div>

                <div className="p-4 sm:p-5 bg-surface border-t border-border space-y-1.5 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {item.category.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {item.capturedDate}
                    </span>
                  </div>

                  <h3 className="type-title text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  <p className="type-caption text-secondary-foreground line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-2 flex items-center gap-1.5 text-xs text-primary font-semibold">
                    <Icon icon={Eye} size="xs" />
                    <span>Lihat Foto Penuh</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Canonical Dialog Lightbox Modal */}
        <Dialog
          open={Boolean(activeMedia)}
          onClose={() => setActiveMedia(null)}
          title={activeMedia?.title || 'Dokumentasi Rumah Belajar'}
          description={activeMedia ? `Kategori: ${activeMedia.category.replace('_', ' ')} · Tanggal: ${activeMedia.capturedDate}` : undefined}
          size="lg"
          footer={
            <div className="w-full flex items-center justify-between gap-3 text-xs text-secondary-foreground">
              <span className="flex items-center gap-1.5">
                <Icon icon={ShieldCheck} size="xs" className="text-primary" />
                <span>Persetujuan wali murid terverifikasi (Media Consent Verified)</span>
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setActiveMedia(null)}
              >
                Tutup
              </Button>
            </div>
          }
        >
          {activeMedia && (
            <div className="space-y-4">
              <div className="rounded-control overflow-hidden border border-border bg-black flex items-center justify-center max-h-[60vh]">
                <img
                  src={activeMedia.url}
                  alt={activeMedia.title}
                  className="max-h-[60vh] w-auto max-w-full object-contain"
                />
              </div>
              <p className="type-body-sm text-secondary-foreground leading-relaxed">
                {activeMedia.description}
              </p>
            </div>
          )}
        </Dialog>
      </div>
    </section>
  );
};
