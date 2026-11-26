import { z } from "zod";

export const EDUCATION_LEVEL_VALUES = [
  "TK",
  "SD_1",
  "SD_2",
  "SD_3",
  "SD_4",
  "SD_5",
  "SD_6",
  "SMP_7",
  "SMP_8",
] as const;

export const GUARDIAN_RELATIONSHIP_VALUES = [
  "AYAH",
  "IBU",
  "WALI",
  "PENGASUH_RAAL",
  "LAINNYA",
] as const;

/**
 * Step 1: Identitas Peserta Didik
 */
export const registrationStep1Schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Masukkan nama lengkap peserta didik sesuai identitas."),
  nickname: z
    .string()
    .trim()
    .min(1, "Masukkan nama panggilan sehari-hari untuk sapaan di kelas."),
  gender: z.enum(["L", "P"], {
    message: "Pilih jenis kelamin peserta didik.",
  }),
  birthDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal lahir peserta didik."),
  district: z.enum(["Kalirejo", "Lawang", "Lainnya"], {
    message: "Pilih wilayah tempat tinggal.",
  }),
  address: z.string().trim().optional(),
  isRaalResident: z.boolean(),
});

/**
 * Step 2: Orang Tua / Wali
 */
export const registrationStep2Schema = z.object({
  guardianFullName: z
    .string()
    .trim()
    .min(2, "Masukkan nama lengkap orang tua atau wali."),
  guardianRelationship: z.enum(GUARDIAN_RELATIONSHIP_VALUES, {
    message: "Pilih hubungan wali dengan peserta didik.",
  }),
  guardianPhone: z
    .string()
    .trim()
    .refine(
      (val) => val.replace(/[^0-9+]/g, "").length >= 9,
      "Masukkan nomor WhatsApp yang dapat dihubungi (minimal 9 digit)."
    ),
  guardianOccupation: z.string().trim().optional(),
});

/**
 * Step 3: Pendidikan
 */
export const registrationStep3Schema = z.object({
  educationLevel: z.enum(EDUCATION_LEVEL_VALUES, {
    message: "Pilih jenjang pendidikan peserta didik.",
  }),
  schoolName: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

/**
 * Step 4: Persetujuan & Privasi (Personal Data Consent !== Photo/Video Consent, never preselected)
 */
export const registrationStep4Schema = z.object({
  personalDataConsent: z.literal(true, {
    message:
      "Persetujuan pemrosesan data pendaftaran diperlukan agar pengurus dapat memverifikasi dan menempatkan kelas peserta didik.",
  }),
  photoVideoConsent: z.enum(["GRANTED", "DENIED"], {
    message: "Pilih salah satu opsi persetujuan dokumentasi foto dan video.",
  }),
});

/**
 * Combined 5-step public registration schema
 */
export const publicRegistrationSchema = registrationStep1Schema
  .merge(registrationStep2Schema)
  .merge(registrationStep3Schema)
  .merge(registrationStep4Schema);

export type PublicRegistrationInput = z.infer<typeof publicRegistrationSchema>;

/**
 * Registration verification decision schema
 */
const verifyStudentBaseSchema = z.object({
  studentId: z.string().uuid("ID peserta didik tidak valid."),
  decision: z.enum(
    ["PENDING_VERIFICATION", "VERIFIED", "WAITLIST", "REJECTED", "CANCELLED"],
    {
      message: "Pilih keputusan verifikasi pendaftaran.",
    }
  ),
  reason: z.string().trim().optional(),
});

function refineVerifyDecisionReason(
  val: { decision: string; reason?: string },
  ctx: z.RefinementCtx
) {
  if (
    (val.decision === "REJECTED" || val.decision === "CANCELLED") &&
    (!val.reason || val.reason.length < 5)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["reason"],
      message:
        "Tuliskan alasan penolakan atau pembatalan pendaftaran (minimal 5 karakter).",
    });
  }
}

export const verifyStudentSchema = verifyStudentBaseSchema.superRefine(
  refineVerifyDecisionReason
);

export type VerifyStudentInput = z.infer<typeof verifyStudentSchema>;

export const verifyStudentFormSchema = verifyStudentBaseSchema
  .omit({ studentId: true })
  .superRefine(refineVerifyDecisionReason);

