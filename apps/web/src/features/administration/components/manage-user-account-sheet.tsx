"use client";

import * as React from "react";
import Link from "next/link";
import { FormBottomSheet } from "@/components/patterns";
import {
  Badge,
  Button,
  Icon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import { DEFAULT_GENERIC_PASSWORD } from "@/features/identity/validators/auth-validator";
import type { ScopeCatalogDTO } from "@/features/organization";
import { getRoleLabel, type SystemRole } from "@/lib/status";
import type {
  AdminPermissionRecordDTO,
  AdminRoleRecordDTO,
  AdminUserRecordDTO,
} from "../types/administration-types";

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
  onRemoveOverride: (
    userId: string,
    permissionCode: string
  ) => Promise<boolean>;
  onToggleActive: (
    userId: string,
    active: boolean,
    reason: string | null
  ) => Promise<boolean>;
  onResetDefaultPassword: (userId: string) => Promise<boolean>;
}

type SheetTab = "roles_scope" | "overrides" | "account";

const PRIMARY_OPERATIONAL_ROLE_CODES = new Set([
  "TEACHER",
  "VOLUNTEER",
  "UNIT_COORDINATOR",
  "PROGRAM_COORDINATOR",
  "EDITOR",
]);

const PERMISSION_MODULE_LABELS: Record<string, string> = {
  student: "Peserta Didik",
  guardian: "Data Wali",
  attendance: "Kehadiran",
  development: "Perkembangan Peserta",
  academic: "Kelas, Jadwal & Pengajar",
  "academic-year": "Kelas, Jadwal & Pengajar",
  class: "Kelas, Jadwal & Pengajar",
  schedule: "Kelas, Jadwal & Pengajar",
  teacher: "Kelas, Jadwal & Pengajar",
  organization: "Organisasi & Unit Layanan",
  "service-unit": "Organisasi & Unit Layanan",
  unit: "Organisasi & Unit Layanan",
  consent: "Persetujuan",
  media: "Dokumentasi",
  publication: "Publikasi",
  report: "Laporan & Tata Kelola",
  audit: "Jejak Audit",
  user: "Administrasi",
  role: "Administrasi",
  permission: "Administrasi",
};

