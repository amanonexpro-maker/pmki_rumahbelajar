"use client";

import * as React from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Pencil,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { Badge, Button, Icon } from "@/components/ui";
import { getRoleLabel, type SystemRole } from "@/lib/status";
import type {
  AdminPermissionRecordDTO,
  AdminRoleRecordDTO,
} from "../types/administration-types";
import {
  getPermissionModuleLabel,
  groupPermissionsByModuleLabel,
  PRIMARY_OPERATIONAL_ROLE_CODES,
} from "./administration-labels";

export interface RolesPermissionsTabProps {
  roles: AdminRoleRecordDTO[];
  permissions: AdminPermissionRecordDTO[];
  canManageRoles: boolean;
  pending: boolean;
  isOffline: boolean;
  onFilterUsersByRole: (roleLabel: string) => void;
  onEditCustomRole: (role: AdminRoleRecordDTO) => void;
  onDeleteCustomRole: (role: AdminRoleRecordDTO) => Promise<boolean>;
}

function CustomRoleCardFooter({
  role,
  displayName,
  isConfirmingDelete,
  pending,
  isOffline,
  onRequestDelete,
  onFilterUsersByRole,
  onEditCustomRole,
  onConfirmDelete,
}: {
  role: AdminRoleRecordDTO;
  displayName: string;
  isConfirmingDelete: boolean;
  pending: boolean;
  isOffline: boolean;
  onRequestDelete: (roleId: string | null) => void;
  onFilterUsersByRole: (roleLabel: string) => void;
  onEditCustomRole: (role: AdminRoleRecordDTO) => void;
  onConfirmDelete: (role: AdminRoleRecordDTO) => void;
}) {
  if (isConfirmingDelete) {
    return (
      <div className="pt-3 border-t border-border-subtle">
        <div className="rounded-control bg-danger-soft/50 p-3 space-y-2.5">
          <p className="text-xs text-foreground">
            {role.assignedUserCount > 0 ? (
              <>
                Peran ini masih digunakan oleh{" "}
                <strong>{role.assignedUserCount} pengguna</strong>. Pindahkan
                peran mereka terlebih dahulu sebelum menghapus.
              </>
            ) : (
              <>
                Hapus peran kustom <strong>{displayName}</strong>? Tindakan ini
                akan dicatat dalam jejak audit.
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => onRequestDelete(null)}
            >
              Batal
            </Button>
            {role.assignedUserCount > 0 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  onRequestDelete(null);
                  onFilterUsersByRole(displayName);
                }}
              >
                Lihat {role.assignedUserCount} pengguna
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={pending || isOffline}
                onClick={() => onConfirmDelete(role)}
              >
                {pending ? "Menghapus..." : "Ya, hapus peran"}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pending || isOffline}
        leftIcon={<Icon icon={Pencil} size="xs" />}
        onClick={() => onEditCustomRole(role)}
      >
        Ubah
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending || isOffline}
        leftIcon={<Icon icon={Trash2} size="xs" />}
        className="text-danger hover:bg-danger-soft/60 hover:text-danger"
        onClick={() => onRequestDelete(role.id)}
      >
        Hapus
      </Button>
    </div>
  );
}

