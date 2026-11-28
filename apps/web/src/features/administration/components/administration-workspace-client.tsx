"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CloudOff,
  FlaskConical,
  Plus,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import {
  DetailTabs,
  FeedbackBanner,
  FloatingFeedbackToast,
  PageHeader,
  type DetailTabItem,
} from "@/components/patterns";
import { Button, Icon } from "@/components/ui";
import { useTierCGuard } from "@/hooks/use-tier-c-guard";
import {
  getPermissionLabel,
  getRoleLabel,
  type SystemRole,
} from "@/lib/status";
import {
  applyUserPermissionOverrideAction,
  createCustomRoleAction,
  deleteCustomRoleAction,
  provisionNewPlatformUserAction,
  removeUserPermissionOverrideAction,
  resetUserToDefaultPasswordAction,
  setPlatformUserActiveStateAction,
  updateCustomRoleAction,
  updateUserRoleAssignmentsAction,
  updateUserScopeAssignmentAction,
} from "../actions/administration-actions";
import type {
  AdministrationWorkspaceViewDTO,
  AdminRoleRecordDTO,
  AdminUserRecordDTO,
} from "../types/administration-types";
import type { CreateCustomRoleFormValues } from "../validators/custom-role-schema";
import type { ProvisionUserFormValues } from "../validators/provision-user-schema";
import { CreateCustomRoleDialog } from "./create-custom-role-dialog";
import { ManageUserAccountSheet } from "./manage-user-account-sheet";
import { ProvisionUserDialog } from "./provision-user-dialog";
import { RolesPermissionsTab } from "./roles-permissions-tab";
import { UsersListTab } from "./users-list-tab";

export interface AdministrationWorkspaceClientProps {
  view: AdministrationWorkspaceViewDTO;
  initialTab: string;
  initialSearch?: string;
  initialStatus?: string;
  initialUnit?: string;
  initialPage?: number;
  currentUserId: string;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManagePermissions: boolean;
}

const USERS_PAGE_SIZE = 10;
const USER_STATUS_OPTIONS = [
  { value: "ALL", label: "Semua status" },
  { value: "ACTIVE", label: "Akun aktif" },
  { value: "INACTIVE", label: "Akun nonaktif" },
] as const;

function normalizeTab(tab: string, isSandboxAllowed: boolean): string {
  if (tab === "roles" || tab === "permissions") return "roles";
  if (tab === "sandbox" && isSandboxAllowed) return "sandbox";
  return "users";
}

function normalizeUserStatus(status?: string): "ALL" | "ACTIVE" | "INACTIVE" {
  if (status === "ACTIVE" || status === "INACTIVE") return status;
  return "ALL";
}

function SandboxEnvironmentTab() {
  return (
    <section className="rounded-card border border-warning/40 bg-warning-soft/30 p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Icon icon={FlaskConical} size="sm" className="text-warning" />
        <h2 className="text-base font-semibold text-foreground">
          Lingkungan Uji Coba (Khusus Pengembangan · Administrator Platform)
        </h2>
      </div>
      <p className="text-xs text-secondary-foreground leading-relaxed">
        Area ini terisolasi dan hanya tersedia bagi{" "}
        <strong>Administrator Platform</strong> saat aplikasi berjalan di luar
        mode produksi (<code>NODE_ENV !== &quot;production&quot;</code>). Di
        lingkungan produksi, tab ini dinonaktifkan sepenuhnya.
      </p>
      <div className="rounded-control border border-border bg-surface p-4 space-y-2 text-xs">
        <p className="font-semibold text-foreground">
          Ringkasan kebijakan tata kelola yang selalu aktif (Tidak dapat
          dimatikan):
        </p>
        <ul className="list-disc pl-5 space-y-1 text-secondary-foreground">
          <li>
            <strong>Separation of Duties (SoD):</strong> Penyusun laporan,
            pengunggah dokumentasi, dan penulis publikasi tidak dapat menyetujui
            karyanya sendiri (termasuk Administrator Platform).
          </li>
          <li>
            <strong>Imutabilitas Audit &amp; Riwayat Laporan:</strong> Tabel{" "}
            <code>audit_logs</code> dan <code>report_workflow_logs</code> dijaga
            oleh trigger PostgreSQL append-only.
          </li>
          <li>
            <strong>Klasifikasi Data CONFIDENTIAL:</strong> Kontak wali, catatan
            perkembangan rahasia, dan bukti persetujuan default DENY di sisi
            server.
          </li>
        </ul>
      </div>
    </section>
  );
}

