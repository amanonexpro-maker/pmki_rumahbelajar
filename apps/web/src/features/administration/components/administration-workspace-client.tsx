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
  Input,
  Textarea,
} from "@/components/ui";
import { useConnectivity } from "@/hooks/use-connectivity";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import { checkTierCOnlineAvailability } from "@/lib/offline";
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
  const { status: connectivityStatus } = useConnectivity();
  const isOffline = connectivityStatus === "OFFLINE";

  const [activeTab, setActiveTab] = React.useState(initialTab);
  const [userSearch, setUserSearch] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    tone: "success" | "danger" | "warning";
    message: string;
  } | null>(null);

  // Dialog 1: Provision new user via Supabase Admin API
  const [provisionOpen, setProvisionOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [newRoleCode, setNewRoleCode] = React.useState("TEACHER");
  const [newOrgId, setNewOrgId] = React.useState(
    view.scopeCatalog.organizations[0]?.id ?? ""
  );
  const [newUnitId, setNewUnitId] = React.useState(
    view.scopeCatalog.serviceUnits[0]?.id ?? ""
  );

  // Dialog 2: Assign user roles
  const [editingRoleUser, setEditingRoleUser] =
    React.useState<AdminUserRecordDTO | null>(null);
  const [selectedRoleCodes, setSelectedRoleCodes] = React.useState<string[]>(
    []
  );

  // Dialog 3: Deactivate / Activate user confirmation
  const [togglingUser, setTogglingUser] =
    React.useState<AdminUserRecordDTO | null>(null);
  const [toggleReason, setToggleReason] = React.useState("");

  // Dialog 4: Create custom role without coding
  const [customRoleOpen, setCustomRoleOpen] = React.useState(false);
  const [customRoleCode, setCustomRoleCode] = React.useState("");
  const [customRoleName, setCustomRoleName] = React.useState("");
  const [customRoleDesc, setCustomRoleDesc] = React.useState("");
  const [customRolePerms, setCustomRolePerms] = React.useState<string[]>([
    "student.read",
    "attendance.read",
  ]);

  // Tab 4 State: Override permission form
  const [overrideUserId, setOverrideUserId] = React.useState(
    view.users[0]?.id ?? ""
  );
  const [overridePermCode, setOverridePermCode] = React.useState(
    view.permissions[0]?.code ?? "guardian.read"
  );
  const [overrideMode, setOverrideMode] = React.useState<"GRANT" | "REVOKE">(
    "GRANT"
  );
  const [overrideReason, setOverrideReason] = React.useState("");

  // Tab 5 State: Scope assignment form
  const [scopeUserId, setScopeUserId] = React.useState(
    view.users[0]?.id ?? ""
  );
  const [scopeOrgId, setScopeOrgId] = React.useState(
    view.scopeCatalog.organizations[0]?.id ?? ""
  );
  const [scopeUnitId, setScopeUnitId] = React.useState(
    view.scopeCatalog.serviceUnits[0]?.id ?? ""
  );
  const [scopeProgramId, setScopeProgramId] = React.useState(
    view.scopeCatalog.programs[0]?.id ?? ""
  );

  function handleTabChange(nextTab: string) {
    setActiveTab(nextTab);
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextTab === "users") next.delete("tab");
    else next.set("tab", nextTab);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function guardOnline(): boolean {
    const check = checkTierCOnlineAvailability(
      "Administrasi & Hak Akses",
      !isOffline
    );
    if (!check.allowed) {
      setFeedback({ tone: "warning", message: check.message });
      return false;
    }
    return true;
  }

  async function handleProvisionUser(e: React.FormEvent) {
    e.preventDefault();
    if (!guardOnline() || pending) return;
    setPending(true);
    setFeedback(null);
    try {
      const res = await provisionNewPlatformUserAction({
        name: newName,
        email: newEmail,
        initialPassword: newPassword,
        roleCode: newRoleCode,
        organizationId: newOrgId,
        serviceUnitId: newUnitId,
      });
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return;
      }
      setProvisionOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setFeedback({
        tone: "success",
        message: `Akun pengguna ${res.data.email} berhasil dibuat melalui Supabase Admin API dan dicatat dalam jejak audit.`,
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleSaveUserRoles(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRoleUser || !guardOnline() || pending) return;
    setPending(true);
    setFeedback(null);
    try {
      const res = await updateUserRoleAssignmentsAction({
        userId: editingRoleUser.id,
        roleCodes: selectedRoleCodes,
      });
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return;
      }
      setEditingRoleUser(null);
      setFeedback({
        tone: "success",
        message:
          "Peran diperbarui dan langsung berlaku efektif pada permintaan berikutnya.",
      });
      router.refresh();
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

  async function handleCreateCustomRole(e: React.FormEvent) {
    e.preventDefault();
    if (!guardOnline() || pending) return;
    setPending(true);
    setFeedback(null);
    try {
      const res = await createCustomRoleAction({
        code: customRoleCode,
        name: customRoleName,
        description: customRoleDesc.trim() || null,
        permissionCodes: customRolePerms,
      });
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return;
      }
      setCustomRoleOpen(false);
      setCustomRoleCode("");
      setCustomRoleName("");
      setCustomRoleDesc("");
      setFeedback({
        tone: "success",
        message: `Peran kustom "${res.data.name}" (${res.data.code}) berhasil dibuat tanpa perubahan kode.`,
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleApplyOverride(e: React.FormEvent) {
    e.preventDefault();
    if (!guardOnline() || pending) return;
    setPending(true);
    setFeedback(null);
    try {
      const res = await applyUserPermissionOverrideAction({
        userId: overrideUserId,
        permissionCode: overridePermCode,
        mode: overrideMode,
        reason: overrideReason,
      });
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return;
      }
      setOverrideReason("");
      setFeedback({
        tone: "success",
        message:
          res.data.mode === "GRANT"
            ? `Hak akses khusus "${res.data.permissionCode}" berhasil diberikan dan efektif seketika.`
            : `Hak akses "${res.data.permissionCode}" berhasil dicabut (REVOKE selalu menang) dan efektif seketika.`,
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleAssignScope(e: React.FormEvent) {
    e.preventDefault();
    if (!guardOnline() || pending) return;
    setPending(true);
    setFeedback(null);
    try {
      const res = await updateUserScopeAssignmentAction({
        userId: scopeUserId,
        organizationId: scopeOrgId,
        serviceUnitId: scopeUnitId,
        programId: scopeProgramId || null,
        active: true,
      });
      if (!res.success) {
        setFeedback({ tone: "danger", message: res.error.message });
        return;
      }
      setFeedback({
        tone: "success",
        message:
          "Lingkup penugasan unit layanan berhasil diperbarui dan tercatat dalam jejak audit.",
      });
      router.refresh();
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
        <div
          role={feedback.tone === "danger" ? "alert" : "status"}
          className={
            feedback.tone === "success"
              ? "rounded-control border border-success/30 bg-success-soft px-4 py-3 text-sm text-success"
              : feedback.tone === "warning"
                ? "rounded-control border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning-foreground"
                : "rounded-control border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
          }
        >
          {feedback.message}
        </div>
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
                        setSelectedRoleCodes(u.roles.map((r) => r.code));
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleApplyOverride}
            className="rounded-card border border-border bg-surface p-5 space-y-4"
          >
            <h2 className="text-base font-semibold text-foreground">
              Tetapkan override hak akses per pengguna
            </h2>
            <p className="text-xs text-secondary-foreground leading-relaxed">
              Urutan resolusi: <strong>Peran → GRANT → REVOKE</strong>.
              Pencabutan akses (<code>REVOKE</code>) selalu menang dan langsung
              aktif tanpa perlu pengguna masuk ulang.{" "}
              {PRIVACY_MESSAGES.auditLogged}
            </p>

            <div className="space-y-1">
              <label
                htmlFor="ov-user"
                className="block text-xs font-medium text-foreground"
              >
                Pilih pengguna
              </label>
              <select
                id="ov-user"
                value={overrideUserId}
                onChange={(e) => setOverrideUserId(e.target.value)}
                className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
              >
                {view.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="ov-perm"
                  className="block text-xs font-medium text-foreground"
                >
                  Kode hak akses
                </label>
                <select
                  id="ov-perm"
                  value={overridePermCode}
                  onChange={(e) => setOverridePermCode(e.target.value)}
                  className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm font-mono text-foreground focus-ring"
                >
                  {view.permissions.map((p) => (
                    <option key={p.id} value={p.code}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="ov-mode"
                  className="block text-xs font-medium text-foreground"
                >
                  Keputusan override
                </label>
                <select
                  id="ov-mode"
                  value={overrideMode}
                  onChange={(e) =>
                    setOverrideMode(e.target.value as "GRANT" | "REVOKE")
                  }
                  className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
                >
                  <option value="GRANT">Beri hak akses khusus (GRANT)</option>
                  <option value="REVOKE">
                    Cabut hak akses (REVOKE — selalu menang)
                  </option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="ov-reason"
                className="block text-xs font-medium text-foreground"
              >
                Alasan pemberian / pencabutan akses *
              </label>
              <Textarea
                id="ov-reason"
                rows={2}
                required
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Tuliskan alasan operasional penetapan override ini (minimal 5 karakter)..."
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!canManagePermissions || isOffline || pending}
            >
              {pending ? "Menyimpan..." : "Simpan override hak akses"}
            </Button>
          </form>

          <section className="rounded-card border border-border bg-surface p-5 space-y-4">
            <h2 className="text-base font-semibold text-foreground">
              Daftar override aktif saat ini
            </h2>
            <ul className="divide-y divide-border-subtle text-xs">
              {view.users
                .flatMap((u) =>
                  u.overrides.map((ov) => ({ user: u, override: ov }))
                )
                .map(({ user, override }) => (
                  <li
                    key={`${user.id}:${override.permissionCode}`}
                    className="py-3 space-y-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">
                        {user.name}
                      </span>
                      <Badge
                        variant={
                          override.mode === "GRANT" ? "success" : "danger"
                        }
                        size="sm"
                      >
                        {override.mode === "GRANT"
                          ? `GRANT: ${override.permissionCode}`
                          : `REVOKE: ${override.permissionCode}`}
                      </Badge>
                    </div>
                    {override.reason && (
                      <p className="text-secondary-foreground">
                        Alasan: {override.reason}
                      </p>
                    )}
                  </li>
                ))}
            </ul>
          </section>
        </div>
      )}

      {/* TAB 5: PENETAPAN LINGKUP (Scope Assignment) */}
      {activeTab === "scopes" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleAssignScope}
            className="rounded-card border border-border bg-surface p-5 space-y-4"
          >
            <h2 className="text-base font-semibold text-foreground">
              Penetapan lingkup organisasi & unit layanan
            </h2>
            <p className="text-xs text-secondary-foreground">
              Menentukan cakupan data yang dapat diakses pengguna sesuai prinsip
              Need To Know. {PRIVACY_MESSAGES.auditLogged}
            </p>

            <div className="space-y-1">
              <label
                htmlFor="scope-user"
                className="block text-xs font-medium text-foreground"
              >
                Pilih pengguna
              </label>
              <select
                id="scope-user"
                value={scopeUserId}
                onChange={(e) => setScopeUserId(e.target.value)}
                className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
              >
                {view.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="scope-org"
                className="block text-xs font-medium text-foreground"
              >
                Organisasi
              </label>
              <select
                id="scope-org"
                value={scopeOrgId}
                onChange={(e) => setScopeOrgId(e.target.value)}
                className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
              >
                {view.scopeCatalog.organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="scope-unit"
                className="block text-xs font-medium text-foreground"
              >
                Unit layanan
              </label>
              <select
                id="scope-unit"
                value={scopeUnitId}
                onChange={(e) => setScopeUnitId(e.target.value)}
                className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
              >
                {view.scopeCatalog.serviceUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="scope-prog"
                className="block text-xs font-medium text-foreground"
              >
                Program (opsional)
              </label>
              <select
                id="scope-prog"
                value={scopeProgramId}
                onChange={(e) => setScopeProgramId(e.target.value)}
                className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
              >
                <option value="">Seluruh program pada unit ini</option>
                {view.scopeCatalog.programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!canManageUsers || isOffline || pending}
            >
              {pending ? "Menyimpan..." : "Simpan penetapan lingkup"}
            </Button>
          </form>

          <section className="rounded-card border border-border bg-surface p-5 space-y-4">
            <h2 className="text-base font-semibold text-foreground">
              Cakupan aktif per pengguna
            </h2>
            <ul className="divide-y divide-border-subtle text-xs">
              {view.users.map((u) => (
                <li key={u.id} className="py-3 space-y-1">
                  <p className="font-semibold text-foreground">{u.name}</p>
                  {u.memberships.map((m) => (
                    <p key={m.id} className="text-secondary-foreground">
                      {m.organizationName} →{" "}
                      <strong className="text-foreground">
                        {m.serviceUnitName}
                      </strong>
                      {m.programName ? ` (${m.programName})` : ""}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        </div>
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
      <Dialog open={provisionOpen} onOpenChange={setProvisionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah pengguna baru</DialogTitle>
            <DialogDescription>
              Membuat akun pengguna baru secara terpusat melalui Supabase Auth
              Admin API (pendaftaran mandiri publik dinonaktifkan) serta
              menetapkan peran dan lingkup awal. {PRIVACY_MESSAGES.auditLogged}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProvisionUser}>
            <DialogBody className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="prov-name"
                  className="block text-xs font-medium text-foreground"
                >
                  Nama lengkap *
                </label>
                <Input
                  id="prov-name"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Yohana Kartika S.Pd"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="prov-email"
                    className="block text-xs font-medium text-foreground"
                  >
                    Alamat email *
                  </label>
                  <Input
                    id="prov-email"
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="yohana@pmki.org"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="prov-pass"
                    className="block text-xs font-medium text-foreground"
                  >
                    Kata sandi awal (min. 8 karakter) *
                  </label>
                  <Input
                    id="prov-pass"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="prov-role"
                  className="block text-xs font-medium text-foreground"
                >
                  Peran awal *
                </label>
                <select
                  id="prov-role"
                  value={newRoleCode}
                  onChange={(e) => setNewRoleCode(e.target.value)}
                  className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
                >
                  {view.roles.map((r) => (
                    <option key={r.id} value={r.code}>
                      {getRoleLabel(r.code as SystemRole) ?? r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="prov-org"
                    className="block text-xs font-medium text-foreground"
                  >
                    Organisasi *
                  </label>
                  <select
                    id="prov-org"
                    value={newOrgId}
                    onChange={(e) => setNewOrgId(e.target.value)}
                    className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
                  >
                    {view.scopeCatalog.organizations.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="prov-unit"
                    className="block text-xs font-medium text-foreground"
                  >
                    Unit layanan *
                  </label>
                  <select
                    id="prov-unit"
                    value={newUnitId}
                    onChange={(e) => setNewUnitId(e.target.value)}
                    className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
                  >
                    {view.scopeCatalog.serviceUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setProvisionOpen(false)}
                disabled={pending}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={pending}>
                {pending ? "Membuat akun..." : "Buat akun pengguna"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Buat peran kustom tanpa coding */}
      <Dialog open={customRoleOpen} onOpenChange={setCustomRoleOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat peran kustom</DialogTitle>
            <DialogDescription>
              Tambahkan peran baru (misalnya &quot;Koordinator Remaja&quot; atau
              &quot;Peninjau Pendidikan&quot;) beserta daftar hak aksesnya tanpa
              perlu mengubah kode atau melakukan deploy ulang.{" "}
              {PRIVACY_MESSAGES.auditLogged}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCustomRole}>
            <DialogBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="cr-name"
                    className="block text-xs font-medium text-foreground"
                  >
                    Nama peran kustom *
                  </label>
                  <Input
                    id="cr-name"
                    required
                    value={customRoleName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomRoleName(val);
                      if (!customRoleCode) {
                        setCustomRoleCode(
                          val
                            .toUpperCase()
                            .replace(/[^A-Z0-9]+/g, "_")
                            .replace(/^_|_$/g, "")
                        );
                      }
                    }}
                    placeholder="Contoh: Koordinator Remaja"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="cr-code"
                    className="block text-xs font-medium text-foreground"
                  >
                    Kode peran (Huruf kapital) *
                  </label>
                  <Input
                    id="cr-code"
                    required
                    value={customRoleCode}
                    onChange={(e) =>
                      setCustomRoleCode(e.target.value.toUpperCase())
                    }
                    placeholder="KOORDINATOR_REMAJA"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="cr-desc"
                  className="block text-xs font-medium text-foreground"
                >
                  Deskripsi tanggung jawab peran
                </label>
                <Textarea
                  id="cr-desc"
                  rows={2}
                  value={customRoleDesc}
                  onChange={(e) => setCustomRoleDesc(e.target.value)}
                  placeholder="Penjelasan cakupan tugas peran kustom..."
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">
                  Pilih hak akses ({customRolePerms.length} dipilih) *
                </p>
                <div className="max-h-56 overflow-y-auto rounded-control border border-border p-3 space-y-2">
                  {view.permissions.map((p) => {
                    const checked = customRolePerms.includes(p.code);
                    return (
                      <label
                        key={p.id}
                        className="flex items-start gap-2.5 text-xs cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCustomRolePerms((prev) => [...prev, p.code]);
                            } else {
                              setCustomRolePerms((prev) =>
                                prev.filter((c) => c !== p.code)
                              );
                            }
                          }}
                        />
                        <span>
                          <strong className="font-mono">{p.code}</strong> —{" "}
                          {p.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCustomRoleOpen(false)}
                disabled={pending}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan peran kustom"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Tetapkan peran pengguna */}
      <Dialog
        open={Boolean(editingRoleUser)}
        onOpenChange={(open) => {
          if (!open) setEditingRoleUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tetapkan peran pengguna</DialogTitle>
            <DialogDescription>
              Pilih peran untuk{" "}
              <strong className="text-foreground">
                {editingRoleUser?.name}
              </strong>
              . Perubahan langsung efektif pada permintaan berikutnya.{" "}
              {PRIVACY_MESSAGES.auditLogged}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveUserRoles}>
            <DialogBody className="space-y-3">
              {view.roles.map((r) => {
                const checked = selectedRoleCodes.includes(r.code);
                return (
                  <label
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-control border border-border p-3 text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRoleCodes((prev) => [...prev, r.code]);
                          } else {
                            setSelectedRoleCodes((prev) =>
                              prev.filter((c) => c !== r.code)
                            );
                          }
                        }}
                      />
                      <span className="font-semibold text-foreground">
                        {getRoleLabel(r.code as SystemRole) ?? r.name}
                      </span>
                    </div>
                    <span className="font-mono text-muted-foreground">
                      {r.code}
                    </span>
                  </label>
                );
              })}
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingRoleUser(null)}
                disabled={pending}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan penetapan peran"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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

