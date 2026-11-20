import { z } from "zod";

export const PUBLICATION_CATEGORY_VALUES = [
  "BERITA",
  "AGENDA",
  "PENGUMUMAN",
  "ARTIKEL",
] as const;

export const PUBLICATION_STATUS_VALUES = [
  "DRAFT",
  "PRIVACY_REVIEW",
  "APPROVED",
  "PUBLISHED",
  "ARCHIVED",
] as const;

export const createPublicationSchema = z.object({
  serviceUnitId: z.string().uuid().optional(),
  title: z
    .string()
    .trim()
    .min(5, "Masukkan judul publikasi (minimal 5 karakter).")
    .max(180, "Judul publikasi maksimal 180 karakter."),
  category: z.enum(PUBLICATION_CATEGORY_VALUES, {
    message: "Pilih kategori publikasi.",
  }),
  excerpt: z
    .string()
    .trim()
    .max(400, "Ringkasan maksimal 400 karakter.")
    .optional()
    .nullable(),
  content: z
    .string()
    .trim()
    .min(20, "Tuliskan isi konten publikasi (minimal 20 karakter)."),
  coverMediaId: z.string().uuid().optional().nullable(),
  eventDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal kegiatan tidak valid.")
    .optional()
    .nullable(),
  eventLocation: z.string().trim().max(180).optional().nullable(),
  subjectStudentIds: z.array(z.string().uuid()).optional(),
});

export type CreatePublicationInput = z.infer<typeof createPublicationSchema>;

export const transitionPublicationStatusSchema = z.object({
  publicationId: z.string().uuid("ID publikasi tidak valid."),
  targetStatus: z.enum(PUBLICATION_STATUS_VALUES, {
    message: "Pilih status publikasi tujuan.",
  }),
  subjectStudentIds: z.array(z.string().uuid()).optional(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type TransitionPublicationStatusInput = z.infer<
  typeof transitionPublicationStatusSchema
>;

