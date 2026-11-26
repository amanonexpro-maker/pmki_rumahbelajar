"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import {
  REPORT_TYPE_LABELS,
  type ReportAggregateMetricsDTO,
} from "../types/governance-types";
import {
  createReportFormSchema,
  REPORT_TYPE_VALUES,
  type CreateReportFormValues,
} from "../validators/governance-validator";

export interface GovernanceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: ReportAggregateMetricsDTO;
  onSubmit: (values: CreateReportFormValues) => Promise<boolean>;
  pending: boolean;
}

const DEFAULT_VALUES: CreateReportFormValues = {
  title: "",
  reportType: "ACTIVITY",
  period: "Triwulan IV 2026",
  summary: "",
};

export function GovernanceCreateDialog({
  open,
  onOpenChange,
  metrics,
  onSubmit,
  pending,
}: GovernanceCreateDialogProps) {
  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateReportFormValues>({
    resolver: zodResolver(createReportFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset(DEFAULT_VALUES);
    }
    onOpenChange(nextOpen);
  }

  async function handleFormSubmit(values: CreateReportFormValues) {
    if (pending) return;
    const succeeded = await onSubmit(values);
    if (succeeded) {
      reset(DEFAULT_VALUES);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Susun laporan baru</DialogTitle>
          <DialogDescription>
            Susun draft laporan pelayanan untuk ditinjau secara berjenjang.{" "}
            {PRIVACY_MESSAGES.auditLogged}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          <DialogBody className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="report-title"
                className="block text-xs font-medium text-foreground"
              >
                Judul laporan *
              </label>
              <Input
                id="report-title"
                placeholder="Contoh: Laporan Capaian Bimbingan Belajar & Literasi Triwulan IV"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-danger">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="report-type"
                  className="block text-xs font-medium text-foreground"
                >
                  Jenis laporan *
                </label>
                <Controller
                  control={control}
                  name="reportType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="report-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                        {REPORT_TYPE_VALUES.map((code) => (
                          <SelectItem key={code} value={code}>
                            {REPORT_TYPE_LABELS[code]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.reportType && (
                  <p className="text-xs text-danger">
                    {errors.reportType.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="report-period"
                  className="block text-xs font-medium text-foreground"
                >
                  Periode laporan *
                </label>
                <Input
                  id="report-period"
                  placeholder="Contoh: Triwulan IV 2026"
                  {...register("period")}
                />
                {errors.period && (
                  <p className="text-xs text-danger">{errors.period.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="report-summary"
                  className="block text-xs font-medium text-foreground"
                >
                  Ringkasan capaian & evaluasi *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const prev = getValues("summary") ?? "";
                    setValue(
                      "summary",
                      `${prev ? prev + " " : ""}Ringkasan operasional: ${metrics.activeStudentsCount} peserta didik aktif mengikuti ${metrics.recordedAttendanceSessionsCount} sesi belajar dengan ${metrics.developmentNotesCount} catatan perkembangan tercatat.`,
                      { shouldValidate: true }
                    );
                  }}
                  className="text-xs text-primary hover:underline focus-ring rounded-xs px-1"
                >
                  Sisipkan metrik agregat unit
                </button>
              </div>
              <Textarea
                id="report-summary"
                rows={4}
                placeholder="Tuliskan ringkasan kegiatan, capaian kehadiran, serta rekomendasi tindak lanjut tanpa mencantumkan data rahasia anak..."
                {...register("summary")}
              />
              {errors.summary && (
                <p className="text-xs text-danger">{errors.summary.message}</p>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleDialogOpenChange(false)}
              disabled={pending}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan draft laporan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

