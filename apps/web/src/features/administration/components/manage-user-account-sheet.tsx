"use client";

import * as React from "react";
import Link from "next/link";
import { FormBottomSheet } from "@/components/patterns";
import {
  Badge,
  Button,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { DEFAULT_GENERIC_PASSWORD } from "@/features/identity/validators/auth-validator";
import { getRoleLabel, type SystemRole } from "@/lib/status";
import type {
  AdminPermissionRecordDTO,
  AdminRoleRecordDTO,
  AdminUserRecordDTO,
} from "../types/administration-types";
import type { ScopeCatalogDTO } from "@/features/organization";

export interface ManageUserAccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUserRecordDTO | null;
  currentUserId: string;
  roles: AdminRoleRecordDTO[];
  permissions: AdminPermissionRecordDTO[];
  scopeCatalog: ScopeCatalogDTO;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManagePermissions: boolean;
  pending: boolean;
  isOffline: boolean;
  onSaveRoles: (userId: string, roleCodes: string[]) => Promise<boolean>;
  onSaveScope: (values: {
    userId: string;
    organizationId: string;
    serviceUnitId: string;
    programId?: string | null;
  }) => Promise<boolean>;
  onApplyOverride: (values: {
    userId: string;
    permissionCode: string;
    mode: "GRANT" | "REVOKE";
    reason: string;
  }) => Promise<boolean>;
  onToggleActive: (
    userId: string,
    active: boolean,
    reason: string | null
  ) => Promise<boolean>;
  onResetDefaultPassword: (userId: string) => Promise<boolean>;
}

