import React, { useState } from 'react';
import { RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { Badge, Button, Icon, Input, Select, Sheet, type SelectOption } from '../ui/index.ts';
import { cn } from '../../utils/cn.ts';

export interface FilterConfig {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  allValue?: string;
}

export interface SearchToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  filters?: FilterConfig[];
  totalCount?: number;
  filteredCount?: number;
  entityLabel?: string;
  /**
   * Optional secondary operational context shown next to the result count
   * (e.g., "2 menunggu verifikasi · 1 siap ditempatkan")
   */
  resultContext?: React.ReactNode;
  onResetAll?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * SearchToolbar & FilterBar Pattern (Sections 23, 31 & 45 of UI-UX-DESIGN-SYSTEM.md)
 * - Open toolbar layout without unnecessary card wrapping.
 * - Places search close to the data it affects.
 * - Prioritizes key filters inline on desktop and provides a dedicated Sheet on mobile.
 * - Clearly displays active filters, result summary, and a one-click reset action.
 */
export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cari data...',
  searchAriaLabel = 'Pencarian data',
  filters = [],
  totalCount,
  filteredCount,
  entityLabel = 'data',
  resultContext,
  onResetAll,
  actions,
  className,
}) => {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const activeFilters = filters.filter((f) => {
    const defaultVal = f.allValue ?? 'ALL';
    return f.value !== defaultVal && f.value !== '';
  });

  const hasActiveSearchOrFilter =
    searchValue.trim().length > 0 || activeFilters.length > 0;

  const handleReset = () => {
    if (onResetAll) {
      onResetAll();
    } else {
      onSearchChange('');
      for (const f of filters) {
        f.onChange(f.allValue ?? 'ALL');
      }
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input + Primary Desktop Filters */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5 min-w-0">
          <div className="relative flex-1 min-w-[220px] sm:max-w-xs">
            <Input
              type="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchAriaLabel}
              leftIcon={<Icon icon={Search} size="sm" />}
              rightElement={
                searchValue ? (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    aria-label="Bersihkan pencarian"
                    className="p-1 rounded-xs text-muted-foreground hover:text-foreground focus-ring cursor-pointer"
                  >
                    <Icon icon={X} size="xs" />
                  </button>
                ) : undefined
              }
            />
          </div>

          {/* Desktop Inline Filters */}
          {filters.length > 0 && (
            <div className="hidden md:flex flex-wrap items-center gap-2">
              {filters.map((filter) => (
                <div key={filter.id} className="min-w-[155px]">
                  <Select
                    aria-label={filter.label}
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    options={filter.options}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Mobile Filter Sheet Trigger */}
          {filters.length > 0 && (
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Icon icon={SlidersHorizontal} size="sm" />}
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden shrink-0"
            >
              <span>Filter</span>
              {activeFilters.length > 0 && (
                <Badge variant="primary" size="sm">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          )}
        </div>

        {/* Right: Restrained Result Summary & Supplemental Actions (Section 8) */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-x-3 gap-y-1 shrink-0">
          {typeof filteredCount === 'number' && typeof totalCount === 'number' && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 type-caption text-secondary-foreground tabular-nums">
              <span>
                {hasActiveSearchOrFilter ? (
                  <>
                    <strong className="text-foreground font-semibold">
                      {filteredCount}
                    </strong>{' '}
                    {entityLabel} ditemukan
                  </>
                ) : (
                  <>
                    <strong className="text-foreground font-semibold">
                      {totalCount}
                    </strong>{' '}
                    {entityLabel}
                  </>
                )}
              </span>
              {resultContext && (
                <>
                  <span aria-hidden="true" className="text-muted-foreground">
                    ·
                  </span>
                  <span>{resultContext}</span>
                </>
              )}
            </div>
          )}
          {actions}
        </div>
      </div>

      {/* Active Filter Chips & Reset Bar */}
      {hasActiveSearchOrFilter && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="type-caption text-muted-foreground">Filter aktif:</span>

          {searchValue.trim() && (
            <Badge variant="neutral" size="sm" className="gap-1.5 pr-1.5">
              <span>Pencarian: "{searchValue.trim()}"</span>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Hapus kata kunci pencarian"
                className="hover:text-foreground cursor-pointer"
              >
                <Icon icon={X} size="xs" />
              </button>
            </Badge>
          )}

          {activeFilters.map((f) => {
            const selectedOption = f.options.find((o) => o.value === f.value);
            return (
              <Badge key={f.id} variant="primary" size="sm" className="gap-1.5 pr-1.5">
                <span>
                  {f.label}: {selectedOption?.label || f.value}
                </span>
                <button
                  type="button"
                  onClick={() => f.onChange(f.allValue ?? 'ALL')}
                  aria-label={`Hapus filter ${f.label}`}
                  className="hover:text-foreground cursor-pointer"
                >
                  <Icon icon={X} size="xs" />
                </button>
              </Badge>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon icon={RotateCcw} size="xs" />}
            onClick={handleReset}
            className="h-7 px-2 text-xs text-secondary-foreground hover:text-foreground"
          >
            Atur ulang
          </Button>
        </div>
      )}

      {/* Mobile Filter Drawer (Section 23) */}
      {filters.length > 0 && (
        <Sheet
          open={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
          side="bottom"
          title="Filter Daftar Peserta"
          description={`Saring daftar ${entityLabel} berdasarkan kriteria di bawah ini.`}
          footer={
            <div className="w-full flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  handleReset();
                  setMobileFilterOpen(false);
                }}
              >
                Atur ulang
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setMobileFilterOpen(false)}
              >
                Lihat hasil ({filteredCount ?? totalCount ?? 0})
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {filters.map((filter) => (
              <Select
                key={filter.id}
                label={filter.label}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                options={filter.options}
              />
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
};