function useAdministrationMutations({
  guardOnline,
  pending,
  setPending,
  setFeedback,
  onProvisionSuccess,
  onCustomRoleSuccess,
}: {
  guardOnline: () => boolean;
  pending: boolean;
  setPending: (v: boolean) => void;
  setFeedback: (
    f: { tone: "success" | "danger" | "warning"; message: string } | null
  ) => void;
  onProvisionSuccess: () => void;
  onCustomRoleSuccess: () => void;
}) {
  const router = useRouter();

  async function runGuarded<T>(
    fn: () => Promise<
      { success: true; data: T } | { success: false; error: { message: string } }
    >,
    onSuccess: (data: T) => void
  ): Promise<T | null> {
    if (!guardOnline() || pending) return null;
    setPending(true);
    setFeedback(null);
    try {
      const res = await fn();
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return null;
      }
      onSuccess(res.data);
      router.refresh();
      return res.data;
    } finally {
      setPending(false);
    }
  }

  return {
    handleProvisionUser: async (values: ProvisionUserFormValues) =>
      Boolean(
        await runGuarded(
          () =>
            provisionNewPlatformUserAction({
              name: values.name,
              email: values.email,
              initialPassword: values.initialPassword,
              roleCode: values.roleCode,
              organizationId: values.organizationId,
              serviceUnitId: values.serviceUnitId,
            }),
          (d) => {
            onProvisionSuccess();
            setFeedback({
              tone: "success",
              message: `Akun ${d.email} berhasil dibuat dan wajib mengganti kata sandi saat pertama masuk.`,
            });
          }
        )
      ),
    handleSaveUserRoles: async (userId: string, roleCodes: string[]) =>
      Boolean(
        await runGuarded(
          () => updateUserRoleAssignmentsAction({ userId, roleCodes }),
          () =>
            setFeedback({
              tone: "success",
              message:
                "Peran diperbarui dan langsung berlaku efektif pada permintaan berikutnya.",
            })
        )
      ),
    handleToggleActive: async (
      userId: string,
      active: boolean,
      reason: string | null
    ) =>
      Boolean(
        await runGuarded(
          () => setPlatformUserActiveStateAction({ userId, active, reason }),
          () =>
            setFeedback({
              tone: "success",
              message: active
                ? "Pengguna diaktifkan kembali."
                : "Pengguna dinonaktifkan.",
            })
        )
      ),
    handleResetDefaultPassword: async (userId: string) => {
      const data = await runGuarded(
        () => resetUserToDefaultPasswordAction(userId),
        () =>
          setFeedback({
            tone: "success",
            message:
              "Sandi sementara sekali pakai berhasil dibuat. Salin dan berikan kepada pengguna.",
          })
      );
      return data?.temporaryPassword ?? null;
    },
    handleSaveCustomRole: async (
      values: CreateCustomRoleFormValues,
      editingRoleId: string | null
    ) =>
      Boolean(
        await runGuarded(
          () =>
            editingRoleId
              ? updateCustomRoleAction({
                  roleId: editingRoleId,
                  name: values.name,
                  description: values.description?.trim() || null,
                  permissionCodes: values.permissionCodes,
                })
              : createCustomRoleAction({
                  code: values.code,
                  name: values.name,
                  description: values.description?.trim() || null,
                  permissionCodes: values.permissionCodes,
                }),
          (d) => {
            onCustomRoleSuccess();
            setFeedback({
              tone: "success",
              message: editingRoleId
                ? `Peran kustom "${d.name}" berhasil diperbarui.`
                : `Peran kustom "${d.name}" (${d.code}) berhasil dibuat.`,
            });
          }
        )
      ),
    handleDeleteCustomRole: async (role: AdminRoleRecordDTO) =>
      Boolean(
        await runGuarded(
          () => deleteCustomRoleAction({ roleId: role.id }),
          (d) =>
            setFeedback({
              tone: "success",
              message: `Peran kustom "${d.name}" berhasil dihapus.`,
            })
        )
      ),
    handleApplyOverride: async (values: {
      userId: string;
      permissionCode: string;
      mode: "GRANT" | "REVOKE";
      reason: string;
    }) =>
      Boolean(
        await runGuarded(
          () => applyUserPermissionOverrideAction(values),
          (d) => {
            const label = getPermissionLabel(d.permissionCode);
            setFeedback({
              tone: "success",
              message:
                d.mode === "GRANT"
                  ? `Izin khusus "${label}" berhasil diberikan.`
                  : `Izin "${label}" berhasil dicabut dari akun ini.`,
            });
          }
        )
      ),
    handleRemoveOverride: async (userId: string, permissionCode: string) =>
      Boolean(
        await runGuarded(
          () => removeUserPermissionOverrideAction(userId, permissionCode),
          (d) =>
            setFeedback({
              tone: "success",
              message: `Izin khusus "${getPermissionLabel(d.permissionCode)}" dihapus; akun kembali mengikuti bawaan peran.`,
            })
        )
      ),
    handleAssignScope: async (values: {
      userId: string;
      organizationId: string;
      serviceUnitId: string;
      programId?: string | null;
    }) =>
      Boolean(
        await runGuarded(
          () => updateUserScopeAssignmentAction({ ...values, active: true }),
          () =>
            setFeedback({
              tone: "success",
              message:
                "Lingkup penugasan unit layanan berhasil diperbarui dan tercatat dalam jejak audit.",
            })
        )
      ),
  };
}

