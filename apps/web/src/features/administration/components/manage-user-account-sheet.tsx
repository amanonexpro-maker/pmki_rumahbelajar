"use client";

import * as React from "react";
import { FormBottomSheet } from "@/components/patterns";
import { Badge, Button } from "@/components/ui";
import type { ScopeCatalogDTO } from "@/features/organization";
import type {
  AdminPermissionRecordDTO,
  AdminRoleRecordDTO,
  AdminUserRecordDTO,
} from "../types/administration-types";
import { UserAccountSecurityTab } from "./account-sheet/user-account-security-tab";
import { UserOverridesTab } from "./account-sheet/user-overrides-tab";
import { UserRolesScopeTab } from "./account-sheet/user-roles-scope-tab";
import {
  getPermissionModuleLabel,
  PRIMARY_OPERATIONAL_ROLE_CODES,
} from "./administration-labels";

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
  onResetDefaultPassword: (userId: string) => Promise<string | null>;
}

type SheetTab = "roles_scope" | "overrides" | "account";

function SheetFooterActions({
  activeTab,
  canManageRoles,
  canManageUsers,
  canManagePermissions,
  pending,
  isOffline,
  hasTab1Changes,
  selectedRolesCount,
  selectedOverridePermsCount,
  overrideReasonLength,
  isMobile,
  onClose,
  onSaveRolesAndScope,
  onSubmitOverride,
}: {
  activeTab: SheetTab;
  canManageRoles: boolean;
  canManageUsers: boolean;
  canManagePermissions: boolean;
  pending: boolean;
  isOffline: boolean;
  hasTab1Changes: boolean;
  selectedRolesCount: number;
  selectedOverridePermsCount: number;
  overrideReasonLength: number;
  isMobile: boolean;
  onClose: () => void;
  onSaveRolesAndScope: () => Promise<void>;
  onSubmitOverride: () => Promise<void>;
}) {
  if (activeTab === "roles_scope" && (canManageRoles || canManageUsers)) {
    return (
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
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
            (canManageRoles && selectedRolesCount === 0)
          }
          onClick={() => void onSaveRolesAndScope()}
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
          onClick={onClose}
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
            selectedOverridePermsCount === 0 ||
            overrideReasonLength < 5
          }
          onClick={() => void onSubmitOverride()}
          className="w-full sm:w-auto"
        >
          {pending
            ? "Menerapkan..."
            : selectedOverridePermsCount > 0
              ? `Terapkan izin (${selectedOverridePermsCount})`
              : "Terapkan izin"}
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onClose}
      fullWidth={isMobile}
    >
      Tutup
    </Button>
  );
}

function SheetSegmentedHeader({
  active,
  overridesCount,
  tabItems,
  activeTab,
  onSelectTab,
}: {
  active: boolean;
  overridesCount: number;
  tabItems: Array<{ id: SheetTab; label: string }>;
  activeTab: SheetTab;
  onSelectTab: (tab: SheetTab) => void;
}) {
  return (
    <div className="space-y-3 shrink-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={active ? "success" : "danger"} size="sm">
          {active ? "Akun aktif" : "Akun nonaktif"}
        </Badge>
        {overridesCount > 0 && (
          <Badge variant="warning" size="sm">
            {overridesCount} izin khusus
          </Badge>
        )}
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
                onClick={() => onSelectTab(tab.id)}
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
  );
}

