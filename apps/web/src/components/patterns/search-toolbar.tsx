"use client";

import * as React from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { SearchInput } from "@/components/compositions";
import {
  Badge,
  Button,
  Icon,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui";
import { cn } from "@/lib/cn";

export interface SearchToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterCount?: number;
  desktopFilters?: React.ReactNode;
  mobileFilterContent?: React.ReactNode;
  resultSummary?: React.ReactNode;
  onResetAll?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export function SearchToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Cari peserta didik...",
  filterCount = 0,
  desktopFilters,
  mobileFilterContent,
  resultSummary,
  onResetAll,
  actions,
  className,
}: SearchToolbarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const hasActive = searchValue.trim().length > 0 || filterCount > 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2.5 min-w-0">
          <div className="flex-1 min-w-[220px] max-w-md">
            <SearchInput
              value={searchValue}
              onValueChange={onSearchChange}
              placeholder={searchPlaceholder}
            />
          </div>

          {desktopFilters && (
            <div className="hidden md:flex flex-wrap items-center gap-2">
              {desktopFilters}
            </div>
          )}

          {mobileFilterContent && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setMobileOpen(true)}
              leftIcon={<Icon icon={SlidersHorizontal} size="sm" />}
              className="md:hidden"
            >
              <span>Filter</span>
              {filterCount > 0 && (
                <Badge variant="primary" size="sm">
                  {filterCount}
                </Badge>
              )}
            </Button>
          )}

          {hasActive && onResetAll && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Icon icon={RotateCcw} size="xs" />}
              onClick={onResetAll}
            >
              Atur ulang
            </Button>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {resultSummary && (
        <div className="type-caption text-secondary-foreground">
          {resultSummary}
        </div>
      )}

      {mobileFilterContent && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="bottom" className="md:hidden">
            <SheetHeader>
              <SheetTitle>Filter data</SheetTitle>
              <SheetDescription>
                Saring daftar sesuai kebutuhan operasional Anda.
              </SheetDescription>
            </SheetHeader>
            <SheetBody className="space-y-4">{mobileFilterContent}</SheetBody>
            <SheetFooter>
              {onResetAll && (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    onResetAll();
                    setMobileOpen(false);
                  }}
                >
                  Atur ulang
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                onClick={() => setMobileOpen(false)}
              >
                Terapkan filter
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

