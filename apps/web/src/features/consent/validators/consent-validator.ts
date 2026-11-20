import { z } from "zod";

export const CONSENT_STATUS_VALUES = ["GRANTED", "DENIED", "REVOKED"] as const;

export const updateStudentConsentSchema = z
  .object({
    consentId: z.string().uuid("ID persetujuan tidak valid."),
    personalDataConsent: z.enum(CONSENT_STATUS_VALUES, {
      message: "Pilih status persetujuan data pribadi.",
    }),
    photoVideoConsent: z.enum(CONSENT_STATUS_VALUES, {
      message: "Pilih status persetujuan foto dan video.",
    }),
    notes: z
      .string()
      .trim()
      .max(1000, "Catatan persetujuan maksimal 1000 karakter.")
      .optional()
      .nullable(),
  })
  .superRefine((val, ctx) => {
    if (
      (val.personalDataConsent === "REVOKED" ||
        val.photoVideoConsent === "REVOKED") &&
      (!val.notes || val.notes.length < 5)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["notes"],
        message:
          "Tuliskan alasan atau keterangan pencabutan persetujuan (minimal 5 karakter).",
      });
    }
  });

export type UpdateStudentConsentInput = z.infer<
  typeof updateStudentConsentSchema
>;