function useUserDirectoryFilters({
  view,
  initialTab,
  initialSearch,
  initialStatus,
  initialUnit,
  initialPage,
}: {
  view: AdministrationWorkspaceViewDTO;
  initialTab: string;
  initialSearch: string;
  initialStatus: string;
  initialUnit: string;
  initialPage: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState(() =>
    normalizeTab(initialTab, view.isSandboxAllowed)
  );
  const [userSearch, setUserSearch] = React.useState(initialSearch);
  const [userStatus, setUserStatus] = React.useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >(() => normalizeUserStatus(initialStatus));
  const [userUnit, setUserUnit] = React.useState(initialUnit);
  const [userPage, setUserPage] = React.useState(() =>
    Math.max(1, initialPage)
  );
  const searchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  function syncUrlParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    for (const [k, v] of Object.entries(updates)) {
      if (
        !v ||
        v === "ALL" ||
        (k === "page" && v === "1") ||
        (k === "tab" && v === "users")
      ) {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const unitOptions = React.useMemo(
    () => [
      { value: "ALL", label: "Semua unit layanan" },
      ...view.scopeCatalog.serviceUnits.map((u) => ({
        value: u.id,
        label: u.name,
      })),
    ],
    [view.scopeCatalog.serviceUnits]
  );

  const filteredUsers = React.useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return view.users.filter((u) => {
      if (userStatus === "ACTIVE" && !u.active) return false;
      if (userStatus === "INACTIVE" && u.active) return false;
      if (
        userUnit !== "ALL" &&
        !u.memberships.some((m) => m.serviceUnitId === userUnit)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.roles.some((r) => {
          const localized = (
            getRoleLabel(r.code as SystemRole) ?? r.name
          ).toLowerCase();
          return (
            localized.includes(q) ||
            r.name.toLowerCase().includes(q) ||
            r.code.toLowerCase().includes(q)
          );
        })
      );
    });
  }, [userSearch, userStatus, userUnit, view.users]);

  const totalUserPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / USERS_PAGE_SIZE)
  );
  const safeUserPage = Math.min(userPage, totalUserPages);
  const paginatedUsers = React.useMemo(() => {
    const start = (safeUserPage - 1) * USERS_PAGE_SIZE;
    return filteredUsers.slice(start, start + USERS_PAGE_SIZE);
  }, [filteredUsers, safeUserPage]);

  return {
    activeTab,
    userSearch,
    userStatus,
    userUnit,
    unitOptions,
    filteredUsers,
    totalUserPages,
    safeUserPage,
    paginatedUsers,
    handleTabChange: (nextTab: string) => {
      setActiveTab(nextTab);
      syncUrlParams({ tab: nextTab });
    },
    handleSearchChange: (val: string) => {
      setUserSearch(val);
      setUserPage(1);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        syncUrlParams({ search: val.trim() || null, page: null });
      }, 250);
    },
    handleStatusChange: (val: string) => {
      const norm = normalizeUserStatus(val);
      setUserStatus(norm);
      setUserPage(1);
      syncUrlParams({ status: norm, page: null });
    },
    handleUnitChange: (val: string) => {
      setUserUnit(val);
      setUserPage(1);
      syncUrlParams({ unit: val, page: null });
    },
    handleResetFilters: () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      setUserSearch("");
      setUserStatus("ALL");
      setUserUnit("ALL");
      setUserPage(1);
      syncUrlParams({ search: null, status: null, unit: null, page: null });
    },
    handlePageChange: (nextPage: number) => {
      setUserPage(nextPage);
      syncUrlParams({ page: String(nextPage) });
    },
    handleFilterUsersByRole: (roleLabel: string) => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      setActiveTab("users");
      setUserSearch(roleLabel);
      setUserStatus("ALL");
      setUserUnit("ALL");
      setUserPage(1);
      syncUrlParams({
        tab: "users",
        search: roleLabel,
        status: null,
        unit: null,
        page: null,
      });
    },
  };
}

