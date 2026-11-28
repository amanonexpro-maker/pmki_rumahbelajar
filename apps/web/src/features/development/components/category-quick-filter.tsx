"use client";

import * as React from "react";
import type { DevelopmentCategoryDTO } from "../types/development-types";

export interface CategoryQuickFilterProps {
  categories: DevelopmentCategoryDTO[];
  activeCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

const MOBILE_PILLS_PER_PAGE = 3;

export function CategoryQuickFilter({
  categories,
  activeCategoryId,
  onSelectCategory,
}: CategoryQuickFilterProps) {
  const pillOptions = React.useMemo(
    () => [
      { id: "ALL", name: "Semua kategori" },
      ...categories.map((c) => ({ id: c.id, name: c.name })),
    ],
    [categories]
  );

  const mobilePages = React.useMemo(() => {
    const pages: Array<Array<{ id: string; name: string }>> = [];
    for (let i = 0; i < pillOptions.length; i += MOBILE_PILLS_PER_PAGE) {
      pages.push(pillOptions.slice(i, i + MOBILE_PILLS_PER_PAGE));
    }
    return pages;
  }, [pillOptions]);

  const totalMobilePages = Math.max(1, mobilePages.length);
  const [mobilePage, setMobilePage] = React.useState(0);
  const safeMobilePage = Math.min(mobilePage, totalMobilePages - 1);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleMobileScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth <= 0) return;
    const nextPage = Math.min(
      totalMobilePages - 1,
      Math.max(0, Math.round(el.scrollLeft / el.clientWidth))
    );
    setMobilePage((prev) => (prev === nextPage ? prev : nextPage));
  }, [totalMobilePages]);

  const goToMobilePage = React.useCallback((idx: number) => {
    setMobilePage(idx);
    const el = scrollRef.current;
    if (el && el.clientWidth > 0) {
      el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
    }
  }, []);

  if (categories.length === 0) return null;

  function renderPill(opt: { id: string; name: string }) {
    const isActive = activeCategoryId === opt.id;
    return (
      <button
        key={opt.id}
        type="button"
        onClick={() =>
          onSelectCategory(opt.id === "ALL" || isActive ? "ALL" : opt.id)
        }
        className={
          isActive
            ? "rounded-pill border border-primary bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary cursor-pointer focus-ring"
            : "rounded-pill border border-border bg-surface px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:text-foreground cursor-pointer focus-ring"
        }
      >
        {opt.name}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Filter cepat kategori perkembangan"
      className="sm:col-span-2 pt-1"
    >
      {/* Desktop: tampilkan seluruh pill tanpa terpotong */}
      <div className="hidden sm:flex flex-wrap items-center gap-1.5">
        {pillOptions.map(renderPill)}
      </div>

      {/* Mobile: swipeable horizontal pages + dot indicator yang sinkron */}
      <div className="sm:hidden space-y-1.5">
        <div
          ref={scrollRef}
          onScroll={handleMobileScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {mobilePages.map((pagePills, pageIdx) => (
            <div
              key={pageIdx}
              className="w-full shrink-0 snap-start flex flex-wrap items-center gap-1.5"
            >
              {pagePills.map(renderPill)}
            </div>
          ))}
        </div>

        {totalMobilePages > 1 && (
          <div
            className="flex items-center justify-center gap-1 pt-0.5"
            role="navigation"
            aria-label="Halaman kategori perkembangan"
          >
            {Array.from({ length: totalMobilePages }).map((_, idx) => {
              const isCurrent = idx === safeMobilePage;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToMobilePage(idx)}
                  aria-label={`Halaman kategori ${idx + 1} dari ${totalMobilePages}`}
                  aria-current={isCurrent ? "page" : undefined}
                  className="inline-flex h-8 min-w-[28px] items-center justify-center px-1 cursor-pointer focus-ring rounded-pill"
                >
                  <span
                    className={
                      isCurrent
                        ? "h-2 w-5 rounded-full bg-primary transition-all duration-150"
                        : "h-2 w-2 rounded-full bg-border hover:bg-muted-foreground/60 transition-all duration-150"
                    }
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

