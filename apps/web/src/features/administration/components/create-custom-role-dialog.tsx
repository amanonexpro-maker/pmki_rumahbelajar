"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { FormBottomSheet } from "@/components/patterns";
import { Button, Icon, Input, Textarea } from "@/components/ui";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import type {
  AdminPermissionRecordDTO,
  AdminRoleRecordDTO,
} from "../types/administration-types";
import {
  createCustomRoleFormSchema,
  type CreateCustomRoleFormValues,
} from "../validators/custom-role-schema";
import { groupPermissionsByModuleLabel } from "./administration-labels";

export interface CreateCustomRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRole?: AdminRoleRecordDTO | null;
  onSubmit: (
    values: CreateCustomRoleFormValues,
    editingRoleId: string | null
  ) => Promise<boolean>;
  pending: boolean;
  permissions: AdminPermissionRecordDTO[];
}

const DEFAULT_VALUES: CreateCustomRoleFormValues = {
  code: "",
  name: "",
  description: "",
  permissionCodes: ["student.read", "attendance.read"],
};

export function CreateCustomRoleDialog({
  open,
  onOpenChange,
  editingRole = null,
  onSubmit,
  pending,
  permissions,
}: CreateCustomRoleDialogProps) {
  const isEditing = Boolean(editingRole);
  const groupedModules = React.useMemo(
    () => groupPermissionsByModuleLabel(permissions),
    [permissions]
  );

  const form = useForm<CreateCustomRoleFormValues>({
    resolver: zodResolver(createCustomRoleFormSchema),
    defaultValues: editingRole
      ? {
          code: editingRole.code,
          name: editingRole.name,
          description: editingRole.description ?? "",
          permissionCodes: editingRole.permissionCodes,
        }
      : DEFAULT_VALUES,
  });

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { errors },
  } = form;

  React.useEffect(() => {
    if (!open) return;
    if (editingRole) {
      reset({
        code: editingRole.code,
        name: editingRole.name,
        description: editingRole.description ?? "",
        permissionCodes: editingRole.permissionCodes,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [open, editingRole, reset]);

  const selectedPerms =
    useWatch({
      control,
      name: "permissionCodes",
    }) ?? [];

  const nameRegister = register("name", {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isEditing) return;
      const val = e.target.value;
      if (!getValues("code")) {
        setValue(
          "code",
          val
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, "_")
            .replace(/^_|_$/g, ""),
          { shouldValidate: false }
        );
      }
    },
  });

  const codeRegister = register("code", {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isEditing) return;
      setValue("code", e.target.value.toUpperCase(), { shouldValidate: true });
    },
  });

  function togglePermission(code: string) {
    const next = selectedPerms.includes(code)
      ? selectedPerms.filter((c) => c !== code)
      : [...selectedPerms, code];
    setValue("permissionCodes", next, { shouldValidate: true });
  }

  function toggleModuleAll(modulePerms: AdminPermissionRecordDTO[]) {
    const codes = modulePerms.map((p) => p.code);
    const allSelected = codes.every((c) => selectedPerms.includes(c));
    const next = allSelected
      ? selectedPerms.filter((c) => !codes.includes(c))
      : Array.from(new Set([...selectedPerms, ...codes]));
    setValue("permissionCodes", next, { shouldValidate: true });
  }

  async function handleFormSubmit(values: CreateCustomRoleFormValues) {
    const succeeded = await onSubmit(values, editingRole?.id ?? null);
    if (succeeded && !isEditing) {
      reset(DEFAULT_VALUES);
    }
  }

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Ubah peran kustom" : "Buat peran kustom"}
      description={
        isEditing
          ? `Perbarui nama, deskripsi, atau daftar hak akses untuk peran "${editingRole?.name}". ${PRIVACY_MESSAGES.auditLogged}`
          : `Tambahkan peran baru beserta daftar hak aksesnya tanpa perlu mengubah kode. ${PRIVACY_MESSAGES.auditLogged}`
      }
      footer={(formId, isMobile) => (
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
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
            {pending
              ? "Menyimpan..."
              : isEditing
                ? "Simpan perubahan"
                : "Simpan peran kustom"}
          </Button>
        </div>
      )}
    >
      {(formId) => (
        <form
          id={formId}
          onSubmit={handleSubmit(handleFormSubmit)}
          noValidate
          className="space-y-5"
        >
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
                placeholder="Contoh: Koordinator Remaja"
                {...nameRegister}
              />
              {errors.name && (
                <p className="text-xs text-danger">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label
                htmlFor="cr-code"
                className="block text-xs font-medium text-foreground"
              >
                Kode peran *
              </label>
              <Input
                id="cr-code"
                placeholder="KOORDINATOR_REMAJA"
                disabled={isEditing}
                {...codeRegister}
              />
              {isEditing ? (
                <p className="text-[11px] text-muted-foreground">
                  Kode peran dikunci demi konsistensi jejak audit.
                </p>
              ) : (
                errors.code && (
                  <p className="text-xs text-danger">{errors.code.message}</p>
                )
              )}
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
              placeholder="Penjelasan cakupan tugas peran kustom..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-danger">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-foreground">
                Pilih hak akses ({selectedPerms.length} dipilih) *
              </p>
              {selectedPerms.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setValue("permissionCodes", [], { shouldValidate: true })
                  }
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Kosongkan pilihan
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto rounded-control border border-border bg-surface-subtle/30 p-3 space-y-4 [scrollbar-width:thin]">
              {groupedModules.map(([moduleLabel, modulePerms]) => {
                const allSelected = modulePerms.every((p) =>
                  selectedPerms.includes(p.code)
                );
                return (
                  <div key={moduleLabel} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground">
                        {moduleLabel}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleModuleAll(modulePerms)}
                        className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                      >
                        {allSelected ? "Batal pilih modul" : "Pilih semua"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {modulePerms.map((p) => {
                        const checked = selectedPerms.includes(p.code);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => togglePermission(p.code)}
                            aria-pressed={checked}
                            className={
                              checked
                                ? "inline-flex items-center gap-1 rounded-pill border border-primary bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary transition-colors cursor-pointer focus-ring"
                                : "inline-flex items-center gap-1 rounded-pill border border-border bg-surface px-2.5 py-1 text-xs text-secondary-foreground hover:bg-surface-subtle transition-colors cursor-pointer focus-ring"
                            }
                          >
                            {checked && (
                              <Icon icon={Check} size="xs" className="shrink-0" />
                            )}
                            <span>{p.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {errors.permissionCodes && (
              <p className="text-xs text-danger">
                {errors.permissionCodes.message}
              </p>
            )}
          </div>
        </form>
      )}
    </FormBottomSheet>
  );
}
