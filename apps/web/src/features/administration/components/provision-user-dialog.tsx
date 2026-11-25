"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@/components/ui";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import { getRoleLabel, type SystemRole } from "@/lib/status";
import type { AdministrationWorkspaceViewDTO } from "../types/administration-types";
import {
  provisionUserFormSchema,
  type ProvisionUserFormValues,
} from "../validators/provision-user-schema";

export interface ProvisionUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProvisionUserFormValues) => Promise<boolean>;
  pending: boolean;
  roles: AdministrationWorkspaceViewDTO["roles"];
  organizations: AdministrationWorkspaceViewDTO["scopeCatalog"]["organizations"];
  serviceUnits: AdministrationWorkspaceViewDTO["scopeCatalog"]["serviceUnits"];
}

export function ProvisionUserDialog({
  open,
  onOpenChange,
  onSubmit,
  pending,
  roles,
  organizations,
  serviceUnits,
}: ProvisionUserDialogProps) {
  const defaultValues = React.useMemo<ProvisionUserFormValues>(
    () => ({
      name: "",
      email: "",
      initialPassword: "",
      roleCode: "TEACHER",
      organizationId: organizations[0]?.id ?? "",
      serviceUnitId: serviceUnits[0]?.id ?? "",
    }),
    [organizations, serviceUnits]
  );

  const form = useForm<ProvisionUserFormValues>({
    resolver: zodResolver(provisionUserFormSchema),
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  async function handleFormSubmit(values: ProvisionUserFormValues) {
    const succeeded = await onSubmit(values);
    if (succeeded) {
      reset(defaultValues);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah pengguna baru</DialogTitle>
          <DialogDescription>
            Membuat akun pengguna baru secara terpusat melalui Supabase Auth
            Admin API (pendaftaran mandiri publik dinonaktifkan) serta
            menetapkan peran dan lingkup awal. {PRIVACY_MESSAGES.auditLogged}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
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
                placeholder="Contoh: Yohana Kartika S.Pd"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-danger">{errors.name.message}</p>
              )}
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
                  placeholder="yohana@pmki.org"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-danger">{errors.email.message}</p>
                )}
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
                  placeholder="Minimal 8 karakter"
                  {...register("initialPassword")}
                />
                {errors.initialPassword && (
                  <p className="text-xs text-danger">
                    {errors.initialPassword.message}
                  </p>
                )}
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
                {...register("roleCode")}
                className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.code}>
                    {getRoleLabel(r.code as SystemRole) ?? r.name} ({r.code})
                  </option>
                ))}
              </select>
              {errors.roleCode && (
                <p className="text-xs text-danger">{errors.roleCode.message}</p>
              )}
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
                  {...register("organizationId")}
                  className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
                >
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
                {errors.organizationId && (
                  <p className="text-xs text-danger">
                    {errors.organizationId.message}
                  </p>
                )}
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
                  {...register("serviceUnitId")}
                  className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
                >
                  {serviceUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                {errors.serviceUnitId && (
                  <p className="text-xs text-danger">
                    {errors.serviceUnitId.message}
                  </p>
                )}
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
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
  );
}

