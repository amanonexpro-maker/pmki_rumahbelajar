"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  CloudOff,
  FlaskConical,
  KeyRound,
  Plus,
  Shield,
  Sliders,
  UserPlus,
  Users,
} from "lucide-react";
import { SearchInput } from "@/components/compositions";
import {
  DetailTabs,
  FeedbackBanner,
  PageHeader,
  StatSummary,
  type DetailTabItem,
} from "@/components/patterns";
import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Icon,
  Textarea,
} from "@/components/ui";
import { useTierCGuard } from "@/hooks/use-tier-c-guard";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import { getRoleLabel, type SystemRole } from "@/lib/status";
import {
  applyUserPermissionOverrideAction,
  createCustomRoleAction,
  provisionNewPlatformUserAction,
  setPlatformUserActiveStateAction,
  updateUserRoleAssignmentsAction,
  updateUserScopeAssignmentAction,
} from "../actions/administration-actions";
import type {
  AdministrationWorkspaceViewDTO,
  AdminPermissionRecordDTO,
  AdminUserRecordDTO,
} from "../types/administration-types";
import type { CreateCustomRoleFormValues } from "../validators/custom-role-schema";
import type { EditUserRolesFormValues } from "../validators/edit-role-schema";
import type { ProvisionUserFormValues } from "../validators/provision-user-schema";
import { CreateCustomRoleDialog } from "./create-custom-role-dialog";
import { EditRoleDialog } from "./edit-role-dialog";
import {
  OverridesTabContent,
  type OverrideFormValues,
} from "./overrides-tab-content";
import { ProvisionUserDialog } from "./provision-user-dialog";
import {
  ScopesTabContent,
  type ScopeAssignmentFormValues,
} from "./scopes-tab-content";

export interface AdministrationWorkspaceClientProps {
  view: AdministrationWorkspaceViewDTO;
  initialTab: string;
  currentUserId: string;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManagePermissions: boolean;
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
  const [activeTab, setActiveTab] = React.useState(initialTab);
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

  // Dialog 1: Provision new user via Supabase Admin API
  const [provisionOpen, setProvisionOpen] = React.useState(false);

  // Dialog 2: Assign user roles
  const [editingRoleUser, setEditingRoleUser] =
    React.useState<AdminUserRecordDTO | null>(null);

  // Dialog 3: Deactivate / Activate user confirmation
  const [togglingUser, setTogglingUser] =
    React.useState<AdminUserRecordDTO | null>(null);
  const [toggleReason, setToggleReason] = React.useState("");

