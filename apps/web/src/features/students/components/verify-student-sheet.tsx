"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FeedbackBanner, FormBottomSheet } from "@/components/patterns";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
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
        <FeedbackBanner
          tone="danger"
          message={submitError}
          onDismiss={() => setSubmitError(null)}
        />
      )}

      <div className="space-y-1.5">
        <label
          htmlFor={decisionId}
          className="block text-sm font-medium text-foreground"
        >
          Keputusan verifikasi
        </label>
        <Controller
          control={control}
          name="decision"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={decisionId} autoFocus>
                <SelectValue placeholder="Pilih keputusan verifikasi" />
              </SelectTrigger>
              <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                <SelectItem value="VERIFIED">
                  Terverifikasi (Siap ditempatkan ke kelas)
                </SelectItem>
                <SelectItem value="PENDING_VERIFICATION">
                  Menunggu verifikasi lanjutan
                </SelectItem>
                <SelectItem value="WAITLIST">
                  Daftar tunggu (Kapasitas kelas penuh)
                </SelectItem>
                <SelectItem value="REJECTED">
                  Ditolak (Wajib isi alasan)
                </SelectItem>
                <SelectItem value="CANCELLED">
                  Dibatalkan (Wajib isi alasan)
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
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

