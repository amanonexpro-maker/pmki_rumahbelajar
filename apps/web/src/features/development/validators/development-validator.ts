import { z } from "zod";

/**
 * Development Notes Domain Validators (11 §13, 04 §17).
 * `confidential` defaults to `true` (05 §13–14).
 */
export const upsertDevelopmentNoteSchema = z.object({
  noteId: z.string().uuid().optional().nullable(),
  studentId: z.string().uuid("Pilih peserta didik terlebih dahulu."),
  categoryId: z.string().uuid("Pilih kategori perkembangan terlebih dahulu."),
  observation: z
    .string()
    .trim()
    .min(5, "Tuliskan hasil pengamatan perkembangan peserta didik (minimal 5 karakter).")
    .max(2000, "Catatan pengamatan maksimal 2000 karakter."),
  progress: z.string().trim().max(1500).optional().nullable(),
  followUp: z.string().trim().max(1500).optional().nullable(),
  confidential: z.boolean().default(true),
  recordedOfflineAt: z.string().datetime().optional().nullable(),
  isOfflineSync: z.boolean().optional(),
});

export type UpsertDevelopmentNoteInput = z.infer<
  typeof upsertDevelopmentNoteSchema
>;

