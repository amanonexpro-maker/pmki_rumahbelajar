"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { KabarAlbumLightbox, type LightboxAlbum } from "./kabar-album-lightbox";
import { KabarEmptyState } from "./kabar-empty-state";
import type {
  PublicGalleryItemDTO,
  PublicNewsItemDTO,
} from "../types/public-types";

export type KabarTabFilter = "semua" | "berita" | "galeri";

export interface KabarFeedViewProps {
  newsItems?: PublicNewsItemDTO[];
  galleryItems?: PublicGalleryItemDTO[];
  initialTab?: KabarTabFilter;
}

export interface HybridNewsFeedItem {
  id: string;
  type: "berita";
  title: string;
  slug: string;
  categoryLabel: string;
  dateFormatted: string;
  excerpt: string;
  coverUrl: string;
}

export interface HybridGalleryFeedItem {
  id: string;
  type: "galeri";
  title: string;
  categoryLabel: string;
  dateFormatted: string;
  coverUrl: string;
  description: string;
  album: LightboxAlbum;
}

export type HybridFeedItem = HybridNewsFeedItem | HybridGalleryFeedItem;

const FILTER_TABS: readonly { id: KabarTabFilter; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "berita", label: "Berita" },
  { id: "galeri", label: "Galeri" },
] as const;

const INITIAL_DISPLAY_LIMIT = 6;

/**
 * KabarFeedView (Fase 14 Step 7, UI-UX §15, §30).
 * Feed hybrid berita & galeri foto dokumentasi dengan filter segmented control client-side.
 * - Memetakan newsItems & galleryItems menjadi feed kartu terpadu dengan discriminator tipe eksplisit.
 * - Consent-gate terlaksana di level server query sebelum payload dikirim ke komponen.
 * - Interaksi album galeri membuka lightbox modal imersif.
 */
