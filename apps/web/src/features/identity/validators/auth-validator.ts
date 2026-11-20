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