export type VerifyStudentFormValues = z.infer<typeof verifyStudentFormSchema>;

/**
 * Class placement schema
 */
export const placeStudentSchema = z.object({
  studentId: z.string().uuid("ID peserta didik tidak valid."),
  classId: z.string().uuid("Pilih kelas terlebih dahulu."),
  notes: z.string().trim().optional(),
});

export type PlaceStudentInput = z.infer<typeof placeStudentSchema>;

export const placeStudentFormSchema = placeStudentSchema.omit({
  studentId: true,
});

export type PlaceStudentFormValues = z.infer<typeof placeStudentFormSchema>;

/**
 * Profile update schema
 */
export const updateStudentProfileSchema = z.object({
  studentId: z.string().uuid("ID peserta didik tidak valid."),
  fullName: z
    .string()
    .trim()
    .min(2, "Masukkan nama lengkap peserta didik."),
  nickname: z.string().trim().min(1, "Masukkan nama panggilan peserta didik."),
  gender: z.enum(["L", "P"]),
  birthDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal lahir peserta didik."),
  educationLevel: z.enum(EDUCATION_LEVEL_VALUES),
  schoolName: z.string().trim().optional(),
  district: z.enum(["Kalirejo", "Lawang", "Lainnya"]),
  address: z.string().trim().optional(),
  isRaalResident: z.boolean(),
  guardianFullName: z.string().trim().optional(),
  guardianRelationship: z.enum(GUARDIAN_RELATIONSHIP_VALUES).optional(),
  guardianPhone: z.string().trim().optional(),
  guardianOccupation: z.string().trim().optional(),
});

export type UpdateStudentProfileInput = z.infer<
  typeof updateStudentProfileSchema
>;

export const editStudentProfileFormSchema = updateStudentProfileSchema.pick({
  fullName: true,
  nickname: true,
  gender: true,
  birthDate: true,
  educationLevel: true,
  schoolName: true,
  district: true,
  address: true,
  isRaalResident: true,
  guardianFullName: true,
  guardianRelationship: true,
  guardianPhone: true,
  guardianOccupation: true,
});

export type EditStudentProfileFormValues = z.infer<
  typeof editStudentProfileFormSchema
>;

/**
 * Archive (Soft Delete) schemas (04 §25, 05 §8)
 */
export const archiveStudentSchema = z.object({
  studentId: z.string().uuid("ID peserta didik tidak valid."),
  reason: z
    .string()
    .trim()
    .min(5, "Tuliskan alasan pengarsipan peserta didik (minimal 5 karakter).")
    .max(300, "Alasan pengarsipan maksimal 300 karakter."),
});

export type ArchiveStudentInput = z.infer<typeof archiveStudentSchema>;

export const archiveStudentsBulkSchema = z.object({
  studentIds: z
    .array(z.string().uuid("Terdapat ID peserta didik yang tidak valid."))
    .min(1, "Pilih minimal satu peserta didik untuk diarsipkan.")
    .max(100, "Maksimal 100 peserta didik per pengarsipan massal."),
  reason: z
    .string()
    .trim()
    .min(5, "Tuliskan alasan pengarsipan massal (minimal 5 karakter).")
    .max(300, "Alasan pengarsipan maksimal 300 karakter."),
});

export type ArchiveStudentsBulkInput = z.infer<typeof archiveStudentsBulkSchema>;

/**
 * Restore archived student schemas (`student.archive`)
 */
export const restoreStudentSchema = z.object({
  studentId: z.string().uuid("ID peserta didik tidak valid."),
  reason: z.string().trim().max(300).optional(),
});

export const restoreStudentsBulkSchema = z.object({
  studentIds: z
    .array(z.string().uuid("Terdapat ID peserta didik yang tidak valid."))
    .min(1, "Pilih minimal satu peserta didik untuk dipulihkan.")
    .max(100, "Maksimal 100 peserta didik per pemulihan massal."),
  reason: z.string().trim().max(300).optional(),
});

/**
 * Bulk .xlsx Import Row Schema (status awal selalu SUBMITTED)
 */
export const importStudentRowSchema = publicRegistrationSchema;
export type ImportStudentRowInput = z.infer<typeof importStudentRowSchema>;
