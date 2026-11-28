"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CloudOff,
  FlaskConical,
  Plus,
  Shield,
  Sliders,
  UserPlus,
  Users,
} from "lucide-react";
import { EmptyState, SearchInput } from "@/components/compositions";
import {
  DetailTabs,
  FeedbackBanner,
  FloatingFeedbackToast,
  PageHeader,
  type DetailTabItem,
} from "@/components/patterns";
import { Badge, Button, Icon } from "@/components/ui";
import { useTierCGuard } from "@/hooks/use-tier-c-guard";
import { getRoleLabel, type SystemRole } from "@/lib/status";
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

export interface AdministrationWorkspaceClientProps {
  view: AdministrationWorkspaceViewDTO;
  initialTab: string;
  currentUserId: string;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManagePermissions: boolean;
}

function normalizeTab(tab: string, isSandboxAllowed: boolean): string {
  if (tab === "roles" || tab === "permissions") return "roles";
  if (tab === "sandbox" && isSandboxAllowed) return "sandbox";
  return "users";
}

export function AdministrationWorkspaceClient({
  view,
  initialTab,
  currentUserId,
  canManageUsers,
  canManageRoles,
  canManagePermissions,
}: AdministrationWorkspaceClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState(() =>
    normalizeTab(initialTab, view.isSandboxAllowed)
  );
  const [userSearch, setUserSearch] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    tone: "success" | "danger" | "warning";
    message: string;
  } | null>(null);
  const { isOnline, checkOnline: guardOnline } = useTierCGuard(
    "Administrasi & Hak Akses",
    (message) => setFeedback({ tone: "warning", message })
  );
  const isOffline = !isOnline;

  const [provisionOpen, setProvisionOpen] = React.useState(false);
  const [customRoleOpen, setCustomRoleOpen] = React.useState(false);
  const [editingRole, setEditingRole] =
    React.useState<AdminRoleRecordDTO | null>(null);
  const [managingUserId, setManagingUserId] = React.useState<string | null>(
    null
  );

  const managingUser = React.useMemo<AdminUserRecordDTO | null>(
    () => view.users.find((u) => u.id === managingUserId) ?? null,
    [view.users, managingUserId]
  );

  function handleTabChange(nextTab: string) {
    setActiveTab(nextTab);
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextTab === "users") next.delete("tab");
    else next.set("tab", nextTab);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  async function handleProvisionUser(
    values: ProvisionUserFormValues
  ): Promise<boolean> {
    if (!guardOnline() || pending) return false;
    setPending(true);
    setFeedback(null);
    try {
      const res = await provisionNewPlatformUserAction({
        name: values.name,
        email: values.email,
        initialPassword: values.initialPassword,
        roleCode: values.roleCode,
        organizationId: values.organizationId,
        serviceUnitId: values.serviceUnitId,
      });
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return false;
      }
      setProvisionOpen(false);
      setFeedback({
        tone: "success",
        message: `Akun ${res.data.email} berhasil dibuat dan wajib mengganti kata sandi bawaan saat pertama masuk.`,
      });
      router.refresh();
      return true;
    } finally {
      setPending(false);
    }
  }

  async function handleSaveUserRoles(
    userId: string,
    roleCodes: string[]
  ): Promise<boolean> {
    if (!guardOnline() || pending) return false;
    setPending(true);
    setFeedback(null);
    try {
      const res = await updateUserRoleAssignmentsAction({
        userId,
        roleCodes,
      });
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return false;
      }
      setFeedback({
        tone: "success",
        message:
          "Peran diperbarui dan langsung berlaku efektif pada permintaan berikutnya.",
      });
      router.refresh();
      return true;
    } finally {
      setPending(false);
    }
  }

  async function handleToggleActive(
    userId: string,
    active: boolean,
    reason: string | null
  ): Promise<boolean> {
    if (!guardOnline() || pending) return false;
    setPending(true);
    setFeedback(null);
    try {
      const res = await setPlatformUserActiveStateAction({
        userId,
        active,
        reason,
      });
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return false;
      }
      setFeedback({
        tone: "success",
        message: active
          ? "Pengguna diaktifkan kembali."
          : "Pengguna dinonaktifkan.",
      });
      router.refresh();
      return true;
    } finally {
      setPending(false);
    }
  }

  async function handleResetDefaultPassword(userId: string): Promise<boolean> {
    if (!guardOnline() || pending) return false;
    setPending(true);
    setFeedback(null);
    try {
      const res = await resetUserToDefaultPasswordAction(userId);
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return false;
      }
      setFeedback({
        tone: "success",
        message:
          "Kata sandi disetel ulang ke sandi bawaan dan wajib diganti saat pengguna masuk berikutnya.",
      });
      router.refresh();
      return true;
    } finally {
      setPending(false);
    }
  }

  async function handleSaveCustomRole(
    values: CreateCustomRoleFormValues,
    editingRoleId: string | null
  ): Promise<boolean> {
    if (!guardOnline() || pending) return false;
    setPending(true);
    setFeedback(null);
    try {
      if (editingRoleId) {
        const res = await updateCustomRoleAction({
          roleId: editingRoleId,
          name: values.name,
          description: values.description?.trim() || null,
          permissionCodes: values.permissionCodes,
        });
        if (!res.success) {
          setFeedback({ tone: "danger", message: res.error.message });
          return false;
        }
        setCustomRoleOpen(false);
        setEditingRole(null);
        setFeedback({
          tone: "success",
          message: `Peran kustom "${res.data.name}" berhasil diperbarui.`,
        });
        router.refresh();
        return true;
      }

      const res = await createCustomRoleAction({
        code: values.code,
        name: values.name,
        description: values.description?.trim() || null,
        permissionCodes: values.permissionCodes,
      });
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return false;
      }
      setCustomRoleOpen(false);
      setFeedback({
        tone: "success",
        message: `Peran kustom "${res.data.name}" (${res.data.code}) berhasil dibuat.`,
      });
      router.refresh();
      return true;
    } finally {
      setPending(false);
    }
  }

  async function handleDeleteCustomRole(
    role: AdminRoleRecordDTO
  ): Promise<boolean> {
    if (!guardOnline() || pending) return false;
    setPending(true);
    setFeedback(null);
    try {
      const res = await deleteCustomRoleAction({ roleId: role.id });
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return false;
      }
      setFeedback({
        tone: "success",
        message: `Peran kustom "${res.data.name}" berhasil dihapus.`,
      });
      router.refresh();
      return true;
    } finally {
      setPending(false);
    }
  }

  function handleFilterUsersByRole(roleLabel: string) {
    setUserSearch(roleLabel);
    handleTabChange("users");
  }

  async function handleApplyOverride(values: {
    userId: string;
    permissionCode: string;
    mode: "GRANT" | "REVOKE";
    reason: string;
  }): Promise<boolean> {
    if (!guardOnline() || pending) return false;
    setPending(true);
    setFeedback(null);
    try {
      const res = await applyUserPermissionOverrideAction(values);
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return false;
      }
      setFeedback({
        tone: "success",
        message:
          res.data.mode === "GRANT"
            ? `Hak akses khusus "${res.data.permissionCode}" berhasil diberikan.`
            : `Hak akses "${res.data.permissionCode}" berhasil dicabut (REVOKE selalu menang).`,
      });
      router.refresh();
      return true;
    } finally {
      setPending(false);
    }
  }

  async function handleRemoveOverride(
    userId: string,
    permissionCode: string
  ): Promise<boolean> {
    if (!guardOnline() || pending) return false;
    setPending(true);
    setFeedback(null);
    try {
      const res = await removeUserPermissionOverrideAction(
        userId,
        permissionCode
      );
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return false;
      }
      setFeedback({
        tone: "success",
        message: `Izin khusus "${res.data.permissionCode}" dihapus; akun kembali mengikuti bawaan peran.`,
      });
      router.refresh();
      return true;
    } finally {
      setPending(false);
    }
  }

  async function handleAssignScope(values: {
    userId: string;
    organizationId: string;
    serviceUnitId: string;
    programId?: string | null;
  }): Promise<boolean> {
    if (!guardOnline() || pending) return false;
    setPending(true);
    setFeedback(null);
    try {
      const res = await updateUserScopeAssignmentAction({
        ...values,
        active: true,
      });
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return false;
      }
      setFeedback({
        tone: "success",
        message:
          "Lingkup penugasan unit layanan berhasil diperbarui dan tercatat dalam jejak audit.",
      });
      router.refresh();
      return true;
    } finally {
      setPending(false);
    }
  }

  const tabs: DetailTabItem[] = [
    {
      id: "users",
      label: "Pengguna",
      count: view.users.length,
      icon: <Icon icon={Users} size="xs" />,
    },
    {
      id: "roles",
      label: "Peran & Hak Akses",
      count: view.roles.length,
      icon: <Icon icon={Shield} size="xs" />,
    },
    ...(view.isSandboxAllowed
      ? [
          {
            id: "sandbox",
            label: "Lingkungan Uji Coba",
            icon: <Icon icon={FlaskConical} size="xs" />,
          },
        ]
      : []),
  ];

  const filteredUsers = React.useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return view.users;
    return view.users.filter(
      (u) =>
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
  }, [userSearch, view.users]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrasi"
        description="Kelola akun pengguna, peran, lingkup unit layanan, dan pengecualian hak akses secara terpadu."
        primaryAction={
          activeTab === "users" && canManageUsers ? (
            <Button
              type="button"
              variant="primary"
              disabled={isOffline}
              onClick={() => setProvisionOpen(true)}
              leftIcon={<Icon icon={UserPlus} size="sm" />}
            >
              Tambah pengguna baru
            </Button>
          ) : activeTab === "roles" && canManageRoles ? (
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
            Modul Administrasi & Hak Akses memerlukan koneksi internet aktif
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
        activeTab={activeTab}
        onChange={handleTabChange}
        ariaLabel="Tab modul administrasi"
      />

      {/* TAB 1: PENGGUNA (Satu pintu per pengguna) */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="max-w-md">
            <SearchInput
              value={userSearch}
              onValueChange={setUserSearch}
              placeholder="Cari nama, email, atau peran pengguna..."
            />
          </div>

          {filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Pengguna tidak ditemukan"
              description="Tidak ada akun yang cocok dengan kata kunci pencarian Anda. Coba ubah kata kunci atau reset pencarian."
              action={
                userSearch ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setUserSearch("")}
                  >
                    Tampilkan semua pengguna
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="rounded-card border border-border bg-surface divide-y divide-border">
              {filteredUsers.map((u) => (
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
                          {u.overrides.length} override
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

                  {(canManageUsers || canManageRoles || canManagePermissions) && (
                    <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isOffline}
                        onClick={() => setManagingUserId(u.id)}
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
          )}
        </div>
      )}

      {/* TAB 2: PERAN & HAK AKSES */}
      {activeTab === "roles" && (
        <RolesPermissionsTab
          roles={view.roles}
          permissions={view.permissions}
          canManageRoles={canManageRoles}
          pending={pending}
          isOffline={isOffline}
          onFilterUsersByRole={handleFilterUsersByRole}
          onEditCustomRole={(role) => {
            setEditingRole(role);
            setCustomRoleOpen(true);
          }}
          onDeleteCustomRole={handleDeleteCustomRole}
        />
      )}

      {/* TAB 3 (DEV-ONLY): LINGKUNGAN UJI COBA */}
      {activeTab === "sandbox" && view.isSandboxAllowed && (
        <section className="rounded-card border border-warning/40 bg-warning-soft/30 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Icon icon={FlaskConical} size="sm" className="text-warning" />
            <h2 className="text-base font-semibold text-foreground">
              Lingkungan Uji Coba (Khusus Pengembangan · Administrator Platform)
            </h2>
          </div>
          <p className="text-xs text-secondary-foreground leading-relaxed">
            Area ini terisolasi dan hanya tersedia bagi{" "}
            <strong>Administrator Platform</strong> saat aplikasi berjalan di
            luar mode produksi (<code>NODE_ENV !== &quot;production&quot;</code>
            ). Di lingkungan produksi, tab ini dinonaktifkan sepenuhnya.
          </p>

          <div className="rounded-control border border-border bg-surface p-4 space-y-2 text-xs">
            <p className="font-semibold text-foreground">
              Ringkasan kebijakan tata kelola yang selalu aktif (Tidak dapat
              dimatikan):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-secondary-foreground">
              <li>
                <strong>Separation of Duties (SoD):</strong> Penyusun laporan,
                pengunggah dokumentasi, dan penulis publikasi tidak dapat
                menyetujui karyanya sendiri (termasuk Administrator Platform).
              </li>
              <li>
                <strong>Imutabilitas Audit & Riwayat Laporan:</strong> Tabel{" "}
                <code>audit_logs</code> dan <code>report_workflow_logs</code>{" "}
                dijaga oleh trigger PostgreSQL append-only.
              </li>
              <li>
                <strong>Klasifikasi Data CONFIDENTIAL:</strong> Kontak wali,
                catatan perkembangan rahasia, dan bukti persetujuan default DENY
                di sisi server.
              </li>
            </ul>
          </div>
        </section>
      )}

      <ProvisionUserDialog
        open={provisionOpen}
        onOpenChange={setProvisionOpen}
        onSubmit={handleProvisionUser}
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
        onSubmit={handleSaveCustomRole}
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
        onSaveRoles={handleSaveUserRoles}
        onSaveScope={handleAssignScope}
        onApplyOverride={handleApplyOverride}
        onRemoveOverride={handleRemoveOverride}
        onToggleActive={handleToggleActive}
        onResetDefaultPassword={handleResetDefaultPassword}
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
