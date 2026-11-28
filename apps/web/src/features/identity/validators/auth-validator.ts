import { z } from "zod";

/**
 * Identity Domain Validators (11 §8, 10 §12–14).
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Masukkan alamat email terlebih dahulu.")
    .email("Format alamat email tidak valid."),
  password: z
    .string()
    .min(8, "Kata sandi minimal terdiri dari 8 karakter."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Masukkan alamat email terlebih dahulu.")
    .email("Format alamat email tidak valid."),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const DEFAULT_GENERIC_PASSWORD = "Rbga@2026";

const FORBIDDEN_DEFAULT_PASSWORDS = new Set([
  "rbga@2026",
  "pmki@2026",
  "rbga123",
  "password",
  "12345678",
]);

export const changePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Kata sandi baru minimal terdiri dari 8 karakter.")
      .refine(
        (val) => !FORBIDDEN_DEFAULT_PASSWORDS.has(val.trim().toLowerCase()),
        "Kata sandi baru tidak boleh menggunakan kata sandi bawaan."
      ),
    confirmPassword: z
      .string()
      .min(1, "Konfirmasi kata sandi baru wajib diisi."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const updateMyProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama lengkap minimal 2 karakter.")
    .max(100, "Nama lengkap maksimal 100 karakter."),
  publicBio: z
    .string()
    .trim()
    .max(280, "Bio singkat maksimal 280 karakter.")
    .optional()
    .nullable(),
  showOnPublic: z.boolean(),
});

export type UpdateMyProfileInput = z.infer<typeof updateMyProfileSchema>;