export function ManageUserAccountSheet({
  open,
  onOpenChange,
  user,
  currentUserId,
  roles,
  permissions,
  scopeCatalog,
  canManageUsers,
  canManageRoles,
  canManagePermissions,
  pending,
  isOffline,
  onSaveRoles,
  onSaveScope,
  onApplyOverride,
  onToggleActive,
  onResetDefaultPassword,
}: ManageUserAccountSheetProps) {
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>(
    () => user?.roles.map((r) => r.code) ?? []
  );
  const [orgId, setOrgId] = React.useState(
    () =>
      user?.memberships[0]?.organizationId ??
      scopeCatalog.organizations[0]?.id ??
      ""
  );
  const [unitId, setUnitId] = React.useState(
    () =>
      user?.memberships[0]?.serviceUnitId ??
      scopeCatalog.serviceUnits[0]?.id ??
      ""
  );
  const [programId, setProgramId] = React.useState(
    () => user?.memberships[0]?.programId ?? "NONE"
  );

  const [overridePerm, setOverridePerm] = React.useState(
    () => permissions[0]?.code ?? ""
  );
  const [overrideMode, setOverrideMode] = React.useState<"GRANT" | "REVOKE">(
    "GRANT"
  );
  const [overrideReason, setOverrideReason] = React.useState("");
  const [toggleReason, setToggleReason] = React.useState("");

  if (!user) return null;

  const isTeacherRole = user.roles.some(
    (r) => r.code === "TEACHER" || r.code === "VOLUNTEER"
  );
  const hasLinkedTeacher = (user.linkedTeacherUnits?.length ?? 0) > 0;

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Kelola akun · ${user.name}`}
      description={`${user.email} — Pengaturan peran, lingkup unit, pengecualian izin, dan status akun dalam satu tempat.`}
      footer={(_, isMobile) => (
        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenChange(false)}
          fullWidth={isMobile}
        >
          Tutup
        </Button>
      )}
    >
      <div className="space-y-5">
        {/* 1. Status & Tautan Pengajar */}
        <section className="rounded-card border border-border bg-surface-subtle/30 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status & keamanan akun
            </h3>
            <Badge variant={user.active ? "success" : "danger"} size="sm">
              {user.active ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>

          {isTeacherRole && (
            <div className="rounded-control border border-border bg-surface px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
              <span className="text-secondary-foreground">
                {hasLinkedTeacher
                  ? `Terhubung ke profil Pengajar: ${user.linkedTeacherUnits?.map((t) => t.serviceUnitName).join(", ")}`
                  : "Belum tertaut ke profil Pengajar di modul Kelas & Pengajar."}
              </span>
              {!hasLinkedTeacher && (
                <Link
                  href="/workspace/academic"
                  className="text-primary font-medium hover:underline"
                >
                  Buka Kelas & Pengajar
                </Link>
              )}
            </div>
          )}

          {canManageUsers && (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={pending || isOffline}
                  onClick={() => void onResetDefaultPassword(user.id)}
                >
                  Reset ke sandi bawaan ({DEFAULT_GENERIC_PASSWORD})
                </Button>
              </div>

              {user.id !== currentUserId && (
                <div className="space-y-2 pt-2 border-t border-border-subtle">
                  <Textarea
                    rows={2}
                    placeholder={
                      user.active
                        ? "Alasan penonaktifan akun (opsional)..."
                        : "Catatan pengaktifan kembali..."
                    }
                    value={toggleReason}
                    onChange={(e) => setToggleReason(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant={user.active ? "destructive" : "primary"}
                    size="sm"
                    disabled={pending || isOffline}
                    onClick={() =>
                      void onToggleActive(
                        user.id,
                        !user.active,
                        toggleReason.trim() || null
                      )
                    }
                  >
                    {user.active
                      ? "Nonaktifkan akun ini"
                      : "Aktifkan kembali akun"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 2. Peran (Multi-role) */}
        {canManageRoles && (
          <section className="rounded-card border border-border p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Peran yang dipegang (bisa lebih dari satu)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {roles.map((r) => {
                const checked = selectedRoles.includes(r.code);
                return (
                  <label
                    key={r.id}
                    className="flex items-start gap-2.5 rounded-control border border-border-subtle px-3 py-2 text-xs cursor-pointer hover:bg-surface-subtle/50"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(state) => {
                        const isChecked = state === true;
                        setSelectedRoles((prev) =>
                          isChecked
                            ? Array.from(new Set([...prev, r.code]))
                            : prev.filter((c) => c !== r.code)
                        );
                      }}
                    />
                    <span className="leading-tight">
                      <span className="font-medium text-foreground block">
                        {getRoleLabel(r.code as SystemRole) ?? r.name}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {r.code}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={pending || isOffline || selectedRoles.length === 0}
                onClick={() => void onSaveRoles(user.id, selectedRoles)}
              >
                Simpan peran ({selectedRoles.length})
              </Button>
            </div>
          </section>
        )}

        {/* 3. Lingkup Unit Layanan */}
        {canManageUsers && (
          <section className="rounded-card border border-border p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Lingkup unit layanan & program
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  Organisasi
                </label>
                <Select value={orgId} onValueChange={setOrgId}>
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
                <label className="block text-xs font-medium text-foreground">
                  Unit layanan
                </label>
                <Select value={unitId} onValueChange={setUnitId}>
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
              <label className="block text-xs font-medium text-foreground">
                Program (opsional)
              </label>
              <Select value={programId} onValueChange={setProgramId}>
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
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending || isOffline || !orgId || !unitId}
                onClick={() =>
                  void onSaveScope({
                    userId: user.id,
                    organizationId: orgId,
                    serviceUnitId: unitId,
                    programId: programId === "NONE" ? null : programId,
                  })
                }
              >
                Simpan lingkup unit
              </Button>
            </div>
          </section>
        )}

        {/* 4. Override Izin Khusus */}
        {canManagePermissions && (
          <section className="rounded-card border border-border p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pengecualian hak akses (Grant / Revoke)
            </h3>

            {user.overrides.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {user.overrides.map((ov) => (
                  <Badge
                    key={`${ov.permissionCode}-${ov.mode}`}
                    variant={ov.mode === "GRANT" ? "success" : "danger"}
                    size="sm"
                  >
                    {ov.mode}: {ov.permissionCode}
                  </Badge>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Select value={overridePerm} onValueChange={setOverridePerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kode izin" />
                </SelectTrigger>
                <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                  {permissions.map((p) => (
                    <SelectItem key={p.id} value={p.code}>
                      {p.code} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={overrideMode}
                onValueChange={(v) => setOverrideMode(v as "GRANT" | "REVOKE")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GRANT">GRANT (Tambah izin)</SelectItem>
                  <SelectItem value="REVOKE">
                    REVOKE (Cabut paksa — selalu menang)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              rows={2}
              placeholder="Alasan perubahan izin untuk Jejak Audit *"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={
                  pending ||
                  isOffline ||
                  !overridePerm ||
                  overrideReason.trim().length < 3
                }
                onClick={() =>
                  void onApplyOverride({
                    userId: user.id,
                    permissionCode: overridePerm,
                    mode: overrideMode,
                    reason: overrideReason.trim(),
                  })
                }
              >
                Terapkan override
              </Button>
            </div>
          </section>
        )}
      </div>
    </FormBottomSheet>
  );
}

