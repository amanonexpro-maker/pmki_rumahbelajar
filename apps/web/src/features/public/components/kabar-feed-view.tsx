"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { formatToIndonesianStandard } from "@/utils/date-formatter";
import { deduplicateFeedItems } from "../utils/feed-deduplicator";
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
  date?: string;
  rawTimestamp?: string;
  excerpt: string;
  coverUrl: string;
}

export interface HybridGalleryFeedItem {
  id: string;
  slug: string;
  type: "galeri";
  title: string;
  categoryLabel: string;
  dateFormatted: string;
  date?: string;
  rawTimestamp?: string;
  coverUrl: string;
  description: string;
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
  const searchParams = useSearchParams();
  const queryTab = searchParams ? (searchParams.get("tab") as KabarTabFilter | null) : null;
  const resolvedTab: KabarTabFilter =
    queryTab === "galeri" || queryTab === "berita" || queryTab === "semua"
      ? queryTab
      : initialTab;

  const [activeTab, setActiveTab] = React.useState<KabarTabFilter>(resolvedTab);
  const [prevQueryTab, setPrevQueryTab] = React.useState(queryTab);
  const [displayLimit, setDisplayLimit] = React.useState(INITIAL_DISPLAY_LIMIT);

  if (queryTab !== prevQueryTab) {
    setPrevQueryTab(queryTab);
    if (
      queryTab === "galeri" ||
      queryTab === "berita" ||
      queryTab === "semua"
    ) {
      setActiveTab(queryTab);
      setDisplayLimit(INITIAL_DISPLAY_LIMIT);
    }
  }

  // Transformasi data real ke model feed hybrid dengan penjaminan tanggal absolut Indonesia
  const allHybridItems = React.useMemo<HybridFeedItem[]>(() => {
    const formattedNews: HybridNewsFeedItem[] = newsItems.map((post) => {
      const resolvedDate = post.publishedDateFormatted || post.publishedAt;
      const formattedDate = formatToIndonesianStandard(resolvedDate, "1 Agustus 2026");

      return {
        id: `news-${post.id}`,
        type: "berita",
        title: post.title,
        slug: post.slug,
        categoryLabel: post.categoryLabel,
        dateFormatted: formattedDate,
        date: formattedDate,
        rawTimestamp: post.publishedAt || "2026-08-01",
        excerpt: post.excerpt,
        coverUrl: post.coverSignedUrl,
      };
    });

    const formattedGallery: HybridGalleryFeedItem[] = galleryItems.map((item) => {
      const generatedSlug = item.slug || item.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

      const resolvedDate = item.date || item.capturedDate;
      const formattedDate = formatToIndonesianStandard(resolvedDate, "24 Oktober 2026");

      return {
        id: `gallery-${item.id}`,
        slug: generatedSlug.length > 3 ? generatedSlug : `galeri-${item.id}`,
        type: "galeri",
        title: item.title,
        categoryLabel: item.categoryLabel,
        dateFormatted: formattedDate,
        date: formattedDate,
        rawTimestamp: item.rawTimestamp || (typeof resolvedDate === "string" ? resolvedDate : "2026-10-24"),
        coverUrl: item.signedReadUrl,
        description: item.description,
      };
    });

    // Urutkan descending berdasarkan timestamp riil sebelum digabung
    const sortedNews = [...formattedNews].sort((a, b) => {
      const tA = new Date(a.rawTimestamp || 0).getTime();
      const tB = new Date(b.rawTimestamp || 0).getTime();
      return tB - tA;
    });

    const sortedGallery = [...formattedGallery].sort((a, b) => {
      const tA = new Date(a.rawTimestamp || 0).getTime();
      const tB = new Date(b.rawTimestamp || 0).getTime();
      return tB - tA;
    });

    // Gabung secara interleave / urut
    const combined: HybridFeedItem[] = [];
    const maxLen = Math.max(sortedNews.length, sortedGallery.length);
    for (let i = 0; i < maxLen; i++) {
      if (sortedNews[i]) combined.push(sortedNews[i]);
      if (sortedGallery[i]) combined.push(sortedGallery[i]);
    }
    return combined;
  }, [newsItems, galleryItems]);

  // Filter berdasarkan activeTab (dengan deduplikasi cerdas pada tab 'semua')
  const filteredItems = React.useMemo(() => {
    if (activeTab === "berita") {
      return allHybridItems.filter((item) => item.type === "berita");
    }
    if (activeTab === "galeri") {
      return allHybridItems.filter((item) => item.type === "galeri");
    }
    return deduplicateFeedItems(allHybridItems);
  }, [allHybridItems, activeTab]);

  const visibleItems = filteredItems.slice(0, displayLimit);
  const hasMore = filteredItems.length > displayLimit;

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
                  if (typeof window !== "undefined") {
                    const url = new URL(window.location.href);
                    if (tab.id === "semua") {
                      url.searchParams.delete("tab");
                    } else {
                      url.searchParams.set("tab", tab.id);
                    }
                    window.history.replaceState(null, "", url.toString());
                  }
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
                  <Link
                    key={item.id}
                    href={`/kabar/${item.slug}`}
                    className="group flex flex-col justify-between rounded-card bg-surface border border-border hover:border-primary/40 transition-all duration-200 overflow-hidden h-full shadow-xs hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.99] text-inherit no-underline"
                    aria-label={`Buka berita: ${item.title}`}
                  >
                    <div>
                      {/* Thumbnail Berita */}
                      <div className="relative aspect-video w-full overflow-hidden bg-surface-subtle border-b border-border-subtle">
                        <Image
                          src={item.coverUrl}
                          alt={`${item.title} (Berita)`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 380px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
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
                      <span className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                        <span>Baca selengkapnya</span>
                        <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </Link>
                );
              }

              // Kartu Galeri Dokumentasi (Mengarahkan ke Halaman Album Detail)
              return (
                <Link
                  key={item.id}
                  href={`/kabar/${item.slug}`}
                  className="group flex flex-col justify-between rounded-card bg-surface border border-border hover:border-primary/40 transition-all duration-200 overflow-hidden h-full shadow-xs hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.99] text-inherit no-underline"
                  aria-label={`Buka album dokumentasi: ${item.title}`}
                >
                  <div>
                    {/* Cover Galeri */}
                    <div className="relative aspect-video w-full overflow-hidden bg-surface-subtle border-b border-border-subtle">
                      <Image
                        src={item.coverUrl}
                        alt={`${item.title} (Galeri)`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 380px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
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
                    <span className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                      <span>Lihat album dokumentasi</span>
                      <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
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
    </div>
  );
}
