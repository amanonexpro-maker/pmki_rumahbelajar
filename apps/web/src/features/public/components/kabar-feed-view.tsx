"use client";

import * as React from "react";
import { KabarEmptyState } from "./kabar-empty-state";
import { cn } from "@/lib/cn";

export type KabarTabFilter = "semua" | "berita" | "galeri";

export interface KabarFeedViewProps {
  initialItems?: unknown[];
}

const FILTER_TABS: readonly { id: KabarTabFilter; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "berita", label: "Berita" },
  { id: "galeri", label: "Galeri" },
] as const;

/**
 * KabarFeedView (Fase 14 Step 3, Scaffold View).
 * Menyediakan filter tab interaktif [Semua] [Berita] [Galeri]
 * dan fallback EmptyState hangat saat konten feed belum tersedia.
 */
export function KabarFeedView({ initialItems = [] }: KabarFeedViewProps) {
  const [activeTab, setActiveTab] = React.useState<KabarTabFilter>("semua");

  // Pada scaffold Step 3, items masih kosong ([]). Step 7 akan mengintegrasikan query publik nyata.
  const filteredItems = React.useMemo(() => {
    if (!initialItems || initialItems.length === 0) return [];
    return initialItems;
  }, [initialItems]);

  return (
    <div className="space-y-6">
      {/* Segmented Control Filter Tabs */}
      <div
        role="tablist"
        aria-label="Filter kategori kabar"
        className="flex gap-2 overflow-x-auto snap-x pb-1"
      >
        {FILTER_TABS.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isSelected}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "min-h-11 rounded-pill px-4 py-2 text-xs sm:text-sm font-medium transition-colors duration-200 focus-ring shrink-0",
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

      {/* Feed List Container */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <KabarEmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feed items will render here in Step 7 */}
          </div>
        )}
      </div>
    </div>
  );
}