function RoleCard({
  role,
  permissionByCode,
  isExpanded,
  onToggleExpand,
  canManageRoles,
  pending,
  isOffline,
  confirmDeleteId,
  onRequestDelete,
  onFilterUsersByRole,
  onEditCustomRole,
  onConfirmDelete,
}: {
  role: AdminRoleRecordDTO;
  permissionByCode: Map<string, AdminPermissionRecordDTO>;
  isExpanded: boolean;
  onToggleExpand: (roleId: string) => void;
  canManageRoles: boolean;
  pending: boolean;
  isOffline: boolean;
  confirmDeleteId: string | null;
  onRequestDelete: (roleId: string | null) => void;
  onFilterUsersByRole: (roleLabel: string) => void;
  onEditCustomRole: (role: AdminRoleRecordDTO) => void;
  onConfirmDelete: (role: AdminRoleRecordDTO) => void;
}) {
  const displayName = getRoleLabel(role.code as SystemRole) ?? role.name;
  const moduleSummary = React.useMemo(() => {
    const map = new Map<string, Array<{ code: string; name: string }>>();
    for (const code of role.permissionCodes) {
      const perm = permissionByCode.get(code);
      const moduleLabel = perm
        ? getPermissionModuleLabel(perm.module)
        : getPermissionModuleLabel(code.split(".")[0] ?? code);
      const list = map.get(moduleLabel) ?? [];
      list.push({ code, name: perm?.name ?? code });
      map.set(moduleLabel, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [role.permissionCodes, permissionByCode]);

  return (
    <section className="rounded-card border border-border bg-surface p-5 flex flex-col justify-between gap-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">
                {displayName}
              </h3>
              <Badge variant={role.isSystem ? "neutral" : "info"} size="sm">
                {role.isSystem ? "Peran sistem" : "Peran kustom"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {role.assignedUserCount > 0 ? (
                <button
                  type="button"
                  onClick={() => onFilterUsersByRole(displayName)}
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline cursor-pointer focus-ring rounded-xs"
                >
                  <Icon icon={Users} size="xs" />
                  <span>{role.assignedUserCount} pengguna</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Icon icon={Users} size="xs" />
                  <span>Belum ada pengguna</span>
                </span>
              )}
              {!role.isSystem && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[11px]">{role.code}</span>
                </>
              )}
            </div>
          </div>

          <Badge variant="primary" size="sm" className="shrink-0">
            {role.permissionCodes.length} izin
          </Badge>
        </div>

        {role.description && (
          <p className="text-xs text-secondary-foreground leading-relaxed">
            {role.description}
          </p>
        )}

        <div className="space-y-2 pt-2 border-t border-border-subtle">
          <div className="flex flex-wrap items-center gap-1.5">
            {moduleSummary.map(([moduleLabel, items]) => (
              <span
                key={moduleLabel}
                className="inline-flex items-center gap-1 rounded-pill bg-surface-subtle px-2.5 py-0.5 text-xs text-secondary-foreground"
              >
                <span>{moduleLabel}</span>
                <span className="text-[11px] text-muted-foreground">
                  ({items.length})
                </span>
              </span>
            ))}
          </div>

          {role.permissionCodes.length > 0 && (
            <button
              type="button"
              onClick={() => onToggleExpand(role.id)}
              aria-expanded={isExpanded}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer focus-ring rounded-xs"
            >
              <span>
                {isExpanded
                  ? "Tutup rincian izin"
                  : `Lihat rincian izin (${role.permissionCodes.length})`}
              </span>
              <Icon
                icon={isExpanded ? ChevronUp : ChevronDown}
                size="xs"
                className="shrink-0"
              />
            </button>
          )}

          {isExpanded && (
            <div className="rounded-control bg-surface-subtle/50 p-3 space-y-2.5 mt-1">
              {moduleSummary.map(([moduleLabel, items]) => (
                <div key={moduleLabel} className="space-y-1">
                  <p className="text-[11px] font-semibold text-foreground">
                    {moduleLabel}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {items.map((item) => (
                      <span
                        key={item.code}
                        title={item.code}
                        className="rounded-xs bg-surface border border-border-subtle px-2 py-0.5 text-[11px] text-secondary-foreground"
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!role.isSystem && canManageRoles && (
        <CustomRoleCardFooter
          role={role}
          displayName={displayName}
          isConfirmingDelete={confirmDeleteId === role.id}
          pending={pending}
          isOffline={isOffline}
          onRequestDelete={onRequestDelete}
          onFilterUsersByRole={onFilterUsersByRole}
          onEditCustomRole={onEditCustomRole}
          onConfirmDelete={onConfirmDelete}
        />
      )}
    </section>
  );
}

function PermissionDictionaryAccordion({
  permissions,
  groupedModules,
}: {
  permissions: AdminPermissionRecordDTO[];
  groupedModules: Array<[string, AdminPermissionRecordDTO[]]>;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <section className="rounded-card border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-surface-subtle/40 transition-colors rounded-card cursor-pointer focus-ring"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon icon={BookOpen} size="sm" className="text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Kamus lengkap hak akses ({permissions.length} izin)
            </p>
            <p className="text-xs text-muted-foreground">
              Referensi seluruh hak akses yang tersedia di platform,
              dikelompokkan per modul.
            </p>
          </div>
        </div>
        <Icon
          icon={open ? ChevronUp : ChevronDown}
          size="sm"
          className="text-muted-foreground shrink-0"
        />
      </button>

      {open && (
        <div className="px-5 pb-5 pt-2 border-t border-border-subtle space-y-4">
          {groupedModules.map(([moduleLabel, perms]) => (
            <div key={moduleLabel} className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-foreground">
                  {moduleLabel}
                </h3>
                <Badge variant="neutral" size="sm">
                  {perms.length} izin
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {perms.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-control bg-surface-subtle/50 px-3 py-2 space-y-0.5"
                  >
                    <p className="text-xs font-medium text-foreground">
                      {p.name}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {p.code}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function RolesPermissionsTab({
  roles,
  permissions,
  canManageRoles,
  pending,
  isOffline,
  onFilterUsersByRole,
  onEditCustomRole,
  onDeleteCustomRole,
}: RolesPermissionsTabProps) {
  const [expandedRoleIds, setExpandedRoleIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
    null
  );

  const permissionByCode = React.useMemo(
    () => new Map(permissions.map((p) => [p.code, p])),
    [permissions]
  );
  const groupedModules = React.useMemo(
    () => groupPermissionsByModuleLabel(permissions),
    [permissions]
  );

  const { customRoles, operationalRoles, governanceRoles } = React.useMemo(() => {
    const custom: AdminRoleRecordDTO[] = [];
    const operational: AdminRoleRecordDTO[] = [];
    const governance: AdminRoleRecordDTO[] = [];
    for (const role of roles) {
      if (!role.isSystem) custom.push(role);
      else if (PRIMARY_OPERATIONAL_ROLE_CODES.has(role.code))
        operational.push(role);
      else governance.push(role);
    }
    return {
      customRoles: custom,
      operationalRoles: operational,
      governanceRoles: governance,
    };
  }, [roles]);

  function handleToggleExpand(roleId: string) {
    setExpandedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  }

  async function handleConfirmDelete(role: AdminRoleRecordDTO) {
    if (await onDeleteCustomRole(role)) setConfirmDeleteId(null);
  }

  const sharedCardProps = {
    permissionByCode,
    onToggleExpand: handleToggleExpand,
    canManageRoles,
    pending,
    isOffline,
    confirmDeleteId,
    onRequestDelete: setConfirmDeleteId,
    onFilterUsersByRole,
    onEditCustomRole,
    onConfirmDelete: handleConfirmDelete,
  };

  return (
    <div className="space-y-8">
      {customRoles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Icon icon={Sparkles} size="sm" className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Peran kustom ({customRoles.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customRoles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                isExpanded={expandedRoleIds.has(role.id)}
                {...sharedCardProps}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Icon icon={ShieldCheck} size="sm" className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Peran operasional harian ({operationalRoles.length})
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Peran bawaan sistem untuk kegiatan belajar mengajar dan koordinasi
            unit layanan. Klik jumlah pengguna untuk melihat siapa saja yang
            memegang peran tersebut.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {operationalRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              isExpanded={expandedRoleIds.has(role.id)}
              {...sharedCardProps}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Icon icon={Shield} size="sm" className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Peran tata kelola &amp; sistem ({governanceRoles.length})
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Peran pengawasan, persetujuan, dan administrasi platform. Terkunci
            untuk menjaga pemisahan tugas dan integritas audit.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {governanceRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              isExpanded={expandedRoleIds.has(role.id)}
              {...sharedCardProps}
            />
          ))}
        </div>
      </div>

      <PermissionDictionaryAccordion
        permissions={permissions}
        groupedModules={groupedModules}
      />
    </div>
  );
}
