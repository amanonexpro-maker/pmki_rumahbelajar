"use client";

import * as React from "react";
import {
  SharedWorkspaceFilters,
  type WorkspaceFilterConfig,
} from "@/components/compositions";
import type { QueryParamUpdates } from "@/hooks/use-url-query-params";
import { PUBLICATION_STATUS_META } from "@/lib/status";

export interface PublishingFilterBarProps {
  initialSearch: string;
  initialStatus: string;
  onUpdateQuery: (updates: QueryParamUpdates) => void;
  onResetAll: () => void;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "Semua status publikasi" },
  { value: "DRAFT", label: PUBLICATION_STATUS_META.DRAFT.label },
  {
    value: "PRIVACY_REVIEW",
    label: PUBLICATION_STATUS_META.PRIVACY_REVIEW.label,
  },
  { value: "APPROVED", label: PUBLICATION_STATUS_META.APPROVED.label },
  { value: "PUBLISHED", label: PUBLICATION_STATUS_META.PUBLISHED.label },
  { value: "ARCHIVED", label: PUBLICATION_STATUS_META.ARCHIVED.label },
] as const;

export function PublishingFilterBar({
  initialSearch,
  initialStatus,
  onUpdateQuery,
  onResetAll,
}: PublishingFilterBarProps) {
  const handleSearchChange = React.useCallback(
    (search: string | null) => onUpdateQuery({ search }),
    [onUpdateQuery]
  );

  const filters: WorkspaceFilterConfig[] = [
    {
      key: "status",
      label: "Filter status publikasi",
      value: initialStatus,
      options: STATUS_OPTIONS,
      onChange: (value) => onUpdateQuery({ status: value }),
    },
  ];

  return (
    <SharedWorkspaceFilters
      initialSearch={initialSearch}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Cari judul publikasi..."
      filters={filters}
      onResetAll={onResetAll}
    />
  );
}
