import { z } from "zod";

export const REPORT_TYPE_VALUES = [
  "ACTIVITY",
  "ATTENDANCE",
  "STUDENT_DEVELOPMENT",
  "STAKEHOLDER",
] as const;

export const REPORT_STATUS_VALUES = [
  "DRAFT",
  "PROGRAM_REVIEW",
  "UNIT_VALIDATION",
  "ORGANIZATION_APPROVAL",
  "APPROVED",
  "REJECTED",
] as const;

export const DATA_CLASSIFICATION_VALUES = [
  "PUBLIC",
  "STAKEHOLDER",
  "INTERNAL",
  "CONFIDENTIAL",
] as const;

export const createReportSchema = z.object({
  serviceUnitId: z.string().uuid().optional(),
  title: z
    .string()
    .trim()
    .min(5, "Masukkan judul laporan (minimal 5 karakter).")
    .max(180, "Judul laporan maksimal 180 karakter."),
  reportType: z.enum(REPORT_TYPE_VALUES, {
    message: "Pilih jenis laporan pelayanan.",
  }),
  period: z
    .string()
    .trim()
    .min(3, "Masukkan periode laporan (contoh: Triwulan IV 2026).")
    .max(80, "Periode laporan maksimal 80 karakter."),
  summary: z
    .string()
    .trim()
    .min(20, "Tuliskan ringkasan capaian dan evaluasi laporan (minimal 20 karakter).")
    .max(4000, "Ringkasan laporan maksimal 4000 karakter."),
  classification: z.enum(DATA_CLASSIFICATION_VALUES).default("INTERNAL"),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const createReportFormSchema = createReportSchema.pick({
  title: true,
  reportType: true,
  period: true,
  summary: true,
});

export type CreateReportFormValues = z.infer<typeof createReportFormSchema>;

export const transitionReportStatusSchema = z
  .object({
    reportId: z.string().uuid("ID laporan tidak valid."),
    targetStatus: z.enum(REPORT_STATUS_VALUES, {
      message: "Pilih tahap status laporan tujuan.",
    }),
    comment: z
      .string()
      .trim()
      .max(1000, "Catatan keputusan maksimal 1000 karakter.")
      .optional()
      .nullable(),
  })
  .superRefine((val, ctx) => {
    if (
      val.targetStatus === "REJECTED" &&
      (!val.comment || val.comment.length < 5)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["comment"],
        message:
          "Tuliskan alasan penolakan atau catatan evaluasi laporan (minimal 5 karakter).",
      });
    }
  });

export type TransitionReportStatusInput = z.infer<
  typeof transitionReportStatusSchema
>;

export const transitionDecisionFormSchema = z
  .object({
    targetStatus: z.enum(REPORT_STATUS_VALUES),
    comment: z
      .string()
      .trim()
      .max(1000, "Catatan keputusan maksimal 1000 karakter.")
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (
      val.targetStatus === "REJECTED" &&
      (!val.comment || val.comment.length < 5)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["comment"],
        message:
          "Tuliskan alasan penolakan atau catatan evaluasi laporan (minimal 5 karakter).",
      });
    }
  });

export type TransitionDecisionFormValues = z.infer<
  typeof transitionDecisionFormSchema
>;

