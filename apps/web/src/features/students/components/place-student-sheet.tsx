"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { FormBottomSheet } from "@/components/patterns";
import { Button, Textarea } from "@/components/ui";
import type { ClassSummaryDTO } from "@/features/academic";
import {
  placeStudentFormSchema,
  type PlaceStudentFormValues,
} from "../validators/student-validator";

export interface PlaceStudentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  defaultClassId?: string;
  classes: ClassSummaryDTO[];
  onSubmit: (
    values: PlaceStudentFormValues
  ) => Promise<{ success: true } | { success: false; error: string }>;
  pending: boolean;
}

export function PlaceStudentSheet({
  open,
  onOpenChange,
  studentName,
  defaultClassId,
  classes,
  onSubmit,
  pending,
}: PlaceStudentSheetProps) {
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const classIdFieldId = React.useId();
  const notesFieldId = React.useId();

  const initialClassId = React.useMemo(
    () =>
      defaultClassId ??
      classes.find((c) => !c.isFull)?.id ??
      classes[0]?.id ??
      "",
    [classes, defaultClassId]
  );

  const form = useForm<PlaceStudentFormValues>({
    resolver: zodResolver(placeStudentFormSchema),
    defaultValues: {
      classId: initialClassId,
      notes: "",
    },
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const currentClassId = useWatch({
    control,
    name: "classId",
  });

  React.useEffect(() => {
    if (open) {
      reset({
        classId: initialClassId,
        notes: "",
      });
    }
  }, [open, initialClassId, reset]);

  async function handleFormSubmit(values: PlaceStudentFormValues) {
    setSubmitError(null);
    const result = await onSubmit(values);
    if (!result.success) {
      setSubmitError(result.error);
      return;
    }
    reset({
      classId: initialClassId,
      notes: "",
    });
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
          htmlFor={classIdFieldId}
          className="block text-sm font-medium text-foreground"
        >
          Kelas tujuan
        </label>
        <select
          id={classIdFieldId}
          autoFocus
          {...register("classId")}
          className="flex h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground focus-ring"
        >
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} — {cls.enrolledCount}/{cls.capacity} peserta didik
              {cls.isFull
                ? " (Penuh)"
                : ` (Sisa ${cls.remainingSeats} kursi)`}
            </option>
          ))}
        </select>
        {errors.classId && (
          <p className="text-xs text-danger">{errors.classId.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={notesFieldId}
          className="block text-sm font-medium text-foreground"
        >
          Catatan penempatan (opsional)
        </label>
        <Textarea
          id={notesFieldId}
          rows={2}
          {...register("notes")}
          placeholder="Catatan tambahan penempatan kelas..."
        />
        {errors.notes && (
          <p className="text-xs text-danger">{errors.notes.message}</p>
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
        disabled={pending || !currentClassId}
        fullWidth={isMobile}
      >
        {pending ? "Menempatkan..." : "Tempatkan ke kelas"}
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
      title="Tempatkan ke kelas"
      description={
        <>
          Pilih kelas bimbingan belajar untuk{" "}
          <strong className="text-foreground">{studentName}</strong>. Penempatan
          kelas dikelola melalui layanan domain Academic dan dicatat dalam jejak
          audit.
        </>
      }
      footer={renderFooter}
    >
      {renderForm}
    </FormBottomSheet>
  );
}

