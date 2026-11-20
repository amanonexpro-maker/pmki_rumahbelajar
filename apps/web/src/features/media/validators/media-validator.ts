import { z } from "zod";

export const MEDIA_CATEGORY_VALUES = [
  "KEGIATAN",
  "ACARA",
  "FASILITAS",
  "PENGURUS",
] as const;

export const ALLOWED_MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_MEDIA_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const createUploadUrlSchema = z.object({
  serviceUnitId: z.string().uuid().optional(),
  fileName: z
    .string()
    .trim()
    .min(3, "Nama berkas dokumentasi tidak valid.")
    .max(180, "Nama berkas terlalu panjang."),
  mimeType: z.enum(ALLOWED_MEDIA_MIME_TYPES, {
    message: "Format berkas harus berupa gambar JPEG, PNG, atau WebP.",
  }),
  fileSize: z
    .number()
    .int()
    .min(1, "Ukuran berkas tidak valid.")
    .max(
      MAX_MEDIA_FILE_SIZE_BYTES,
      "Ukuran berkas dokumentasi maksimal 10 MB."
    ),
});

export type CreateUploadUrlInput = z.infer<typeof createUploadUrlSchema>;

export const confirmMediaUploadSchema = z.object({
  serviceUnitId: z.string().uuid().optional(),
  title: z
    .string()
    .trim()
    .min(3, "Masukkan judul dokumentasi (minimal 3 karakter).")
    .max(160, "Judul dokumentasi maksimal 160 karakter."),
  description: z
    .string()
    .trim()
    .max(1000, "Keterangan dokumentasi maksimal 1000 karakter.")
    .optional()
    .nullable(),
  filePath: z
    .string()
    .trim()
    .min(5, "Path penyimpanan dokumentasi tidak valid."),
  mimeType: z.enum(ALLOWED_MEDIA_MIME_TYPES),
  fileSize: z.number().int().min(1).max(MAX_MEDIA_FILE_SIZE_BYTES),
  category: z.enum(MEDIA_CATEGORY_VALUES, {
    message: "Pilih kategori dokumentasi.",
  }),
  capturedDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal kegiatan tidak valid.")
    .optional()
    .nullable(),
  subjectStudentIds: z.array(z.string().uuid()).optional(),
});

export type ConfirmMediaUploadInput = z.infer<typeof confirmMediaUploadSchema>;

export const reviewMediaAssetSchema = z.object({
  mediaId: z.string().uuid("ID dokumentasi tidak valid."),
  eligibleForPublic: z.boolean(),
  subjectStudentIds: z.array(z.string().uuid()).optional(),
  reviewNotes: z.string().trim().max(500).optional().nullable(),
});

export type ReviewMediaAssetInput = z.infer<typeof reviewMediaAssetSchema>;

