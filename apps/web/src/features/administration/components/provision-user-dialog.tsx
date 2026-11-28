"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { FormBottomSheet } from "@/components/patterns";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { DEFAULT_GENERIC_PASSWORD } from "@/features/identity/validators/auth-validator";
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
      initialPassword: DEFAULT_GENERIC_PASSWORD,
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
    control,
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
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Tambah pengguna baru"
      description={`Membuat akun pengguna baru secara terpusat melalui Supabase Auth Admin API serta menetapkan peran dan lingkup awal. ${PRIVACY_MESSAGES.auditLogged}`}
      footer={(formId, isMobile) => (
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            fullWidth={isMobile}
          >
            Batal
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            disabled={pending}
            fullWidth={isMobile}
          >
            {pending ? "Membuat akun..." : "Buat akun pengguna"}
          </Button>
        </>
      )}
    >
      {(formId) => (
        <form
          id={formId}
          onSubmit={handleSubmit(handleFormSubmit)}
          noValidate
          className="space-y-4"
        >
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
                Kata sandi awal (bawaan) *
              </label>
              <Input
                id="prov-pass"
                type="text"
                placeholder="Minimal 8 karakter"
                {...register("initialPassword")}
              />
              <p className="text-[11px] text-muted-foreground">
                Pengguna wajib mengganti kata sandi bawaan saat pertama kali
                masuk.
              </p>
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
            <Controller
              control={control}
              name="roleCode"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="prov-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.code}>
                        {getRoleLabel(r.code as SystemRole) ?? r.name} ({r.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
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
              <Controller
                control={control}
                name="organizationId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="prov-org">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                      {organizations.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
              <Controller
                control={control}
                name="serviceUnitId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="prov-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                      {serviceUnits.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.serviceUnitId && (
                <p className="text-xs text-danger">
                  {errors.serviceUnitId.message}
                </p>
              )}
            </div>
          </div>
        </form>
      )}
    </FormBottomSheet>
  );
}
