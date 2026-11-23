import { describe, expect, it } from "vitest";
import { hasSupabaseAuthCookie } from "@/server/auth/cookie";
import { sanitizeRedirectUrl } from "@/server/auth/redirect";

describe("Fase 17 Step 2.1 — Auth Hygiene & Hardened Sanitizer Tests", () => {
  describe("H-2: Encoding-Hardened Redirect Sanitizer (sanitizeRedirectUrl)", () => {
    it("accepts valid canonical workspace routes", () => {
      expect(sanitizeRedirectUrl("/workspace")).toBe("/workspace");
      expect(sanitizeRedirectUrl("/workspace/attendance")).toBe("/workspace/attendance");
      expect(sanitizeRedirectUrl("/workspace/media")).toBe("/workspace/media");
      expect(sanitizeRedirectUrl("/workspace/students/123")).toBe("/workspace/students/123");
    });

    it("rejects external absolute URLs", () => {
      expect(sanitizeRedirectUrl("https://evil.com")).toBe("/workspace");
      expect(sanitizeRedirectUrl("http://evil.com/workspace")).toBe("/workspace");
      expect(sanitizeRedirectUrl("ftp://evil.com")).toBe("/workspace");
      expect(sanitizeRedirectUrl("javascript:alert(1)")).toBe("/workspace");
    });

    it("rejects protocol-relative URLs", () => {
      expect(sanitizeRedirectUrl("//evil.com")).toBe("/workspace");
      expect(sanitizeRedirectUrl("//workspace")).toBe("/workspace");
      expect(sanitizeRedirectUrl("///evil.com")).toBe("/workspace");
    });

    it("rejects single-encode traversal and slashes", () => {
      expect(sanitizeRedirectUrl("/workspace%2f..%2fevil.com")).toBe("/workspace");
      expect(sanitizeRedirectUrl("/workspace%2F..%2Fevil.com")).toBe("/workspace");
      expect(sanitizeRedirectUrl("/workspace%2f..")).toBe("/workspace");
    });

    it("rejects double-encode traversal", () => {
      expect(sanitizeRedirectUrl("/workspace%252f%252e%252e")).toBe("/workspace");
      expect(sanitizeRedirectUrl("/workspace%252F%252E%252E")).toBe("/workspace");
      expect(sanitizeRedirectUrl("%252f%252fevil.com")).toBe("/workspace");
    });

    it("fails closed on malformed percent encoding (URIError)", () => {
      expect(sanitizeRedirectUrl("%E0%A4%A")).toBe("/workspace");
      expect(sanitizeRedirectUrl("/workspace/%E0%A4%A")).toBe("/workspace");
      expect(sanitizeRedirectUrl("/workspace%")).toBe("/workspace");
      expect(sanitizeRedirectUrl("/workspace%2")).toBe("/workspace");
    });

    it("rejects null bytes and control characters", () => {
      expect(sanitizeRedirectUrl("/workspace%00")).toBe("/workspace");
      expect(sanitizeRedirectUrl("/workspace\0")).toBe("/workspace");
      expect(sanitizeRedirectUrl("/workspace\x08")).toBe("/workspace");
    });

    it("rejects backslash traversal and path confusion", () => {
      expect(sanitizeRedirectUrl("/workspace\\..\\evil")).toBe("/workspace");
      expect(sanitizeRedirectUrl("\\evil.com")).toBe("/workspace");
      expect(sanitizeRedirectUrl("/workspace%5c..%5cevil")).toBe("/workspace");
      expect(sanitizeRedirectUrl("/workspace%5C..%5Cevil")).toBe("/workspace");
    });

    it("rejects zero-width space characters", () => {
      expect(sanitizeRedirectUrl("\u200B/workspace")).toBe("/workspace");
      expect(sanitizeRedirectUrl("/workspace\u200B")).toBe("/workspace");
      expect(sanitizeRedirectUrl("\uFEFF/workspace")).toBe("/workspace");
    });

    it("rejects path traversal attempting to escape /workspace", () => {
      expect(sanitizeRedirectUrl("/workspace/../evil")).toBe("/workspace");
      expect(sanitizeRedirectUrl("/workspace/attendance/../../evil")).toBe("/workspace");
    });

    it("rejects sibling path confusion (e.g. /workspace-evil)", () => {
      expect(sanitizeRedirectUrl("/workspace-evil")).toBe("/workspace");
      expect(sanitizeRedirectUrl("/workspace@evil.com")).toBe("/workspace");
      expect(sanitizeRedirectUrl("/workspaces")).toBe("/workspace");
    });

    it("handles non-string or empty inputs safely", () => {
      expect(sanitizeRedirectUrl(undefined)).toBe("/workspace");
      expect(sanitizeRedirectUrl(null)).toBe("/workspace");
      expect(sanitizeRedirectUrl("")).toBe("/workspace");
      expect(sanitizeRedirectUrl("   ")).toBe("/workspace");
      expect(sanitizeRedirectUrl(12345)).toBe("/workspace");
      expect(sanitizeRedirectUrl({})).toBe("/workspace");
    });
  });

  describe("W-1: RTT-Free, Type-Universal Supabase Cookie Detection (hasSupabaseAuthCookie)", () => {
    it("returns false for empty cookie list", () => {
      expect(hasSupabaseAuthCookie([])).toBe(false);
    });

    it("returns false for unrelated cookies", () => {
      const cookies = [
        { name: "pmki_splash_seen" },
        { name: "theme" },
        { name: "session_id" },
      ];
      expect(hasSupabaseAuthCookie(cookies)).toBe(false);
    });

    it("returns true for standard Supabase auth cookie", () => {
      const cookies = [
        { name: "theme" },
        { name: "sb-qtyeafpgcjddqkehomka-auth-token" },
      ];
      expect(hasSupabaseAuthCookie(cookies)).toBe(true);
    });

    it("returns true for chunked Supabase auth cookies (.0, .1)", () => {
      const cookiesChunk0 = [
        { name: "sb-qtyeafpgcjddqkehomka-auth-token.0" },
      ];
      expect(hasSupabaseAuthCookie(cookiesChunk0)).toBe(true);

      const cookiesChunk1 = [
        { name: "sb-projectref-auth-token.1" },
      ];
      expect(hasSupabaseAuthCookie(cookiesChunk1)).toBe(true);
    });

    it("is strictly synchronous and returns boolean immediately", () => {
      const result = hasSupabaseAuthCookie([{ name: "sb-test-auth-token" }]);
      expect(typeof result).toBe("boolean");
      expect(result).toBe(true);
      // Ensure it is not a Promise
      expect(result).not.toBeInstanceOf(Promise);
    });
  });
});
