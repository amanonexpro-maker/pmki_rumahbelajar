import { z } from "zod";
import type { MediaCategoryCode } from "@/features/media";

/**
 * Public Experience Validators (`10 §11–12`).
 * All validation messages use warm, clear Bahasa Indonesia (sentence case).
 * Note: Uses `import type` only for cross-domain types so client components
 * importing this validator never pull server-only services into the browser bundle.
 */
export const publicContactInquirySchema = z.object({
  senderName: z
    .string()
    .trim()
    .min(2, "Masukkan nama lengkap Anda.")
    .max(100, "Nama lengkap maksimal 100 karakter."),
  senderPhone: z
    .string()
    .trim()
    .max(25, "Nomor WhatsApp maksimal 25 karakter.")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Tuliskan pesan atau pertanyaan minimal 10 karakter.")
    .max(1000, "Pesan maksimal 1000 karakter."),
});

export type PublicContactInquiryInput = z.infer<
  typeof publicContactInquirySchema
>;

export const PUBLIC_GALLERY_FILTER_VALUES: readonly [
  "ALL",
  ...MediaCategoryCode[],
] = ["ALL", "KEGIATAN", "PENGURUS", "ACARA"] as const;

export const publicGalleryFilterSchema = z.enum([
  "ALL",
  "KEGIATAN",
  "PENGURUS",
  "ACARA",
]);
export type PublicGalleryFilterCode = z.infer<typeof publicGalleryFilterSchema>;

/**
 * Pendaftaran Awal Peserta Didik Baru (Fase 14 Step 8, 10 §11–12).
 * Form pendaftaran awal anak tanpa meminta berkas privat KTP/KK/Akta lahir.
 */
export const publicStudentRegistrationSchema = z.object({
  namaAnak: z
    .string()
    .trim()
    .min(2, "Masukkan nama lengkap anak.")
    .max(100, "Nama anak maksimal 100 karakter."),
  jenjang: z.enum(["TK", "SD", "SMP"], {
    message: "Pilih jenjang pendidikan anak.",
  }),
  namaWali: z
    .string()
    .trim()
    .min(2, "Masukkan nama orang tua atau wali.")
    .max(100, "Nama wali maksimal 100 karakter."),
  phoneWali: z
    .string()
    .trim()
    .min(9, "Nomor WhatsApp minimal 9 digit.")
    .max(25, "Nomor WhatsApp maksimal 25 karakter.")
    .regex(/^[0-9+\s-]+$/, "Format nomor WhatsApp tidak valid."),
  catatan: z
    .string()
    .trim()
    .max(500, "Catatan maksimal 500 karakter.")
    .optional()
    .or(z.literal("")),
});

export type PublicStudentRegistrationInput = z.infer<
  typeof publicStudentRegistrationSchema
>;

/**
 * Pendaftaran Pengajar Relawan (Fase 14 Step 8, 10 §11–12).
 * Form pendaftaran awal relawan tanpa meminta unggahan CV/ijazah di tahap awal.
 */
export const publicVolunteerRegistrationSchema = z.object({
  namaLengkap: z
    .string()
    .trim()
    .min(2, "Masukkan nama lengkap Anda.")
    .max(100, "Nama lengkap maksimal 100 karakter."),
  bidangKeahlian: z
    .array(z.string().trim().min(1))
    .min(1, "Pilih minimal 1 bidang materi bimbingan yang ingin diajarkan."),
  komitmenWaktu: z.literal(true, {
    message:
      "Harap konfirmasi kesediaan hadir mendampingi sesi belajar tatap muka setiap hari Sabtu sore.",
  }),
  phoneRelawan: z
    .string()
    .trim()
    .min(9, "Nomor WhatsApp minimal 9 digit.")
    .max(25, "Nomor WhatsApp maksimal 25 karakter.")
    .regex(/^[0-9+\s-]+$/, "Format nomor WhatsApp tidak valid."),
  motivasi: z
    .string()
    .trim()
    .max(500, "Pesan motivasi maksimal 500 karakter.")
    .optional()
    .or(z.literal("")),
});

export type PublicVolunteerRegistrationInput = z.infer<
  typeof publicVolunteerRegistrationSchema
>;
