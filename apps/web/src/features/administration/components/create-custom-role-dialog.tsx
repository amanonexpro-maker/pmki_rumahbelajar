"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { FormBottomSheet } from "@/components/patterns";
import { Button, Input, Textarea } from "@/components/ui";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import type { AdminPermissionRecordDTO } from "../types/administration-types";
import {
  createCustomRoleFormSchema,
  type CreateCustomRoleFormValues,
} from "../validators/custom-role-schema";

export interface CreateCustomRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateCustomRoleFormValues) => Promise<boolean>;
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
  onSubmit,
  pending,
  permissions,
}: CreateCustomRoleDialogProps) {
  const form = useForm<CreateCustomRoleFormValues>({
    resolver: zodResolver(createCustomRoleFormSchema),
    defaultValues: DEFAULT_VALUES,
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

  const selectedPerms =
    useWatch({
      control,
      name: "permissionCodes",
    }) ?? [];

  const nameRegister = register("name", {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setValue("code", e.target.value.toUpperCase(), { shouldValidate: true });
    },
  });

  async function handleFormSubmit(values: CreateCustomRoleFormValues) {
    const succeeded = await onSubmit(values);
    if (succeeded) {
      reset(DEFAULT_VALUES);
    }
  }

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Buat peran kustom"
      description={`Tambahkan peran baru (misalnya "Koordinator Remaja" atau "Peninjau Pendidikan") beserta daftar hak aksesnya tanpa perlu mengubah kode. ${PRIVACY_MESSAGES.auditLogged}`}
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
            {pending ? "Menyimpan..." : "Simpan peran kustom"}
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
                Kode peran (Huruf kapital) *
              </label>
              <Input
                id="cr-code"
                placeholder="KOORDINATOR_REMAJA"
                {...codeRegister}
              />
              {errors.code && (
                <p className="text-xs text-danger">{errors.code.message}</p>
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

          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">
              Pilih hak akses ({selectedPerms.length} dipilih) *
            </p>
            <div className="max-h-56 overflow-y-auto rounded-control border border-border p-3 space-y-2">
              {permissions.map((p) => {
                const checked = selectedPerms.includes(p.code);
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
                        const next = e.target.checked
                          ? [...selectedPerms, p.code]
                          : selectedPerms.filter((c) => c !== p.code);
                        setValue("permissionCodes", next, {
                          shouldValidate: true,
                        });
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
