"use client";

import * as React from "react";
import {
  SharedWorkspaceFilters,
  type WorkspaceFilterConfig,
} from "@/components/compositions";
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

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "Semua kategori" },
  ...MEDIA_CATEGORY_VALUES.map((cat) => ({
    value: cat,
    label: MEDIA_CATEGORY_LABELS[cat],
  })),
];

const ELIGIBILITY_OPTIONS = [
  { value: "ALL", label: "Semua status tinjauan" },
  { value: "UNREVIEWED", label: "Menunggu tinjauan privasi" },
  { value: "PUBLIC", label: "Layak tayang di publik" },
  { value: "INTERNAL", label: "Hanya arsip internal" },
] as const;

export function MediaFilterBar({
  initialSearch,
  initialCategory,
  initialEligibility,
  onUpdateQuery,
  onResetAll,
}: MediaFilterBarProps) {
  const handleSearchChange = React.useCallback(
    (search: string | null) => onUpdateQuery({ search }),
    [onUpdateQuery]
  );

  const filters: WorkspaceFilterConfig[] = [
    {
      key: "category",
      label: "Filter kategori dokumentasi",
      value: initialCategory,
      options: CATEGORY_OPTIONS,
      onChange: (value) => onUpdateQuery({ category: value }),
    },
    {
      key: "eligibility",
      label: "Filter status kelayakan publik",
      value: initialEligibility,
      options: ELIGIBILITY_OPTIONS,
      onChange: (value) => onUpdateQuery({ eligibility: value }),
    },
  ];

  return (
    <SharedWorkspaceFilters
      initialSearch={initialSearch}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Cari judul dokumentasi..."
      filters={filters}
      onResetAll={onResetAll}
    />
  );
}
