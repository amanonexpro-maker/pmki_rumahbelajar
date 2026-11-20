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
