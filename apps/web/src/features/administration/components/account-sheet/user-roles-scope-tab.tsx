"use client";

import * as React from "react";
import Link from "next/link";
import {
  Icon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import type { ScopeCatalogDTO } from "@/features/organization";
import { getRoleLabel, type SystemRole } from "@/lib/status";
import type {
  AdminRoleRecordDTO,
  AdminUserRecordDTO,
} from "../../types/administration-types";

export interface UserRolesScopeTabProps {
  currentUser: AdminUserRecordDTO;
  primaryRoles: AdminRoleRecordDTO[];
  advancedRoles: AdminRoleRecordDTO[];
  selectedRoles: string[];
  onToggleRole: (roleCode: string) => void;
  showAdvancedRoles: boolean;
  onToggleAdvancedRoles: () => void;
  scopeCatalog: ScopeCatalogDTO;
  orgId: string;
  onOrgChange: (val: string) => void;
  unitId: string;
  onUnitChange: (val: string) => void;
  programId: string;
  onProgramChange: (val: string) => void;
  canManageRoles: boolean;
  canManageUsers: boolean;
  pending: boolean;
  isOffline: boolean;
}

function RoleChipButton({
  role,
  checked,
  disabled,
  onToggle,
}: {
  role: AdminRoleRecordDTO;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const label = getRoleLabel(role.code as SystemRole) ?? role.name;
  return (
    <button
      type="button"
      aria-pressed={checked}
      disabled={disabled}
      onClick={onToggle}
      className={
        checked
          ? "inline-flex items-center gap-1.5 rounded-pill border border-primary bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary transition-colors cursor-pointer focus-ring"
          : "inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:text-foreground hover:border-border-strong transition-colors cursor-pointer focus-ring"
      }
    >
      {checked && (
        <Icon icon={ICON_MAP.centang} size="xs" aria-hidden="true" />
      )}
      <span>{label}</span>
    </button>
  );
}

export function UserRolesScopeTab({
  currentUser,
  primaryRoles,
  advancedRoles,
  selectedRoles,
  onToggleRole,
  showAdvancedRoles,
  onToggleAdvancedRoles,
  scopeCatalog,
  orgId,
  onOrgChange,
  unitId,
  onUnitChange,
  programId,
  onProgramChange,
  canManageRoles,
  canManageUsers,
  pending,
  isOffline,
}: UserRolesScopeTabProps) {
  const isTeacherRole = selectedRoles.some(
    (code) => code === "TEACHER" || code === "VOLUNTEER"
  );
  const hasLinkedTeacher = (currentUser.linkedTeacherUnits?.length ?? 0) > 0;
  const disabled = pending || isOffline;

  return (
    <div className="space-y-6">
      {canManageRoles && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon
                icon={ICON_MAP.shieldCheck}
                size="sm"
                className="text-primary shrink-0"
              />
              <h3 className="text-sm font-semibold text-foreground">
                Peran yang dipegang
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {selectedRoles.length} dipilih
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {primaryRoles.map((r) => (
              <RoleChipButton
                key={r.id}
                role={r}
                checked={selectedRoles.includes(r.code)}
                disabled={disabled}
                onToggle={() => onToggleRole(r.code)}
              />
            ))}
          </div>

          {advancedRoles.length > 0 && (
            <div className="pt-1 space-y-2">
              <button
                type="button"
                aria-expanded={showAdvancedRoles}
                onClick={onToggleAdvancedRoles}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline cursor-pointer focus-ring rounded-xs"
              >
                <span>
                  {showAdvancedRoles
                    ? "Sembunyikan peran tata kelola & sistem"
                    : `Tampilkan peran tata kelola & sistem (${advancedRoles.length})`}
                </span>
                <Icon
                  icon={ICON_MAP.chevronRight}
                  size="xs"
                  className={
                    showAdvancedRoles
                      ? "rotate-90 transition-transform duration-150"
                      : "transition-transform duration-150"
                  }
                />
              </button>

              {showAdvancedRoles && (
                <div className="rounded-control bg-surface-subtle/60 p-3 space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Peran tata kelola &amp; sistem
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {advancedRoles.map((r) => (
                      <RoleChipButton
                        key={r.id}
                        role={r}
                        checked={selectedRoles.includes(r.code)}
                        disabled={disabled}
                        onToggle={() => onToggleRole(r.code)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {canManageUsers && (
        <div className="space-y-3 pt-5 border-t border-border">
          <div className="flex items-center gap-2">
            <Icon
              icon={ICON_MAP.lokasi}
              size="sm"
              className="text-primary shrink-0"
            />
            <h3 className="text-sm font-semibold text-foreground">
              Lingkup unit layanan &amp; program
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-secondary-foreground">
                Organisasi
              </label>
              <Select value={orgId} onValueChange={onOrgChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                  {scopeCatalog.organizations.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-secondary-foreground">
                Unit layanan
              </label>
              <Select value={unitId} onValueChange={onUnitChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                  {scopeCatalog.serviceUnits.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-secondary-foreground">
              Program (opsional)
            </label>
            <Select value={programId} onValueChange={onProgramChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                <SelectItem value="NONE">Semua program di unit</SelectItem>
                {scopeCatalog.programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {isTeacherRole && (
        <div className="rounded-control bg-surface-subtle/60 px-3.5 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-secondary-foreground">
            <Icon
              icon={ICON_MAP.info}
              size="xs"
              className="text-primary shrink-0"
            />
            <span>
              {hasLinkedTeacher
                ? `Tertaut ke Pengajar: ${currentUser.linkedTeacherUnits?.map((t) => t.serviceUnitName).join(", ")}`
                : "Belum tertaut ke data Pengajar di Kelas & Pengajar."}
            </span>
          </span>
          {!hasLinkedTeacher && (
            <Link
              href="/workspace/academic"
              className="text-primary font-medium hover:underline shrink-0"
            >
              Atur sekarang →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

