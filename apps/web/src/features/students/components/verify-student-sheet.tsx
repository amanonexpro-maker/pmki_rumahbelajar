"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { FormBottomSheet } from "@/components/patterns";
import { Button, Textarea } from "@/components/ui";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import {
  verifyStudentFormSchema,
  type VerifyStudentFormValues,
} from "../validators/student-validator";

export interface VerifyStudentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  onSubmit: (
    values: VerifyStudentFormValues
  ) => Promise<{ success: true } | { success: false; error: string }>;
  pending: boolean;
}

const DEFAULT_VALUES: VerifyStudentFormValues = {
  decision: "VERIFIED",
  reason: "",
};

export function VerifyStudentSheet({
  open,
  onOpenChange,
  studentName,
  onSubmit,
  pending,
}: VerifyStudentSheetProps) {
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const decisionId = React.useId();
  const reasonId = React.useId();

  const form = useForm<VerifyStudentFormValues>({
    resolver: zodResolver(verifyStudentFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const currentDecision = useWatch({
    control,
    name: "decision",
  });

  async function handleFormSubmit(values: VerifyStudentFormValues) {
    setSubmitError(null);
    const result = await onSubmit(values);
    if (!result.success) {
      setSubmitError(result.error);
      return;
    }
    reset(DEFAULT_VALUES);
  }

  const renderForm = (formId: string) => (
    <form
      id={formId}
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-4"
      noValidate
    >
      {submitError && (
        <div
          role="alert"
          className="rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger"
        >
          {submitError}
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor={decisionId}
          className="block text-sm font-medium text-foreground"
        >
          Keputusan verifikasi
        </label>
        <select
          id={decisionId}
          autoFocus
          {...register("decision")}
          className="flex h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground focus-ring"
        >
          <option value="VERIFIED">
            Terverifikasi (Siap ditempatkan ke kelas)
          </option>
          <option value="PENDING_VERIFICATION">
            Menunggu verifikasi lanjutan
          </option>
          <option value="WAITLIST">
            Daftar tunggu (Kapasitas kelas penuh)
          </option>
          <option value="REJECTED">Ditolak (Wajib isi alasan)</option>
          <option value="CANCELLED">Dibatalkan (Wajib isi alasan)</option>
        </select>
        {errors.decision && (
          <p className="text-xs text-danger">{errors.decision.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={reasonId}
          className="block text-sm font-medium text-foreground"
        >
          Catatan atau alasan keputusan{" "}
          {(currentDecision === "REJECTED" ||
            currentDecision === "CANCELLED") &&
            "*"}
        </label>
        <Textarea
          id={reasonId}
          rows={3}
          {...register("reason")}
          placeholder="Tuliskan catatan verifikasi atau alasan keputusan..."
        />
        {errors.reason && (
          <p className="text-xs text-danger">{errors.reason.message}</p>
        )}
      </div>
    </form>
  );

  const renderFooter = (formId: string, isMobile: boolean) => (
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
        {pending ? "Menyimpan..." : "Simpan keputusan verifikasi"}
      </Button>
    </>
  );

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setSubmitError(null);
        onOpenChange(nextOpen);
      }}
      title="Verifikasi pendaftaran"
      description={
        <>
          Tentukan status verifikasi untuk{" "}
          <strong className="text-foreground">{studentName}</strong>.{" "}
          {PRIVACY_MESSAGES.auditLogged}
        </>
      }
      footer={renderFooter}
    >
      {renderForm}
    </FormBottomSheet>
  );
}