function getPermissionModuleLabel(code: string): string {
  const prefix = code.split(".")[0] ?? "";
  return PERMISSION_MODULE_LABELS[prefix] ?? "Lainnya";
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
  onRemoveOverride,
  onToggleActive,
  onResetDefaultPassword,
}: ManageUserAccountSheetProps) {
  const initialRoles = React.useMemo(
    () => user?.roles.map((r) => r.code).sort() ?? [],
    [user]
  );
  const initialOrgId =
    user?.memberships[0]?.organizationId ??
    scopeCatalog.organizations[0]?.id ??
    "";
  const initialUnitId =
    user?.memberships[0]?.serviceUnitId ??
    scopeCatalog.serviceUnits[0]?.id ??
    "";
  const initialProgramId = user?.memberships[0]?.programId ?? "NONE";

  const [activeTab, setActiveTab] = React.useState<SheetTab>("roles_scope");
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>(
    () => initialRoles
  );
  const { primaryRoles, advancedRoles } = React.useMemo(() => {
    const primary: AdminRoleRecordDTO[] = [];
    const advanced: AdminRoleRecordDTO[] = [];
    for (const r of roles) {
      if (PRIMARY_OPERATIONAL_ROLE_CODES.has(r.code) || !r.isSystem) {
        primary.push(r);
      } else {
        advanced.push(r);
      }
    }
    return { primaryRoles: primary, advancedRoles: advanced };
  }, [roles]);

  const [showAdvancedRoles, setShowAdvancedRoles] = React.useState(() =>
    initialRoles.some(
      (code) =>
        !PRIMARY_OPERATIONAL_ROLE_CODES.has(code) &&
        roles.some((r) => r.code === code && r.isSystem)
    )
  );
  const [orgId, setOrgId] = React.useState(() => initialOrgId);
  const [unitId, setUnitId] = React.useState(() => initialUnitId);
  const [programId, setProgramId] = React.useState(() => initialProgramId);

  const permissionGroups = React.useMemo(() => {
    const map = new Map<string, AdminPermissionRecordDTO[]>();
    for (const p of permissions) {
      const label = getPermissionModuleLabel(p.code);
      const list = map.get(label) ?? [];
      list.push(p);
      map.set(label, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissions]);

  const [selectedPermModule, setSelectedPermModule] = React.useState(
    () => permissionGroups[0]?.[0] ?? ""
  );
  const filteredPermissions = React.useMemo(() => {
    const match = permissionGroups.find(([mod]) => mod === selectedPermModule);
    return match ? match[1] : permissions;
  }, [permissionGroups, selectedPermModule, permissions]);

  const roleInheritedPerms = React.useMemo(() => {
    const userRoleCodes = new Set(user?.roles.map((r) => r.code) ?? []);
    const inherited = new Set<string>();
    for (const role of roles) {
      if (userRoleCodes.has(role.code)) {
        for (const code of role.permissionCodes) {
          inherited.add(code);
        }
      }
    }
    return inherited;
  }, [user, roles]);

  const [selectedOverridePerms, setSelectedOverridePerms] = React.useState<
    string[]
  >([]);
  const [overrideMode, setOverrideMode] = React.useState<"GRANT" | "REVOKE">(
    "GRANT"
  );
  const [overrideReason, setOverrideReason] = React.useState("");

  const [confirmDeactivate, setConfirmDeactivate] = React.useState(false);
  const [toggleReason, setToggleReason] = React.useState("");

  if (!user) return null;

  const currentUser = user;

  const rolesChanged =
    [...selectedRoles].sort().join(",") !== initialRoles.join(",");
  const scopeChanged =
    orgId !== initialOrgId ||
    unitId !== initialUnitId ||
    programId !== initialProgramId;
  const hasTab1Changes =
    (canManageRoles && rolesChanged) || (canManageUsers && scopeChanged);

  const isTeacherRole = selectedRoles.some(
    (code) => code === "TEACHER" || code === "VOLUNTEER"
  );
  const hasLinkedTeacher = (currentUser.linkedTeacherUnits?.length ?? 0) > 0;

  async function handleSaveRolesAndScope() {
    if (pending || isOffline) return;
    if (canManageRoles && rolesChanged && selectedRoles.length > 0) {
      const okRoles = await onSaveRoles(currentUser.id, selectedRoles);
      if (!okRoles) return;
    }
    if (canManageUsers && scopeChanged && orgId && unitId) {
      await onSaveScope({
        userId: currentUser.id,
        organizationId: orgId,
        serviceUnitId: unitId,
        programId: programId === "NONE" ? null : programId,
      });
    }
  }

  async function handleSubmitOverride() {
    if (
      pending ||
      isOffline ||
      selectedOverridePerms.length === 0 ||
      overrideReason.trim().length < 3
    ) {
      return;
    }
    let allSucceeded = true;
    for (const permissionCode of selectedOverridePerms) {
      const okOverride = await onApplyOverride({
        userId: currentUser.id,
        permissionCode,
        mode: overrideMode,
        reason: overrideReason.trim(),
      });
      if (!okOverride) {
        allSucceeded = false;
        break;
      }
    }
    if (allSucceeded) {
      setSelectedOverridePerms([]);
      setOverrideReason("");
    }
  }

  function renderFooter(_: string, isMobile: boolean) {
    if (activeTab === "roles_scope" && (canManageRoles || canManageUsers)) {
      return (
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="w-full sm:w-auto"
          >
            Tutup
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={
              pending ||
              isOffline ||
              !hasTab1Changes ||
              (canManageRoles && selectedRoles.length === 0)
            }
            onClick={() => void handleSaveRolesAndScope()}
            className="w-full sm:w-auto"
          >
            {pending ? "Menyimpan..." : "Simpan perubahan"}
          </Button>
        </div>
      );
    }

    if (activeTab === "overrides" && canManagePermissions) {
      return (
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="w-full sm:w-auto"
          >
            Tutup
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={
              pending ||
              isOffline ||
              selectedOverridePerms.length === 0 ||
              overrideReason.trim().length < 3
            }
            onClick={() => void handleSubmitOverride()}
            className="w-full sm:w-auto"
          >
            {pending
              ? "Menerapkan..."
              : selectedOverridePerms.length > 0
                ? `Terapkan izin (${selectedOverridePerms.length})`
                : "Terapkan izin"}
          </Button>
        </div>
      );
    }

    return (
      <Button
        type="button"
        variant="secondary"
        onClick={() => onOpenChange(false)}
        fullWidth={isMobile}
      >
        Tutup
      </Button>
    );
  }

  const tabItems: Array<{ id: SheetTab; label: string }> = [
    { id: "roles_scope", label: "Peran & Lingkup" },
    ...(canManagePermissions
      ? [{ id: "overrides" as const, label: "Izin Khusus" }]
      : []),
    ...(canManageUsers
      ? [{ id: "account" as const, label: "Akun & Sandi" }]
      : []),
  ];

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={currentUser.name}
      description={currentUser.email}
      dialogClassName="md:h-[min(640px,88vh)]"
      bodyClassName="overflow-hidden flex flex-col min-h-0"
      footer={renderFooter}
    >
      <div className="flex flex-col flex-1 min-h-0 gap-4">
        {/* Status strip + Segmented 3-tab control */}
        <div className="space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant={currentUser.active ? "success" : "danger"}
                size="sm"
              >
                {currentUser.active ? "Akun aktif" : "Akun nonaktif"}
              </Badge>
              {currentUser.overrides.length > 0 && (
                <Badge variant="warning" size="sm">
                  {currentUser.overrides.length} izin khusus
                </Badge>
              )}
            </div>
          </div>

          {tabItems.length > 1 && (
            <div
              role="tablist"
              aria-label="Bagian pengelolaan akun"
              className="grid gap-1 rounded-control bg-surface-subtle p-1"
              style={{
                gridTemplateColumns: `repeat(${tabItems.length}, minmax(0, 1fr))`,
              }}
            >
              {tabItems.map((tab) => {
                const isCurrent = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isCurrent}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setConfirmDeactivate(false);
                    }}
                    className={
                      isCurrent
                        ? "rounded-xs bg-surface px-2 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-all cursor-pointer focus-ring"
                        : "rounded-xs px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-ring"
                    }
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Flex-1 single-scroll container bound by Dialog/Sheet viewport height: no clipping, no double scrollbars, no modal height jump */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-2 [scrollbar-width:thin]">
        {/* TAB 1: PERAN & LINGKUP */}
        {activeTab === "roles_scope" && (
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
                  {primaryRoles.map((r) => {
                    const checked = selectedRoles.includes(r.code);
                    const label = getRoleLabel(r.code as SystemRole) ?? r.name;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        aria-pressed={checked}
                        disabled={pending || isOffline}
                        onClick={() => {
                          setSelectedRoles((prev) =>
                            checked
                              ? prev.filter((c) => c !== r.code)
                              : Array.from(new Set([...prev, r.code]))
                          );
                        }}
                        className={
                          checked
                            ? "inline-flex items-center gap-1.5 rounded-pill border border-primary bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary transition-colors cursor-pointer focus-ring"
                            : "inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:text-foreground hover:border-border-strong transition-colors cursor-pointer focus-ring"
                        }
                      >
                        {checked && (
                          <Icon
                            icon={ICON_MAP.centang}
                            size="xs"
                            aria-hidden="true"
                          />
                        )}
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>

                {advancedRoles.length > 0 && (
                  <div className="pt-1 space-y-2">
                    <button
                      type="button"
                      aria-expanded={showAdvancedRoles}
                      onClick={() => setShowAdvancedRoles((v) => !v)}
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
                        {advancedRoles.map((r) => {
                          const checked = selectedRoles.includes(r.code);
                          const label =
                            getRoleLabel(r.code as SystemRole) ?? r.name;
                          return (
                            <button
                              key={r.id}
                              type="button"
                              aria-pressed={checked}
                              disabled={pending || isOffline}
                              onClick={() => {
                                setSelectedRoles((prev) =>
                                  checked
                                    ? prev.filter((c) => c !== r.code)
                                    : Array.from(new Set([...prev, r.code]))
                                );
                              }}
                              className={
                                checked
                                  ? "inline-flex items-center gap-1.5 rounded-pill border border-primary bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary transition-colors cursor-pointer focus-ring"
                                  : "inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:text-foreground hover:border-border-strong transition-colors cursor-pointer focus-ring"
                              }
                            >
                              {checked && (
                                <Icon
                                  icon={ICON_MAP.centang}
                                  size="xs"
                                  aria-hidden="true"
                                />
                              )}
                              <span>{label}</span>
                            </button>
                          );
                        })}
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
                    <label className="block text-xs font-medium text-secondary-foreground">
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
                  <label className="block text-xs font-medium text-secondary-foreground">
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
        )}

        {/* TAB 2: IZIN KHUSUS (OVERRIDE) */}
        {activeTab === "overrides" && canManagePermissions && (
          <div className="space-y-5">
            <div className="rounded-control bg-surface-subtle/60 px-3.5 py-2.5 flex items-start gap-2 text-xs text-secondary-foreground leading-relaxed">
              <Icon
                icon={ICON_MAP.info}
                size="xs"
                className="text-primary shrink-0 mt-0.5"
              />
              <span>
                Gunakan tab ini hanya untuk pengecualian 1–2 izin. Untuk
                tambahan tugas rutin, lebih sederhana menggabungkan peran di tab{" "}
                <strong className="text-foreground">Peran &amp; Lingkup</strong>
                .
              </span>
            </div>

            {currentUser.overrides.length > 0 && (
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
                  {currentUser.overrides.map((ov) => {
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
                          onClick={() => {
                            const mod = getPermissionModuleLabel(
                              ov.permissionCode
                            );
                            setSelectedPermModule(mod);
                            setSelectedOverridePerms((prev) =>
                              prev.includes(ov.permissionCode)
                                ? prev
                                : [...prev, ov.permissionCode]
                            );
                            setOverrideMode(isGrant ? "REVOKE" : "GRANT");
                            if (ov.reason) setOverrideReason(ov.reason);
                          }}
                          title={`Klik untuk memilih ${ov.permissionName} (${ov.permissionCode})`}
                          className="px-2.5 py-1 hover:opacity-80 cursor-pointer focus-ring"
                        >
                          {isGrant ? "Berikan" : "Cabut"}: {ov.permissionName}
                        </button>
                        <button
                          type="button"
                          disabled={pending || isOffline}
                          onClick={() =>
                            void onRemoveOverride(
                              currentUser.id,
                              ov.permissionCode
                            )
                          }
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
                <Select
                  value={selectedPermModule}
                  onValueChange={setSelectedPermModule}
                >
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
                          {selectedInMod > 0
                            ? ` · ${selectedInMod} dipilih`
                            : ""}
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
                        onClick={() => setSelectedOverridePerms([])}
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
                        onClick={() => {
                          setSelectedOverridePerms((prev) =>
                            isSelected
                              ? prev.filter((c) => c !== p.code)
                              : [...prev, p.code]
                          );
                        }}
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
                          <span className="text-[10px] opacity-75">
                            (dari peran)
                          </span>
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
                    onClick={() => setOverrideMode("GRANT")}
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
                    onClick={() => setOverrideMode("REVOKE")}
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
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AKUN & SANDI (SENSITIVE / DANGER ZONE) */}
        {activeTab === "account" && canManageUsers && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Icon
                  icon={ICON_MAP.lock}
                  size="sm"
                  className="text-primary shrink-0 mt-0.5"
                />
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-foreground">
                    Reset kata sandi
                  </h3>
                  <p className="text-xs text-secondary-foreground">
                    Menyetel ulang sandi ke bawaan (
                    <code className="font-mono text-foreground">
                      {DEFAULT_GENERIC_PASSWORD}
                    </code>
                    ). Pengguna wajib menggantinya saat masuk berikutnya.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending || isOffline}
                onClick={() => void onResetDefaultPassword(currentUser.id)}
                className="w-full sm:w-auto shrink-0"
              >
                Reset sandi
              </Button>
            </div>

            {currentUser.id !== currentUserId && (
              <div className="pt-5 border-t border-border space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Icon
                      icon={ICON_MAP.alertTriangle}
                      size="sm"
                      className={
                        currentUser.active
                          ? "text-danger shrink-0 mt-0.5"
                          : "text-primary shrink-0 mt-0.5"
                      }
                    />
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-semibold text-foreground">
                        {currentUser.active
                          ? "Nonaktifkan akun"
                          : "Aktifkan kembali akun"}
                      </h3>
                      <p className="text-xs text-secondary-foreground">
                        {currentUser.active
                          ? "Mencabut seluruh akses ruang kerja tanpa menghapus riwayat audit."
                          : "Memulihkan akses pengguna sesuai peran dan lingkupnya."}
                      </p>
                    </div>
                  </div>

                  {!confirmDeactivate && (
                    <Button
                      type="button"
                      variant={currentUser.active ? "destructive" : "primary"}
                      size="sm"
                      disabled={pending || isOffline}
                      onClick={() => {
                        if (currentUser.active) {
                          setConfirmDeactivate(true);
                        } else {
                          void onToggleActive(currentUser.id, true, null);
                        }
                      }}
                      className="w-full sm:w-auto shrink-0"
                    >
                      {currentUser.active
                        ? "Nonaktifkan akun"
                        : "Aktifkan kembali"}
                    </Button>
                  )}
                </div>

                {confirmDeactivate && currentUser.active && (
                  <div className="rounded-control border border-danger/30 bg-danger-soft/30 p-3.5 space-y-3">
                    <Textarea
                      rows={2}
                      placeholder="Tuliskan alasan penonaktifan akun (opsional)..."
                      value={toggleReason}
                      onChange={(e) => setToggleReason(e.target.value)}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          setConfirmDeactivate(false);
                          setToggleReason("");
                        }}
                      >
                        Batal
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={pending || isOffline}
                        onClick={async () => {
                          const okToggle = await onToggleActive(
                            currentUser.id,
                            false,
                            toggleReason.trim() || null
                          );
                          if (okToggle) {
                            setConfirmDeactivate(false);
                            setToggleReason("");
                          }
                        }}
                      >
                        {pending ? "Memproses..." : "Ya, nonaktifkan"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </FormBottomSheet>
  );
}
