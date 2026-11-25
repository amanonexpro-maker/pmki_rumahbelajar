"use client";

import * as React from "react";
import { Badge, Button, Textarea } from "@/components/ui";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import type {
  AdminPermissionRecordDTO,
  AdminUserRecordDTO,
} from "../types/administration-types";

export interface OverrideFormValues {
  userId: string;
  permissionCode: string;
  mode: "GRANT" | "REVOKE";
  reason: string;
}

export interface OverridesTabContentProps {
  users: AdminUserRecordDTO[];
  permissions: AdminPermissionRecordDTO[];
  canManagePermissions: boolean;
  isOffline: boolean;
  pending: boolean;
  onApplyOverride: (values: OverrideFormValues) => Promise<boolean>;
}

export function OverridesTabContent({
  users,
  permissions,
  canManagePermissions,
  isOffline,
  pending,
  onApplyOverride,
}: OverridesTabContentProps) {
  const [overrideUserId, setOverrideUserId] = React.useState(
    users[0]?.id ?? ""
  );
  const [overridePermCode, setOverridePermCode] = React.useState(
    permissions[0]?.code ?? "guardian.read"
  );
  const [overrideMode, setOverrideMode] = React.useState<"GRANT" | "REVOKE">(
    "GRANT"
  );
  const [overrideReason, setOverrideReason] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const succeeded = await onApplyOverride({
      userId: overrideUserId,
      permissionCode: overridePermCode,
      mode: overrideMode,
      reason: overrideReason,
    });
    if (succeeded) {
      setOverrideReason("");
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-card border border-border bg-surface p-5 space-y-4"
      >
        <h2 className="text-base font-semibold text-foreground">
          Tetapkan override hak akses per pengguna
        </h2>
        <p className="text-xs text-secondary-foreground leading-relaxed">
          Urutan resolusi: <strong>Peran → GRANT → REVOKE</strong>. Pencabutan
          akses (<code>REVOKE</code>) selalu menang dan langsung aktif tanpa
          perlu pengguna masuk ulang. {PRIVACY_MESSAGES.auditLogged}
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
            {users.map((u) => (
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
              {permissions.map((p) => (
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
          {users
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
                    variant={override.mode === "GRANT" ? "success" : "danger"}
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
  );
}

