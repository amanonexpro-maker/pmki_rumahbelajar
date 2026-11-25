"use client";

import * as React from "react";
import { Button } from "@/components/ui";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import type {
  AdministrationWorkspaceViewDTO,
  AdminUserRecordDTO,
} from "../types/administration-types";

export interface ScopeAssignmentFormValues {
  userId: string;
  organizationId: string;
  serviceUnitId: string;
  programId: string;
}

export interface ScopesTabContentProps {
  users: AdminUserRecordDTO[];
  scopeCatalog: AdministrationWorkspaceViewDTO["scopeCatalog"];
  canManageUsers: boolean;
  isOffline: boolean;
  pending: boolean;
  onAssignScope: (values: ScopeAssignmentFormValues) => Promise<boolean>;
}

export function ScopesTabContent({
  users,
  scopeCatalog,
  canManageUsers,
  isOffline,
  pending,
  onAssignScope,
}: ScopesTabContentProps) {
  const [scopeUserId, setScopeUserId] = React.useState(users[0]?.id ?? "");
  const [scopeOrgId, setScopeOrgId] = React.useState(
    scopeCatalog.organizations[0]?.id ?? ""
  );
  const [scopeUnitId, setScopeUnitId] = React.useState(
    scopeCatalog.serviceUnits[0]?.id ?? ""
  );
  const [scopeProgramId, setScopeProgramId] = React.useState(
    scopeCatalog.programs[0]?.id ?? ""
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onAssignScope({
      userId: scopeUserId,
      organizationId: scopeOrgId,
      serviceUnitId: scopeUnitId,
      programId: scopeProgramId,
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form
        onSubmit={handleSubmit}
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
            {users.map((u) => (
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
            {scopeCatalog.organizations.map((o) => (
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
            {scopeCatalog.serviceUnits.map((u) => (
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
            {scopeCatalog.programs.map((p) => (
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
          {users.map((u) => (
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
  );
}

