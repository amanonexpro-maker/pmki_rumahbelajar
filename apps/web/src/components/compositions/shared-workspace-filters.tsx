"use client";

import * as React from "react";
import { SearchToolbar } from "@/components/patterns";
import {
  GenericFilterSelect,
  type FilterSelectOption,
} from "./generic-filter-select";

export interface WorkspaceFilterConfig {
  key: string;
  label: string;
  value: string;
  options: readonly FilterSelectOption[];
  defaultValue?: string;
  onChange: (value: string) => void;
}

export interface SharedWorkspaceFiltersProps {
  initialSearch: string;
  onSearchChange: (search: string | null) => void;
  searchPlaceholder: string;
  debounceMs?: number;
  filters: readonly WorkspaceFilterConfig[];
  onResetAll: () => void;
}

export function SharedWorkspaceFilters({
  initialSearch,
  onSearchChange,
  searchPlaceholder,
  debounceMs = 300,
  filters,
  onResetAll,
}: SharedWorkspaceFiltersProps) {
  const [searchInput, setSearchInput] = React.useState(initialSearch);

  React.useEffect(() => {
    if (searchInput === initialSearch) return;
    const t = window.setTimeout(() => {
      onSearchChange(searchInput.trim() || null);
    }, debounceMs);
    return () => window.clearTimeout(t);
  }, [debounceMs, initialSearch, onSearchChange, searchInput]);

  const filterIdPrefix = React.useId();

  const activeFilterCount = filters.filter(
    (f) => f.value !== (f.defaultValue ?? "ALL")
  ).length;

  return (
    <SearchToolbar
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder={searchPlaceholder}
      filterCount={activeFilterCount}
      onResetAll={() => {
        setSearchInput("");
        onResetAll();
      }}
      desktopFilters={
        filters.length > 0 ? (
          <>
            {filters.map((filter) => (
              <GenericFilterSelect
                key={filter.key}
                label={filter.label}
                value={filter.value}
                options={filter.options}
                onChange={filter.onChange}
              />
            ))}
          </>
        ) : undefined
      }
      mobileFilterContent={
        filters.length > 0 ? (
          <div className="space-y-4">
            {filters.map((filter) => {
              const selectId = `${filterIdPrefix}-${filter.key}`;
              return (
                <div key={filter.key} className="space-y-1.5">
                  <label
                    htmlFor={selectId}
                    className="type-label block text-foreground"
                  >
                    {filter.label}
                  </label>
                  <GenericFilterSelect
                    id={selectId}
                    label={filter.label}
                    value={filter.value}
                    options={filter.options}
                    onChange={filter.onChange}
                    className="w-full min-h-11 text-sm"
                  />
                </div>
              );
            })}
          </div>
        ) : undefined
      }
    />
  );
}

