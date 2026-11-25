"use client";

import * as React from "react";
import {
  SharedWorkspaceFilters,
  type WorkspaceFilterConfig,
} from "@/components/compositions";
import type { QueryParamUpdates } from "@/hooks/use-url-query-params";
import { REPORT_STATUS_META } from "@/lib/status";
import { REPORT_TYPE_LABELS } from "../types/governance-types";
import { REPORT_TYPE_VALUES } from "../validators/governance-validator";

export interface GovernanceFilterBarProps {
  initialSearch: string;
  initialStatus: string;
  initialType: string;
  onUpdateQuery: (updates: QueryParamUpdates) => void;
  onResetAll: () => void;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "Semua status laporan" },
  { value: "DRAFT", label: REPORT_STATUS_META.DRAFT.label },
  { value: "PROGRAM_REVIEW", label: REPORT_STATUS_META.PROGRAM_REVIEW.label },
  { value: "UNIT_VALIDATION", label: REPORT_STATUS_META.UNIT_VALIDATION.label },
  {
    value: "ORGANIZATION_APPROVAL",
    label: REPORT_STATUS_META.ORGANIZATION_APPROVAL.label,
  },
  { value: "APPROVED", label: REPORT_STATUS_META.APPROVED.label },
  { value: "REJECTED", label: REPORT_STATUS_META.REJECTED.label },
] as const;

const TYPE_OPTIONS = [
  { value: "ALL", label: "Semua jenis laporan" },
  ...REPORT_TYPE_VALUES.map((typeCode) => ({
    value: typeCode,
    label: REPORT_TYPE_LABELS[typeCode],
  })),
];

export function GovernanceFilterBar({
  initialSearch,
  initialStatus,
  initialType,
  onUpdateQuery,
  onResetAll,
}: GovernanceFilterBarProps) {
  const handleSearchChange = React.useCallback(
    (search: string | null) => onUpdateQuery({ search }),
    [onUpdateQuery]
  );

  const filters: WorkspaceFilterConfig[] = [
    {
      key: "status",
      label: "Filter status laporan",
      value: initialStatus,
      options: STATUS_OPTIONS,
      onChange: (value) => onUpdateQuery({ status: value }),
    },
    {
      key: "type",
      label: "Filter jenis laporan",
      value: initialType,
      options: TYPE_OPTIONS,
      onChange: (value) => onUpdateQuery({ type: value }),
    },
  ];

  return (
    <SharedWorkspaceFilters
      initialSearch={initialSearch}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Cari judul atau periode laporan..."
      filters={filters}
      onResetAll={onResetAll}
    />
  );
}
