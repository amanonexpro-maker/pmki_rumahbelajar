"use client";

import * as React from "react";
import { SearchToolbar } from "@/components/patterns";
import type { QueryParamUpdates } from "@/hooks/use-url-query-params";
import { MEDIA_CATEGORY_LABELS } from "../types/media-types";
import { MEDIA_CATEGORY_VALUES } from "../validators/media-validator";

export interface MediaFilterBarProps {
  initialSearch: string;
  initialCategory: string;
  initialEligibility: string;
  onUpdateQuery: (updates: QueryParamUpdates) => void;
  onResetAll: () => void;
}

export function MediaFilterBar({
  initialSearch,
  initialCategory,
  initialEligibility,
  onUpdateQuery,
  onResetAll,
}: MediaFilterBarProps) {
  const [searchInput, setSearchInput] = React.useState(initialSearch);

  React.useEffect(() => {
    if (searchInput === initialSearch) return;
    const t = window.setTimeout(() => {
      onUpdateQuery({ search: searchInput.trim() || null });
    }, 300);
    return () => window.clearTimeout(t);
  }, [initialSearch, onUpdateQuery, searchInput]);

  return (
    <SearchToolbar
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Cari judul dokumentasi..."
      filterCount={
        (initialCategory !== "ALL" ? 1 : 0) +
        (initialEligibility !== "ALL" ? 1 : 0)
      }
      onResetAll={() => {
        setSearchInput("");
        onResetAll();
      }}
      desktopFilters={
        <>
          <select
            aria-label="Filter kategori dokumentasi"
            value={initialCategory}
            onChange={(e) => onUpdateQuery({ category: e.target.value })}
            className="h-10 rounded-control border border-border bg-surface px-3 text-xs font-medium text-foreground focus-ring"
          >
            <option value="ALL">Semua kategori</option>
            {MEDIA_CATEGORY_VALUES.map((cat) => (
              <option key={cat} value={cat}>
                {MEDIA_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter status kelayakan publik"
            value={initialEligibility}
            onChange={(e) => onUpdateQuery({ eligibility: e.target.value })}
            className="h-10 rounded-control border border-border bg-surface px-3 text-xs font-medium text-foreground focus-ring"
          >
            <option value="ALL">Semua status tinjauan</option>
            <option value="UNREVIEWED">Menunggu tinjauan privasi</option>
            <option value="PUBLIC">Layak tayang di publik</option>
            <option value="INTERNAL">Hanya arsip internal</option>
          </select>
        </>
      }
    />
  );
}

