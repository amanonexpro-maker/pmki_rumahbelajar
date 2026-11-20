import { z } from "zod";

/**
 * Global Policy Guardrails (05 §15, Product Owner Rule #1):
 * No custom role or override may ever grant permissions that mutate/delete audit logs
 * or bypass Separation of Duties / Confidential data policies.
 */
const FORBIDDEN_PERMISSION_PATTERNS = [
  /^audit\.(delete|update|write|drop|truncate)/i,
  /^policy\.(bypass|disable)/i,
];

export function isPermissionCodePolicySafe(code: string): boolean {
  return !FORBIDDEN_PERMISSION_PATTERNS.some((re) => re.test(code.trim()));
}

export const provisionUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Masukkan nama lengkap pengguna (minimal 2 karakter).")
    .max(120, "Nama lengkap maksimal 120 karakter."),
  email: z
    .string()
    .trim()
    .email("Format alamat email tidak valid."),
  initialPassword: z
    .string()
    .min(8, "Kata sandi awal minimal terdiri dari 8 karakter."),
  roleCode: z
    .string()
    .trim()
    .min(2, "Pilih peran awal pengguna."),
  organizationId: z.string().uuid("Pilih organisasi cakupan."),
  serviceUnitId: z.string().uuid("Pilih unit layanan cakupan."),
  programId: z.string().uuid().optional().nullable(),
});

export type ProvisionUserInput = z.infer<typeof provisionUserSchema>;

export const updateUserRolesSchema = z.object({
  userId: z.string().uuid("ID pengguna tidak valid."),
  roleCodes: z
    .array(z.string().trim().min(2))
    .min(1, "Pengguna harus memiliki minimal 1 peran."),
  reason: z.string().trim().max(500).optional().nullable(),
});

export type UpdateUserRolesInput = z.infer<typeof updateUserRolesSchema>;

export const setUserActiveStatusSchema = z
  .object({
    userId: z.string().uuid("ID pengguna tidak valid."),
    active: z.boolean(),
    reason: z.string().trim().max(500).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (!val.active && (!val.reason || val.reason.length < 5)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message:
          "Tuliskan alasan penonaktifan akun pengguna (minimal 5 karakter).",
      });
    }
  });

export type SetUserActiveStatusInput = z.infer<
  typeof setUserActiveStatusSchema
>;

export const createCustomRoleSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z][A-Z0-9_]{2,39}$/,
      "Kode peran harus menggunakan huruf kapital dan garis bawah (contoh: KOORDINATOR_REMAJA)."
    ),
  name: z
    .string()
    .trim()
    .min(3, "Masukkan nama peran kustom (contoh: Koordinator Remaja).")
    .max(80, "Nama peran maksimal 80 karakter."),
  description: z
    .string()
    .trim()
    .max(400, "Deskripsi peran maksimal 400 karakter.")
    .optional()
    .nullable(),
  permissionCodes: z
    .array(z.string().trim().min(3))
    .min(1, "Pilih minimal 1 hak akses untuk peran kustom ini.")
    .refine(
      (codes) => codes.every((c) => isPermissionCodePolicySafe(c)),
      "Peran kustom tidak boleh memiliki hak akses yang melanggar imutabilitas jejak audit atau kebijakan global."
    ),
});

export type CreateCustomRoleInput = z.infer<typeof createCustomRoleSchema>;

export const setPermissionOverrideSchema = z.object({
  userId: z.string().uuid("Pilih pengguna terlebih dahulu."),
  permissionCode: z
    .string()
    .trim()
    .min(3, "Pilih hak akses terlebih dahulu.")
    .refine(
      (c) => isPermissionCodePolicySafe(c),
      "Hak akses ini tidak dapat diberikan karena melanggar kebijakan imutabilitas jejak audit."
    ),
  mode: z.enum(["GRANT", "REVOKE"], {
    message: "Pilih jenis override (Beri akses atau Cabut akses).",
  }),
  reason: z
    .string()
    .trim()
    .min(5, "Tuliskan alasan pemberian atau pencabutan hak akses khusus (minimal 5 karakter).")
    .max(500, "Alasan override maksimal 500 karakter."),
});

export type SetPermissionOverrideInput = z.infer<
  typeof setPermissionOverrideSchema
>;

export const assignUserScopeSchema = z.object({
  userId: z.string().uuid("Pilih pengguna terlebih dahulu."),
  organizationId: z.string().uuid("Pilih organisasi terlebih dahulu."),
  serviceUnitId: z.string().uuid("Pilih unit layanan terlebih dahulu."),
  programId: z.string().uuid().optional().nullable(),
  active: z.boolean().default(true),
});

export type AssignUserScopeInput = z.infer<typeof assignUserScopeSchema>;

