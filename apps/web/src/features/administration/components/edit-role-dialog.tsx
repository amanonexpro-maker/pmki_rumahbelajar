"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import { getRoleLabel, type SystemRole } from "@/lib/status";
import type {
  AdministrationWorkspaceViewDTO,
  AdminUserRecordDTO,
} from "../types/administration-types";
import {
  editUserRolesFormSchema,
  type EditUserRolesFormValues,
} from "../validators/edit-role-schema";

export interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUserRecordDTO | null;
  roles: AdministrationWorkspaceViewDTO["roles"];
  onSubmit: (values: EditUserRolesFormValues) => Promise<boolean>;
  pending: boolean;
}

export function EditRoleDialog({
  open,
  onOpenChange,
  user,
  roles,
  onSubmit,
  pending,
}: EditRoleDialogProps) {
  const form = useForm<EditUserRolesFormValues>({
    resolver: zodResolver(editUserRolesFormSchema),
    defaultValues: {
      roleCodes: user?.roles.map((r) => r.code) ?? [],
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = form;

  React.useEffect(() => {
    if (open && user) {
      reset({
        roleCodes: user.roles.map((r) => r.code),
      });
    }
  }, [open, user, reset]);

  const selectedRoleCodes =
    useWatch({
      control,
      name: "roleCodes",
    }) ?? [];

  async function handleFormSubmit(values: EditUserRolesFormValues) {
    await onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tetapkan peran pengguna</DialogTitle>
          <DialogDescription>
            Pilih peran untuk{" "}
            <strong className="text-foreground">{user?.name}</strong>. Perubahan
            langsung efektif pada permintaan berikutnya.{" "}
            {PRIVACY_MESSAGES.auditLogged}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          <DialogBody className="space-y-3">
            {roles.map((r) => {
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
                        const next = e.target.checked
                          ? [...selectedRoleCodes, r.code]
                          : selectedRoleCodes.filter((c) => c !== r.code);
                        setValue("roleCodes", next, { shouldValidate: true });
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
            {errors.roleCodes && (
              <p className="text-xs text-danger">{errors.roleCodes.message}</p>
            )}
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
              {pending ? "Menyimpan..." : "Simpan penetapan peran"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

