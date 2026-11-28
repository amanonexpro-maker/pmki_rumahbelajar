"use client";

import * as React from "react";
import {
  Icon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import type {
  AdminPermissionRecordDTO,
  AdminUserOverrideDTO,
} from "../../types/administration-types";
import { getPermissionModuleLabel } from "../administration-labels";

export interface UserOverridesTabProps {
  userId: string;
  overrides: AdminUserOverrideDTO[];
  permissionGroups: Array<[string, AdminPermissionRecordDTO[]]>;
  selectedPermModule: string;
  onSelectPermModule: (mod: string) => void;
  filteredPermissions: AdminPermissionRecordDTO[];
  roleInheritedPerms: Set<string>;
  selectedOverridePerms: string[];
  onToggleOverridePerm: (code: string) => void;
  onClearSelectedPerms: () => void;
  onSelectActiveOverride: (ov: AdminUserOverrideDTO, modLabel: string) => void;
  overrideMode: "GRANT" | "REVOKE";
  onChangeOverrideMode: (mode: "GRANT" | "REVOKE") => void;
  overrideReason: string;
  onChangeOverrideReason: (reason: string) => void;
  onRemoveOverride: (userId: string, permissionCode: string) => Promise<boolean>;
  pending: boolean;
  isOffline: boolean;
}

function ActiveOverridesCard({
  userId,
  overrides,
  pending,
  isOffline,
  onSelectActiveOverride,
  onRemoveOverride,
}: {
  userId: string;
  overrides: AdminUserOverrideDTO[];
  pending: boolean;
  isOffline: boolean;
  onSelectActiveOverride: (ov: AdminUserOverrideDTO, modLabel: string) => void;
  onRemoveOverride: (userId: string, permissionCode: string) => Promise<boolean>;
}) {
  return (
    <div className="rounded-control bg-surface-subtle/60 p-3.5 space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <h3 className="text-sm font-semibold text-foreground">
          Izin khusus aktif
        </h3>
        <span className="text-[11px] text-muted-foreground">
          Klik untuk pilih, atau × untuk hapus
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {overrides.map((ov) => {
          const isGrant = ov.mode === "GRANT";
          return (
            <div
              key={`${ov.permissionCode}-${ov.mode}`}
              className={
                isGrant
                  ? "inline-flex items-center rounded-pill border border-primary/30 bg-primary-soft text-primary text-xs font-medium overflow-hidden"
                  : "inline-flex items-center rounded-pill border border-danger/30 bg-danger-soft text-danger text-xs font-medium overflow-hidden"
              }
            >
              <button
                type="button"
                onClick={() =>
                  onSelectActiveOverride(
                    ov,
                    getPermissionModuleLabel(ov.permissionCode)
                  )
                }
                title={`Klik untuk memilih ${ov.permissionName} (${ov.permissionCode})`}
                className="px-2.5 py-1 hover:opacity-80 cursor-pointer focus-ring"
              >
                {isGrant ? "Berikan" : "Cabut"}: {ov.permissionName}
              </button>
              <button
                type="button"
                disabled={pending || isOffline}
                onClick={() => void onRemoveOverride(userId, ov.permissionCode)}
                aria-label={`Hapus izin khusus ${ov.permissionName}`}
                title="Hapus izin khusus & kembali ke bawaan peran"
                className="px-2 py-1 border-l border-current/20 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer focus-ring disabled:opacity-40"
              >
                <Icon icon={ICON_MAP.tutup} size="xs" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function UserOverridesTab({
  userId,
  overrides,
  permissionGroups,
  selectedPermModule,
  onSelectPermModule,
  filteredPermissions,
  roleInheritedPerms,
  selectedOverridePerms,
  onToggleOverridePerm,
  onClearSelectedPerms,
  onSelectActiveOverride,
  overrideMode,
  onChangeOverrideMode,
  overrideReason,
  onChangeOverrideReason,
  onRemoveOverride,
  pending,
  isOffline,
}: UserOverridesTabProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-control bg-surface-subtle/60 px-3.5 py-2.5 flex items-start gap-2 text-xs text-secondary-foreground leading-relaxed">
        <Icon
          icon={ICON_MAP.info}
          size="xs"
          className="text-primary shrink-0 mt-0.5"
        />
        <span>
          Gunakan tab ini hanya untuk pengecualian 1–2 izin. Untuk tambahan
          tugas rutin, lebih sederhana menggabungkan peran di tab{" "}
          <strong className="text-foreground">Peran &amp; Lingkup</strong>.
        </span>
      </div>

      {overrides.length > 0 && (
        <ActiveOverridesCard
          userId={userId}
          overrides={overrides}
          pending={pending}
          isOffline={isOffline}
          onSelectActiveOverride={onSelectActiveOverride}
          onRemoveOverride={onRemoveOverride}
        />
      )}

      <div className="space-y-3.5">
        <div className="flex items-center gap-2">
          <Icon
            icon={ICON_MAP.shieldCheck}
            size="sm"
            className="text-primary shrink-0"
          />
          <h3 className="text-sm font-semibold text-foreground">
            Tambah atau ubah izin khusus
          </h3>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-secondary-foreground">
            1. Pilih modul
          </label>
          <Select value={selectedPermModule} onValueChange={onSelectPermModule}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih modul" />
            </SelectTrigger>
            <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
              {permissionGroups.map(([modLabel, items]) => {
                const selectedInMod = items.filter((p) =>
                  selectedOverridePerms.includes(p.code)
                ).length;
                return (
                  <SelectItem key={modLabel} value={modLabel}>
                    {modLabel} ({items.length})
                    {selectedInMod > 0 ? ` · ${selectedInMod} dipilih` : ""}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-secondary-foreground">
              2. Pilih satu atau beberapa hak akses
            </span>
            <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{selectedOverridePerms.length} dipilih</span>
              {selectedOverridePerms.length > 0 && (
                <button
                  type="button"
                  onClick={onClearSelectedPerms}
                  className="text-primary font-medium hover:underline cursor-pointer"
                >
                  Bersihkan
                </button>
              )}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {filteredPermissions.map((p) => {
              const isSelected = selectedOverridePerms.includes(p.code);
              const fromRole = roleInheritedPerms.has(p.code);
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={pending || isOffline}
                  onClick={() => onToggleOverridePerm(p.code)}
                  className={
                    isSelected
                      ? "inline-flex items-center gap-1 rounded-pill border border-primary bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary transition-colors cursor-pointer focus-ring"
                      : "inline-flex items-center gap-1 rounded-pill border border-border bg-surface px-2.5 py-1 text-xs font-medium text-secondary-foreground hover:text-foreground hover:border-border-strong transition-colors cursor-pointer focus-ring"
                  }
                >
                  {isSelected && (
                    <Icon
                      icon={ICON_MAP.centang}
                      size="xs"
                      aria-hidden="true"
                    />
                  )}
                  <span>{p.name}</span>
                  {fromRole && (
                    <span className="text-[10px] opacity-75">(dari peran)</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1">
          <span className="block text-xs font-medium text-secondary-foreground">
            Tindakan
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChangeOverrideMode("GRANT")}
              className={
                overrideMode === "GRANT"
                  ? "rounded-control border border-primary bg-primary-soft px-3 py-2 text-xs font-semibold text-primary cursor-pointer focus-ring"
                  : "rounded-control border border-border bg-surface px-3 py-2 text-xs font-medium text-secondary-foreground hover:text-foreground cursor-pointer focus-ring"
              }
            >
              Berikan izin (GRANT)
            </button>
            <button
              type="button"
              onClick={() => onChangeOverrideMode("REVOKE")}
              className={
                overrideMode === "REVOKE"
                  ? "rounded-control border border-danger bg-danger-soft px-3 py-2 text-xs font-semibold text-danger cursor-pointer focus-ring"
                  : "rounded-control border border-border bg-surface px-3 py-2 text-xs font-medium text-secondary-foreground hover:text-foreground cursor-pointer focus-ring"
              }
            >
              Cabut paksa (REVOKE)
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-secondary-foreground">
            Alasan perubahan (wajib untuk Jejak Audit) *
          </label>
          <Textarea
            rows={2}
            placeholder="Contoh: Membantu menyusun draf publikasi kegiatan..."
            value={overrideReason}
            onChange={(e) => onChangeOverrideReason(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

