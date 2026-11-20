import { z } from "zod";

export const ATTENDANCE_STATUS_VALUES = [
  "PRESENT",
  "ABSENT",
  "SICK",
  "PERMITTED",
] as const;

export const attendanceEntrySchema = z.object({
  studentId: z.string().uuid("ID peserta didik tidak valid."),
  status: z.enum(ATTENDANCE_STATUS_VALUES, {
    message: "Pilih status kehadiran (Hadir, Izin, Sakit, atau Tidak hadir).",
  }),
  note: z.string().trim().max(300, "Catatan maksimal 300 karakter.").optional().nullable(),
});

export const recordAttendanceSessionSchema = z.object({
  classId: z.string().uuid("Pilih kelas terlebih dahulu."),
  sessionDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal sesi belajar yang valid."),
  notes: z.string().trim().max(500, "Catatan sesi maksimal 500 karakter.").optional().nullable(),
  entries: z
    .array(attendanceEntrySchema)
    .min(1, "Catat presensi minimal untuk 1 peserta didik."),
  recordedOfflineAt: z.string().datetime().optional().nullable(),
  isOfflineSync: z.boolean().optional(),
});

export type RecordAttendanceSessionInput = z.infer<
  typeof recordAttendanceSessionSchema
>;

