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
  Textarea,
} from "@/components/ui";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import type { ReportStatus } from "@/lib/status";
import {
  transitionDecisionFormSchema,
  type TransitionDecisionFormValues,
} from "../validators/governance-validator";

export interface GovernanceTransitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportTitle?: string;
  reportPeriod?: string;
  targetStatus?: ReportStatus;
  actionTitle?: string;
  onConfirm: (values: TransitionDecisionFormValues) => Promise<void> | void;
  pending: boolean;
}

export function GovernanceTransitionDialog({
  open,
  onOpenChange,
  reportTitle,
  reportPeriod,
  targetStatus = "DRAFT",
  actionTitle,
  onConfirm,
  pending,
}: GovernanceTransitionDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransitionDecisionFormValues>({
    resolver: zodResolver(transitionDecisionFormSchema),
    defaultValues: {
      targetStatus,
      comment: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        targetStatus,
        comment: "",
      });
    }
  }, [open, targetStatus, reset]);

  async function handleFormSubmit(values: TransitionDecisionFormValues) {
    if (pending) return;
    await onConfirm(values);
  }

  const isReject = targetStatus === "REJECTED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionTitle}</DialogTitle>
          <DialogDescription>
            Dokumen: <strong className="text-foreground">{reportTitle}</strong>{" "}
            ({reportPeriod}). {PRIVACY_MESSAGES.auditLogged}{" "}
            {PRIVACY_MESSAGES.sodApprovalRestricted}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="decision-comment"
                className="block text-sm font-medium text-foreground"
              >
                Catatan atau alasan keputusan {isReject && "*"}
              </label>
              <Textarea
                id="decision-comment"
                rows={3}
                placeholder={
                  isReject
                    ? "Tuliskan alasan penolakan atau bagian yang perlu diperbaiki (minimal 5 karakter)..."
                    : "Tambahkan catatan validasi atau pengesahan (opsional)..."
                }
                {...register("comment")}
              />
              {errors.comment && (
                <p className="text-xs text-danger">{errors.comment.message}</p>
              )}
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
            <Button
              type="submit"
              variant={isReject ? "destructive" : "primary"}
              disabled={pending}
            >
              {pending ? "Menyimpan..." : "Simpan keputusan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