export function KabarFeedView({
  newsItems = [],
  galleryItems = [],
  initialTab = "semua",
}: KabarFeedViewProps) {
  const [activeTab, setActiveTab] = React.useState<KabarTabFilter>(initialTab);
  const [displayLimit, setDisplayLimit] = React.useState(INITIAL_DISPLAY_LIMIT);
  const [selectedAlbum, setSelectedAlbum] = React.useState<LightboxAlbum | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState<boolean>(false);

  // Transformasi data real ke model feed hybrid
  const allHybridItems = React.useMemo<HybridFeedItem[]>(() => {
    const formattedNews: HybridNewsFeedItem[] = newsItems.map((post) => ({
      id: `news-${post.id}`,
      type: "berita",
      title: post.title,
      slug: post.slug,
      categoryLabel: post.categoryLabel,
      dateFormatted: post.publishedDateFormatted,
      excerpt: post.excerpt,
      coverUrl: post.coverSignedUrl,
    }));

    const formattedGallery: HybridGalleryFeedItem[] = galleryItems.map((item) => ({
      id: `gallery-${item.id}`,
      type: "galeri",
      title: item.title,
      categoryLabel: item.categoryLabel,
      dateFormatted: item.capturedDate,
      coverUrl: item.signedReadUrl,
      description: item.description,
      album: {
        title: item.title,
        date: item.capturedDate,
        count: 1,
        photos: [
          {
            url: item.signedReadUrl,
            caption: item.description,
          },
        ],
      },
    }));

    // Gabung secara interleave / urut
    const combined: HybridFeedItem[] = [];
    const maxLen = Math.max(formattedNews.length, formattedGallery.length);
    for (let i = 0; i < maxLen; i++) {
      if (formattedNews[i]) combined.push(formattedNews[i]);
      if (formattedGallery[i]) combined.push(formattedGallery[i]);
    }
    return combined;
  }, [newsItems, galleryItems]);

  // Filter berdasarkan activeTab
  const filteredItems = React.useMemo(() => {
    if (activeTab === "berita") {
      return allHybridItems.filter((item) => item.type === "berita");
    }
    if (activeTab === "galeri") {
      return allHybridItems.filter((item) => item.type === "galeri");
    }
    return allHybridItems;
  }, [allHybridItems, activeTab]);

  const visibleItems = filteredItems.slice(0, displayLimit);
  const hasMore = filteredItems.length > displayLimit;

  const handleOpenAlbum = (album: LightboxAlbum) => {
    setSelectedAlbum(album);
    setIsLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Sticky Segmented Control Filter Tabs */}
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur-sm py-2 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-border-subtle">
        <div
          role="tablist"
          aria-label="Filter kategori warta kabar"
          className="flex gap-2 overflow-x-auto snap-x scrollbar-none"
        >
          {FILTER_TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isSelected}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setDisplayLimit(INITIAL_DISPLAY_LIMIT);
                }}
                className={cn(
                  "min-h-11 rounded-pill px-4 py-2 text-xs sm:text-sm font-medium transition-colors duration-200 focus-ring shrink-0 cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "bg-surface-subtle text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed Items Grid */}
      {filteredItems.length === 0 ? (
        <KabarEmptyState />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {visibleItems.map((item) => {
              if (item.type === "berita") {
                return (
                  <article
                    key={item.id}
                    className="group flex flex-col justify-between rounded-card bg-surface border border-border hover:border-primary/40 transition-colors overflow-hidden h-full shadow-xs"
                  >
                    <div>
                      {/* Thumbnail Berita */}
                      <div className="relative aspect-video w-full overflow-hidden bg-surface-subtle border-b border-border-subtle">
                        <Image
                          src={item.coverUrl}
                          alt={`${item.title} (Berita)`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 380px"
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        {/* Discrete Type Badge */}
                        <span className="absolute top-2.5 left-2.5 rounded-pill px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-info-soft text-info shadow-xs">
                          Berita
                        </span>
                      </div>

                      {/* Content Body */}
                      <div className="p-4 sm:p-5 space-y-2">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{item.dateFormatted}</span>
                          <span aria-hidden="true">•</span>
                          <span className="font-medium text-primary">{item.categoryLabel}</span>
                        </div>

                        <h3 className="font-sans font-bold text-sm sm:text-base text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>

                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {item.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 pt-0">
                      <Link
                        href={`/kabar/${item.slug}`}
                        className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-primary hover:underline focus-ring rounded-control"
                      >
                        <span>Baca selengkapnya</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </article>
                );
              }

              // Kartu Galeri Dokumentasi (Membuka Lightbox)
              return (
                <article
                  key={item.id}
                  className="group flex flex-col justify-between rounded-card bg-surface border border-border hover:border-primary/40 transition-colors overflow-hidden h-full shadow-xs cursor-pointer"
                  onClick={() => handleOpenAlbum(item.album)}
                >
                  <div>
                    {/* Cover Galeri */}
                    <div className="relative aspect-video w-full overflow-hidden bg-surface-subtle border-b border-border-subtle">
                      <Image
                        src={item.coverUrl}
                        alt={`${item.title} (Galeri)`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 380px"
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {/* Discrete Type Badge */}
                      <span className="absolute top-2.5 left-2.5 rounded-pill px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-success-soft text-success shadow-xs">
                        Galeri
                      </span>
                    </div>

                    {/* Content Body */}
                    <div className="p-4 sm:p-5 space-y-2">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{item.dateFormatted}</span>
                        <span aria-hidden="true">•</span>
                        <span className="font-medium text-success">{item.categoryLabel}</span>
                      </div>

                      <h3 className="font-sans font-bold text-sm sm:text-base text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 pt-0">
                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-primary group-hover:underline focus-ring rounded-control"
                    >
                      <span>Lihat foto dokumentasi</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Tombol Muat Lebih Banyak */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setDisplayLimit((prev) => prev + 6)}
                className="inline-flex min-h-11 items-center justify-center px-6 py-2.5 rounded-control bg-surface-subtle hover:bg-surface border border-border text-foreground font-semibold text-xs sm:text-sm transition-colors focus-ring shadow-xs"
              >
                Muat lebih banyak warta
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Album Modal */}
      <KabarAlbumLightbox
        key={selectedAlbum?.title}
        open={isLightboxOpen}
        onClose={handleCloseLightbox}
        album={selectedAlbum}
      />
    </div>
  );
}
