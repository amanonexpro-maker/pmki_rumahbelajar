import { z } from "zod";

/**
 * Academic Domain Validators (11 §11, 10 §12–14).
 */
export const createClassSchema = z.object({
  organizationId: z.string().uuid("ID organisasi tidak valid."),
  serviceUnitId: z.string().uuid("ID unit layanan tidak valid."),
  academicYearId: z.string().uuid("Pilih tahun ajaran terlebih dahulu."),
  programId: z.string().uuid().optional().nullable(),
  name: z
    .string()
    .trim()
    .min(2, "Masukkan nama kelas (minimal 2 karakter)."),
  category: z.enum(["TK", "SD", "SMP", "LITERASI"], {
    message: "Pilih kategori jenjang kelas.",
  }),
  capacity: z
    .number()
    .int()
    .min(1, "Kapasitas kelas minimal 1 peserta didik.")
    .max(100, "Kapasitas kelas maksimal 100 peserta didik."),
  roomName: z.string().trim().optional().nullable(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;

export const enrollStudentToClassSchema = z.object({
  studentId: z.string().uuid("ID peserta didik tidak valid."),
  classId: z.string().uuid("Pilih kelas tujuan penempatan terlebih dahulu."),
});

export type EnrollStudentToClassInput = z.infer<
  typeof enrollStudentToClassSchema
>;