function useManageAccountFormState(
  user: AdminUserRecordDTO | null,
  roles: AdminRoleRecordDTO[],
  permissions: AdminPermissionRecordDTO[],
  scopeCatalog: ScopeCatalogDTO
) {
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
      if (PRIMARY_OPERATIONAL_ROLE_CODES.has(r.code) || !r.isSystem)
        primary.push(r);
      else advanced.push(r);
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
    for (const r of roles) {
      if (userRoleCodes.has(r.code)) {
        for (const p of r.permissionCodes) inherited.add(p);
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
  const [generatedTempPassword, setGeneratedTempPassword] = React.useState<
    string | null
  >(null);
  const [copiedTempPassword, setCopiedTempPassword] = React.useState(false);

  const rolesChanged =
    [...selectedRoles].sort().join(",") !== initialRoles.join(",");
  const scopeChanged =
    orgId !== initialOrgId ||
    unitId !== initialUnitId ||
    programId !== initialProgramId;

  return {
    activeTab,
    setActiveTab,
    selectedRoles,
    setSelectedRoles,
    primaryRoles,
    advancedRoles,
    showAdvancedRoles,
    setShowAdvancedRoles,
    orgId,
    setOrgId,
    unitId,
    setUnitId,
    programId,
    setProgramId,
    permissionGroups,
    selectedPermModule,
    setSelectedPermModule,
    filteredPermissions,
    roleInheritedPerms,
    selectedOverridePerms,
    setSelectedOverridePerms,
    overrideMode,
    setOverrideMode,
    overrideReason,
    setOverrideReason,
    confirmDeactivate,
    setConfirmDeactivate,
    toggleReason,
    setToggleReason,
    generatedTempPassword,
    setGeneratedTempPassword,
    copiedTempPassword,
    setCopiedTempPassword,
    rolesChanged,
    scopeChanged,
  };
}

function buildTabItems(
  canManagePermissions: boolean,
  canManageUsers: boolean
): Array<{ id: SheetTab; label: string }> {
  return [
    { id: "roles_scope", label: "Peran & Lingkup" },
    ...(canManagePermissions
      ? [{ id: "overrides" as const, label: "Izin Khusus" }]
      : []),
    ...(canManageUsers
      ? [{ id: "account" as const, label: "Akun & Sandi" }]
      : []),
  ];
}

export function ManageUserAccountSheet(props: ManageUserAccountSheetProps) {
  const { open, onOpenChange, user, currentUserId, roles, permissions, scopeCatalog, canManageUsers, canManageRoles, canManagePermissions, pending, isOffline, onSaveRoles, onSaveScope, onApplyOverride, onRemoveOverride, onToggleActive, onResetDefaultPassword } = props;

  const s = useManageAccountFormState(user, roles, permissions, scopeCatalog);
  if (!user) return null;
  const currentUser = user;

  const hasTab1Changes = (canManageRoles && s.rolesChanged) || (canManageUsers && s.scopeChanged);

  function handleSheetOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      s.setGeneratedTempPassword(null);
      s.setCopiedTempPassword(false);
    }
    onOpenChange(nextOpen);
  }

  async function handleSaveRolesAndScope() {
    if (pending || isOffline) return;
    if (canManageRoles && s.rolesChanged && s.selectedRoles.length > 0) {
      if (!(await onSaveRoles(currentUser.id, s.selectedRoles))) return;
    }
    if (canManageUsers && s.scopeChanged && s.orgId && s.unitId) {
      await onSaveScope({ userId: currentUser.id, organizationId: s.orgId, serviceUnitId: s.unitId, programId: s.programId === "NONE" ? null : s.programId });
    }
  }

  async function handleSubmitOverride() {
    if (pending || isOffline || s.selectedOverridePerms.length === 0 || s.overrideReason.trim().length < 5) return;
    for (const permCode of s.selectedOverridePerms) {
      const ok = await onApplyOverride({ userId: currentUser.id, permissionCode: permCode, mode: s.overrideMode, reason: s.overrideReason.trim() });
      if (!ok) return;
    }
    s.setSelectedOverridePerms([]);
    s.setOverrideReason("");
  }

  const tabItems = buildTabItems(canManagePermissions, canManageUsers);

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={handleSheetOpenChange}
      title={currentUser.name}
      description={currentUser.email}
      dialogClassName="md:h-[min(640px,88vh)]"
      bodyClassName="overflow-hidden flex flex-col min-h-0"
      footer={(_, isMobile) => (
        <SheetFooterActions
          activeTab={s.activeTab}
          canManageRoles={canManageRoles}
          canManageUsers={canManageUsers}
          canManagePermissions={canManagePermissions}
          pending={pending}
          isOffline={isOffline}
          hasTab1Changes={hasTab1Changes}
          selectedRolesCount={s.selectedRoles.length}
          selectedOverridePermsCount={s.selectedOverridePerms.length}
          overrideReasonLength={s.overrideReason.trim().length}
          isMobile={isMobile}
          onClose={() => handleSheetOpenChange(false)}
          onSaveRolesAndScope={handleSaveRolesAndScope}
          onSubmitOverride={handleSubmitOverride}
        />
      )}
    >
      <div className="flex flex-col flex-1 min-h-0 gap-4">
        <SheetSegmentedHeader
          active={currentUser.active}
          overridesCount={currentUser.overrides.length}
          tabItems={tabItems}
          activeTab={s.activeTab}
          onSelectTab={(next) => {
            s.setActiveTab(next);
            s.setConfirmDeactivate(false);
            if (next !== "account") {
              s.setGeneratedTempPassword(null);
              s.setCopiedTempPassword(false);
            }
          }}
        />

        <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-2 [scrollbar-width:thin]">
          {s.activeTab === "roles_scope" && (
            <UserRolesScopeTab
              currentUser={currentUser}
              primaryRoles={s.primaryRoles}
              advancedRoles={s.advancedRoles}
              selectedRoles={s.selectedRoles}
              onToggleRole={(code) =>
                s.setSelectedRoles((prev) =>
                  prev.includes(code)
                    ? prev.filter((c) => c !== code)
                    : Array.from(new Set([...prev, code]))
                )
              }
              showAdvancedRoles={s.showAdvancedRoles}
              onToggleAdvancedRoles={() => s.setShowAdvancedRoles((v) => !v)}
              scopeCatalog={scopeCatalog}
              orgId={s.orgId}
              onOrgChange={s.setOrgId}
              unitId={s.unitId}
              onUnitChange={s.setUnitId}
              programId={s.programId}
              onProgramChange={s.setProgramId}
              canManageRoles={canManageRoles}
              canManageUsers={canManageUsers}
              pending={pending}
              isOffline={isOffline}
            />
          )}

          {s.activeTab === "overrides" && canManagePermissions && (
            <UserOverridesTab
              userId={currentUser.id}
              overrides={currentUser.overrides}
              permissionGroups={s.permissionGroups}
              selectedPermModule={s.selectedPermModule}
              onSelectPermModule={s.setSelectedPermModule}
              filteredPermissions={s.filteredPermissions}
              roleInheritedPerms={s.roleInheritedPerms}
              selectedOverridePerms={s.selectedOverridePerms}
              onToggleOverridePerm={(code) =>
                s.setSelectedOverridePerms((prev) =>
                  prev.includes(code)
                    ? prev.filter((c) => c !== code)
                    : [...prev, code]
                )
              }
              onClearSelectedPerms={() => s.setSelectedOverridePerms([])}
              onSelectActiveOverride={(ov, modLabel) => {
                s.setSelectedPermModule(modLabel);
                s.setSelectedOverridePerms((prev) =>
                  prev.includes(ov.permissionCode)
                    ? prev
                    : [...prev, ov.permissionCode]
                );
                s.setOverrideMode(ov.mode === "GRANT" ? "REVOKE" : "GRANT");
                if (ov.reason) s.setOverrideReason(ov.reason);
              }}
              overrideMode={s.overrideMode}
              onChangeOverrideMode={s.setOverrideMode}
              overrideReason={s.overrideReason}
              onChangeOverrideReason={s.setOverrideReason}
              onRemoveOverride={onRemoveOverride}
              pending={pending}
              isOffline={isOffline}
            />
          )}

          {s.activeTab === "account" && canManageUsers && (
            <UserAccountSecurityTab
              currentUser={currentUser}
              currentUserId={currentUserId}
              pending={pending}
              isOffline={isOffline}
              generatedTempPassword={s.generatedTempPassword}
              copiedTempPassword={s.copiedTempPassword}
              onGenerateTempPassword={async () => {
                s.setCopiedTempPassword(false);
                const tempPass = await onResetDefaultPassword(currentUser.id);
                if (tempPass) s.setGeneratedTempPassword(tempPass);
              }}
              onCopyTempPassword={async () => {
                if (!s.generatedTempPassword) return;
                try {
                  await navigator.clipboard.writeText(s.generatedTempPassword);
                  s.setCopiedTempPassword(true);
                } catch {
                  s.setCopiedTempPassword(false);
                }
              }}
              confirmDeactivate={s.confirmDeactivate}
              onSetConfirmDeactivate={s.setConfirmDeactivate}
              toggleReason={s.toggleReason}
              onChangeToggleReason={s.setToggleReason}
              onToggleActive={onToggleActive}
            />
          )}
        </div>
      </div>
    </FormBottomSheet>
  );
}