function buildAdminTabs(view: AdministrationWorkspaceViewDTO): DetailTabItem[] {
  return [
    { id: "users", label: "Pengguna", count: view.users.length, icon: <Icon icon={Users} size="xs" /> },
    { id: "roles", label: "Peran & Hak Akses", count: view.roles.length, icon: <Icon icon={Shield} size="xs" /> },
    ...(view.isSandboxAllowed
      ? [{ id: "sandbox", label: "Lingkungan Uji Coba", icon: <Icon icon={FlaskConical} size="xs" /> }]
      : []),
  ];
}

export function AdministrationWorkspaceClient({
  view,
  initialTab,
  initialSearch = "",
  initialStatus = "ALL",
  initialUnit = "ALL",
  initialPage = 1,
  currentUserId,
  canManageUsers,
  canManageRoles,
  canManagePermissions,
}: AdministrationWorkspaceClientProps) {
  const f = useUserDirectoryFilters({ view, initialTab, initialSearch, initialStatus, initialUnit, initialPage });
  const [pending, setPending] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ tone: "success" | "danger" | "warning"; message: string } | null>(null);
  const { isOnline, checkOnline: guardOnline } = useTierCGuard("Administrasi & Hak Akses", (message) =>
    setFeedback({ tone: "warning", message })
  );
  const isOffline = !isOnline;

  const [provisionOpen, setProvisionOpen] = React.useState(false);
  const [customRoleOpen, setCustomRoleOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<AdminRoleRecordDTO | null>(null);
  const [managingUserId, setManagingUserId] = React.useState<string | null>(null);

  const mutations = useAdministrationMutations({
    guardOnline,
    pending,
    setPending,
    setFeedback,
    onProvisionSuccess: () => setProvisionOpen(false),
    onCustomRoleSuccess: () => {
      setCustomRoleOpen(false);
      setEditingRole(null);
    },
  });

  const managingUser = React.useMemo<AdminUserRecordDTO | null>(
    () => view.users.find((u) => u.id === managingUserId) ?? null,
    [view.users, managingUserId]
  );

  const tabs = buildAdminTabs(view);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrasi"
        description="Kelola akun pengguna, peran, lingkup unit layanan, dan pengecualian hak akses secara terpadu."
        primaryAction={
          f.activeTab === "users" && canManageUsers ? (
            <Button
              type="button"
              variant="primary"
              disabled={isOffline}
              onClick={() => setProvisionOpen(true)}
              leftIcon={<Icon icon={UserPlus} size="sm" />}
            >
              Tambah pengguna baru
            </Button>
          ) : f.activeTab === "roles" && canManageRoles ? (
            <Button
              type="button"
              variant="primary"
              disabled={isOffline}
              onClick={() => {
                setEditingRole(null);
                setCustomRoleOpen(true);
              }}
              leftIcon={<Icon icon={Plus} size="sm" />}
            >
              Buat peran kustom
            </Button>
          ) : undefined
        }
      />

      {isOffline && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-control border border-warning/40 bg-warning-soft px-4 py-3 text-xs text-foreground"
        >
          <Icon
            icon={CloudOff}
            size="sm"
            className="text-warning shrink-0 mt-0.5"
          />
          <span>
            Modul Administrasi &amp; Hak Akses memerlukan koneksi internet aktif
            (Tier C Online-Only).
          </span>
        </div>
      )}

      {feedback && (
        <FeedbackBanner
          tone={feedback.tone}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <DetailTabs
        tabs={tabs}
        activeTab={f.activeTab}
        onChange={f.handleTabChange}
        ariaLabel="Tab modul administrasi"
      />

      {f.activeTab === "users" && (
        <UsersListTab
          paginatedUsers={f.paginatedUsers}
          totalFilteredCount={f.filteredUsers.length}
          pageSize={USERS_PAGE_SIZE}
          currentPage={f.safeUserPage}
          totalPages={f.totalUserPages}
          userSearch={f.userSearch}
          userStatus={f.userStatus}
          userUnit={f.userUnit}
          activeFilterCount={
            (f.userStatus !== "ALL" ? 1 : 0) + (f.userUnit !== "ALL" ? 1 : 0)
          }
          statusOptions={USER_STATUS_OPTIONS}
          unitOptions={f.unitOptions}
          canManageAny={canManageUsers || canManageRoles || canManagePermissions}
          isOffline={isOffline}
          onSearchChange={f.handleSearchChange}
          onStatusChange={f.handleStatusChange}
          onUnitChange={f.handleUnitChange}
          onResetFilters={f.handleResetFilters}
          onPageChange={f.handlePageChange}
          onSelectUser={setManagingUserId}
        />
      )}

      {f.activeTab === "roles" && (
        <RolesPermissionsTab
          roles={view.roles}
          permissions={view.permissions}
          canManageRoles={canManageRoles}
          pending={pending}
          isOffline={isOffline}
          onFilterUsersByRole={f.handleFilterUsersByRole}
          onEditCustomRole={(role) => {
            setEditingRole(role);
            setCustomRoleOpen(true);
          }}
          onDeleteCustomRole={mutations.handleDeleteCustomRole}
        />
      )}

      {f.activeTab === "sandbox" && view.isSandboxAllowed && (
        <SandboxEnvironmentTab />
      )}

      <ProvisionUserDialog
        open={provisionOpen}
        onOpenChange={setProvisionOpen}
        onSubmit={mutations.handleProvisionUser}
        pending={pending}
        roles={view.roles}
        organizations={view.scopeCatalog.organizations}
        serviceUnits={view.scopeCatalog.serviceUnits}
      />

      <CreateCustomRoleDialog
        open={customRoleOpen}
        onOpenChange={(open) => {
          setCustomRoleOpen(open);
          if (!open) setEditingRole(null);
        }}
        editingRole={editingRole}
        onSubmit={mutations.handleSaveCustomRole}
        pending={pending}
        permissions={view.permissions}
      />

      <ManageUserAccountSheet
        key={managingUser?.id ?? "none"}
        open={Boolean(managingUser)}
        onOpenChange={(open) => {
          if (!open) setManagingUserId(null);
        }}
        user={managingUser}
        currentUserId={currentUserId}
        roles={view.roles}
        permissions={view.permissions}
        scopeCatalog={view.scopeCatalog}
        canManageUsers={canManageUsers}
        canManageRoles={canManageRoles}
        canManagePermissions={canManagePermissions}
        pending={pending}
        isOffline={isOffline}
        onSaveRoles={mutations.handleSaveUserRoles}
        onSaveScope={mutations.handleAssignScope}
        onApplyOverride={mutations.handleApplyOverride}
        onRemoveOverride={mutations.handleRemoveOverride}
        onToggleActive={mutations.handleToggleActive}
        onResetDefaultPassword={mutations.handleResetDefaultPassword}
      />

      {feedback && (
        <FloatingFeedbackToast
          tone={feedback.tone}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}
    </div>
  );
}
