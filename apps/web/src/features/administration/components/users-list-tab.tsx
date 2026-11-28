"use client";

import * as React from "react";
import { Sliders, Users } from "lucide-react";
import {
  EmptyState,
  GenericFilterSelect,
  type FilterSelectOption,
} from "@/components/compositions";
import { SearchToolbar } from "@/components/patterns";
import { Badge, Button, Icon } from "@/components/ui";
import { getRoleLabel, type SystemRole } from "@/lib/status";
import type { AdminUserRecordDTO } from "../types/administration-types";

export interface UsersListTabProps {
  paginatedUsers: AdminUserRecordDTO[];
  totalFilteredCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  userSearch: string;
  userStatus: "ALL" | "ACTIVE" | "INACTIVE";
  userUnit: string;
  activeFilterCount: number;
  statusOptions: readonly FilterSelectOption[];
  unitOptions: readonly FilterSelectOption[];
  canManageAny: boolean;
  isOffline: boolean;
  onSearchChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onUnitChange: (val: string) => void;
  onResetFilters: () => void;
  onPageChange: (nextPage: number) => void;
  onSelectUser: (userId: string) => void;
}

export function UsersListTab({
  paginatedUsers,
  totalFilteredCount,
  pageSize,
  currentPage,
  totalPages,
  userSearch,
  userStatus,
  userUnit,
  activeFilterCount,
  statusOptions,
  unitOptions,
  canManageAny,
  isOffline,
  onSearchChange,
  onStatusChange,
  onUnitChange,
  onResetFilters,
  onPageChange,
  onSelectUser,
}: UsersListTabProps) {
  return (
    <div className="space-y-4">
      <SearchToolbar
        searchValue={userSearch}
        onSearchChange={onSearchChange}
        searchPlaceholder="Cari nama, email, atau peran pengguna..."
        filterCount={activeFilterCount}
        onResetAll={onResetFilters}
        resultSummary={
          totalFilteredCount > 0
            ? `Menampilkan ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, totalFilteredCount)} dari ${totalFilteredCount} pengguna`
            : undefined
        }
        desktopFilters={
          <>
            <GenericFilterSelect
              label="Filter status akun"
              value={userStatus}
              onChange={onStatusChange}
              options={statusOptions}
            />
            <GenericFilterSelect
              label="Filter unit layanan"
              value={userUnit}
              onChange={onUnitChange}
              options={unitOptions}
            />
          </>
        }
        mobileFilterContent={
          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-foreground">
                Status akun
              </span>
              <GenericFilterSelect
                label="Filter status akun"
                value={userStatus}
                onChange={onStatusChange}
                options={statusOptions}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-foreground">
                Unit layanan
              </span>
              <GenericFilterSelect
                label="Filter unit layanan"
                value={userUnit}
                onChange={onUnitChange}
                options={unitOptions}
                className="w-full"
              />
            </div>
          </div>
        }
      />

      {totalFilteredCount === 0 ? (
        <EmptyState
          icon={Users}
          title="Pengguna tidak ditemukan"
          description="Tidak ada akun yang cocok dengan kata kunci atau filter yang dipilih. Atur ulang filter untuk menampilkan semua pengguna."
          action={
            userSearch || activeFilterCount > 0 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onResetFilters}
              >
                Tampilkan semua pengguna
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="rounded-card border border-border bg-surface divide-y divide-border">
            {paginatedUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">
                      {u.name}
                    </p>
                    <Badge variant={u.active ? "success" : "danger"} size="sm">
                      {u.active ? "Aktif" : "Nonaktif"}
                    </Badge>
                    {u.roles.map((r) => (
                      <Badge key={r.id} variant="primary" size="sm">
                        {getRoleLabel(r.code as SystemRole) ?? r.name}
                      </Badge>
                    ))}
                    {u.overrides.length > 0 && (
                      <Badge variant="warning" size="sm">
                        {u.overrides.length} izin khusus
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {u.email}
                  </p>
                  <p className="text-xs text-secondary-foreground">
                    Lingkup:{" "}
                    {u.memberships.length > 0
                      ? u.memberships
                          .map(
                            (m) =>
                              `${m.organizationName} → ${m.serviceUnitName}`
                          )
                          .join(" · ")
                      : "Belum ditetapkan"}
                  </p>
                </div>

                {canManageAny && (
                  <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isOffline}
                      onClick={() => onSelectUser(u.id)}
                      leftIcon={<Icon icon={Sliders} size="xs" />}
                      className="w-full lg:w-auto"
                    >
                      Kelola akun
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-muted-foreground">
                Halaman {currentPage} dari {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                >
                  Sebelumnya
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    onPageChange(Math.min(totalPages, currentPage + 1))
                  }
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