  // Dialog 4: Create custom role without coding
  const [customRoleOpen, setCustomRoleOpen] = React.useState(false);

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
        message: `Akun pengguna ${res.data.email} berhasil dibuat melalui Supabase Admin API dan dicatat dalam jejak audit.`,
      });
      router.refresh();
      return true;
    } finally {
      setPending(false);
    }
  }

  async function handleSaveUserRoles(
    values: EditUserRolesFormValues
  ): Promise<boolean> {
    if (!editingRoleUser || !guardOnline() || pending) return false;
    setPending(true);
    setFeedback(null);
    try {
      const res = await updateUserRoleAssignmentsAction({
        userId: editingRoleUser.id,
        roleCodes: values.roleCodes,
      });
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return false;
      }
      setEditingRoleUser(null);
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

  async function handleConfirmToggleActive(e: React.FormEvent) {
    e.preventDefault();
    if (!togglingUser || !guardOnline() || pending) return;
    setPending(true);
    setFeedback(null);
    try {
      const nextActive = !togglingUser.active;
      const res = await setPlatformUserActiveStateAction({
        userId: togglingUser.id,
        active: nextActive,
        reason: toggleReason.trim() || null,
      });
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return;
      }
      setTogglingUser(null);
      setToggleReason("");
      setFeedback({
        tone: "success",
        message: nextActive
          ? "Pengguna diaktifkan kembali."
          : "Pengguna dinonaktifkan.",
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleCreateCustomRole(
    values: CreateCustomRoleFormValues
  ): Promise<boolean> {
    if (!guardOnline() || pending) return false;
    setPending(true);
    setFeedback(null);
    try {
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
        message: `Peran kustom "${res.data.name}" (${res.data.code}) berhasil dibuat tanpa perubahan kode.`,
      });
      router.refresh();
      return true;
    } finally {
      setPending(false);
    }
  }

  async function handleApplyOverride(
    values: OverrideFormValues
  ): Promise<boolean> {
    if (!guardOnline() || pending) return false;
    setPending(true);
    setFeedback(null);
    try {
      const res = await applyUserPermissionOverrideAction({
        userId: values.userId,
        permissionCode: values.permissionCode,
        mode: values.mode,
        reason: values.reason,
      });
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return false;
      }
      setFeedback({
        tone: "success",
        message:
          res.data.mode === "GRANT"
            ? `Hak akses khusus "${res.data.permissionCode}" berhasil diberikan dan efektif seketika.`
            : `Hak akses "${res.data.permissionCode}" berhasil dicabut (REVOKE selalu menang) dan efektif seketika.`,
      });
      router.refresh();
      return true;
    } finally {
      setPending(false);
    }
  }

  async function handleAssignScope(
    values: ScopeAssignmentFormValues
  ): Promise<boolean> {
    if (!guardOnline() || pending) return false;
    setPending(true);
    setFeedback(null);
    try {
      const res = await updateUserScopeAssignmentAction({
        userId: values.userId,
        organizationId: values.organizationId,
        serviceUnitId: values.serviceUnitId,
        programId: values.programId || null,
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
      label: "Peran",
      count: view.roles.length,
      icon: <Icon icon={Shield} size="xs" />,
    },
    {
      id: "permissions",
      label: "Hak Akses",
      count: view.permissions.length,
      icon: <Icon icon={KeyRound} size="xs" />,
    },
    {
      id: "overrides",
      label: "Override akses",
      icon: <Icon icon={Sliders} size="xs" />,
    },
    {
      id: "scopes",
      label: "Penetapan lingkup",
      icon: <Icon icon={Building2} size="xs" />,
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
        u.roles.some((r) => r.name.toLowerCase().includes(q))
    );
  }, [userSearch, view.users]);

  const permissionsByModule = React.useMemo(() => {
    const map = new Map<string, AdminPermissionRecordDTO[]>();
    for (const p of view.permissions) {
      const list = map.get(p.module) ?? [];
      list.push(p);
      map.set(p.module, list);
    }
    return Array.from(map.entries());
  }, [view.permissions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrasi"
        description="Kelola Pengguna, Peran (termasuk peran kustom tanpa deploy), Registri Hak Akses, Override Akses (Grant/Revoke instan), dan Penetapan Lingkup Unit Layanan."
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
              onClick={() => setCustomRoleOpen(true)}
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

      <StatSummary
        items={[
          {
            id: "active-users",
            label: "Pengguna aktif",
            value: `${view.users.filter((u) => u.active).length} / ${view.users.length}`,
          },
          {
            id: "roles-total",
            label: "Peran terdaftar",
            value: `${view.roles.filter((r) => r.isSystem).length} sistem · ${view.roles.filter((r) => !r.isSystem).length} kustom`,
          },
          {
            id: "perms-total",
            label: "Registri hak akses",
            value: `${view.permissions.length} kode izin`,
          },
        ]}
      />

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

      {/* TAB 1: PENGGUNA */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="max-w-md">
            <SearchInput
              value={userSearch}
              onValueChange={setUserSearch}
              placeholder="Cari nama, email, atau peran pengguna..."
            />
          </div>

          <div className="rounded-card border border-border bg-surface divide-y divide-border">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
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
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
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

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {canManageRoles && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isOffline}
                      onClick={() => {
                        setEditingRoleUser(u);
                      }}
                    >
                      Tetapkan peran
                    </Button>
                  )}
                  {canManageUsers && u.id !== currentUserId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isOffline}
                      onClick={() => {
                        setTogglingUser(u);
                        setToggleReason("");
                      }}
                    >
                      {u.active ? "Nonaktifkan pengguna" : "Aktifkan pengguna"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PERAN (System + Custom Roles) */}
      {activeTab === "roles" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {view.roles.map((role) => (
            <section
              key={role.id}
              className="rounded-card border border-border bg-surface p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">
                      {getRoleLabel(role.code as SystemRole) ?? role.name}
                    </h2>
                    <Badge
                      variant={role.isSystem ? "neutral" : "info"}
                      size="sm"
                    >
                      {role.isSystem ? "Peran sistem" : "Peran kustom"}
                    </Badge>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    {role.code} · {role.assignedUserCount} pengguna
                  </p>
                </div>
                <Badge variant="primary" size="sm">
                  {role.permissionCodes.length} hak akses
                </Badge>
              </div>

              {role.description && (
                <p className="text-xs text-secondary-foreground leading-relaxed">
                  {role.description}
                </p>
              )}

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border-subtle">
                {role.permissionCodes.slice(0, 10).map((code) => (
                  <span
                    key={code}
                    className="rounded-xs bg-surface-subtle px-2 py-0.5 text-[11px] font-mono text-secondary-foreground"
                  >
                    {code}
                  </span>
                ))}
                {role.permissionCodes.length > 10 && (
                  <span className="text-[11px] text-muted-foreground px-1">
                    +{role.permissionCodes.length - 10} lainnya
                  </span>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* TAB 3: HAK AKSES (Read-only Registry Grouped by Module) */}
      {activeTab === "permissions" && (
        <div className="space-y-4">
          {permissionsByModule.map(([modName, perms]) => (
            <section
              key={modName}
              className="rounded-card border border-border bg-surface p-5 space-y-3"
            >
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-border-subtle">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Modul: {modName}
                </h2>
                <Badge variant="neutral" size="sm">
                  {perms.length} hak akses
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {perms.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-control border border-border-subtle bg-surface-subtle/40 p-3 space-y-1"
                  >
                    <p className="font-mono text-xs font-semibold text-primary">
                      {p.code}
                    </p>
                    <p className="text-xs font-medium text-foreground">
                      {p.name}
                    </p>
                    {p.description && (
                      <p className="text-[11px] text-secondary-foreground">
                        {p.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* TAB 4: OVERRIDE AKSES (Dynamic GRANT / REVOKE) */}
      {activeTab === "overrides" && (
        <OverridesTabContent
          users={view.users}
          permissions={view.permissions}
          canManagePermissions={canManagePermissions}
          isOffline={isOffline}
          pending={pending}
          onApplyOverride={handleApplyOverride}
        />
      )}

      {/* TAB 5: PENETAPAN LINGKUP (Scope Assignment) */}
      {activeTab === "scopes" && (
        <ScopesTabContent
          users={view.users}
          scopeCatalog={view.scopeCatalog}
          canManageUsers={canManageUsers}
          isOffline={isOffline}
          pending={pending}
          onAssignScope={handleAssignScope}
        />
      )}

      {/* TAB 6 (DEV-ONLY GATED PLATFORM_ADMIN): LINGKUNGAN UJI COBA (10 §26, U-08, U-12) */}
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

      {/* Dialog: Tambah pengguna baru (Supabase Admin API) */}
      <ProvisionUserDialog
        open={provisionOpen}
        onOpenChange={setProvisionOpen}
        onSubmit={handleProvisionUser}
        pending={pending}
        roles={view.roles}
        organizations={view.scopeCatalog.organizations}
        serviceUnits={view.scopeCatalog.serviceUnits}
      />

      {/* Dialog: Buat peran kustom tanpa coding */}
      <CreateCustomRoleDialog
        open={customRoleOpen}
        onOpenChange={setCustomRoleOpen}
        onSubmit={handleCreateCustomRole}
        pending={pending}
        permissions={view.permissions}
      />

      {/* Dialog: Tetapkan peran pengguna */}
      <EditRoleDialog
        open={Boolean(editingRoleUser)}
        onOpenChange={(open) => {
          if (!open) setEditingRoleUser(null);
        }}
        user={editingRoleUser}
        roles={view.roles}
        onSubmit={handleSaveUserRoles}
        pending={pending}
      />

      {/* Dialog: Konfirmasi Nonaktifkan / Aktifkan Pengguna */}
      <Dialog
        open={Boolean(togglingUser)}
        onOpenChange={(open) => {
          if (!open) setTogglingUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {togglingUser?.active
                ? "Nonaktifkan pengguna"
                : "Aktifkan kembali pengguna"}
            </DialogTitle>
            <DialogDescription>
              {togglingUser?.active
                ? `Menonaktifkan akun ${togglingUser.name} akan mencabut seluruh akses ruang kerja secara seketika tanpa menghapus riwayat jejak audit.`
                : `Mengaktifkan kembali akun ${togglingUser?.name} akan memulihkan akses sesuai peran dan lingkupnya.`}{" "}
              {PRIVACY_MESSAGES.auditLogged}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmToggleActive}>
            <DialogBody className="space-y-3">
              <div className="space-y-1">
                <label
                  htmlFor="toggle-user-reason"
                  className="block text-xs font-medium text-foreground"
                >
                  Alasan perubahan status akun{" "}
                  {togglingUser?.active ? "*" : "(opsional)"}
                </label>
                <Textarea
                  id="toggle-user-reason"
                  rows={2}
                  required={Boolean(togglingUser?.active)}
                  value={toggleReason}
                  onChange={(e) => setToggleReason(e.target.value)}
                  placeholder="Tuliskan alasan penonaktifan atau pengaktifan kembali akun..."
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setTogglingUser(null)}
                disabled={pending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant={togglingUser?.active ? "destructive" : "primary"}
                disabled={pending}
              >
                {pending
                  ? "Menyimpan..."
                  : togglingUser?.active
                    ? "Nonaktifkan pengguna"
                    : "Aktifkan pengguna"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

