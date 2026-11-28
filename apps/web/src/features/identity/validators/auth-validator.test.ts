import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  generateSuggestedPassword,
  loginSchema,
  resetPasswordSchema,
} from "./auth-validator";

describe("Identity Auth Validators (10 §12–14)", () => {
  it("accepts valid email and 8+ character password", () => {
    const parsed = loginSchema.safeParse({
      email: "  guru.matematika@pmki.org ",
      password: "PmkiDemo2026!",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("guru.matematika@pmki.org");
    }
  });

  it("rejects invalid email and short password with Indonesian messages", () => {
    const parsed = loginSchema.safeParse({
      email: "bukan-email",
      password: "short",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      expect(errors.email?.[0]).toContain("email");
      expect(errors.password?.[0]).toContain("8 karakter");
    }
  });

  it("validates reset password email", () => {
    expect(
      resetPasswordSchema.safeParse({ email: "superadmin@pmki.org" }).success
    ).toBe(true);
    expect(resetPasswordSchema.safeParse({ email: "" }).success).toBe(false);
  });

  it("generates unique cryptographically-random temporary passwords and rejects forbidden defaults", () => {
    const first = generateSuggestedPassword();
    const second = generateSuggestedPassword();
    expect(first).toMatch(/^Pmki-[A-Za-z2-9]{4}-[A-Za-z2-9]{4}!$/);
    expect(second).toMatch(/^Pmki-[A-Za-z2-9]{4}-[A-Za-z2-9]{4}!$/);
    expect(first).not.toBe(second);

    expect(
      changePasswordSchema.safeParse({
        newPassword: "Rbga@2026",
        confirmPassword: "Rbga@2026",
      }).success
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({
        newPassword: first,
        confirmPassword: first,
      }).success
    ).toBe(true);
  });
});

