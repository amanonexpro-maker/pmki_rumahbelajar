import { describe, expect, it } from "vitest";
import {
  ERROR_CODE_MESSAGES,
  getHumanErrorMessage,
  PRIVACY_MESSAGES,
  SUCCESS_MESSAGES,
} from "./index";

describe("src/lib/messages (10 §12–17 & 09 §24)", () => {
  it("maps every standard error code to a human Indonesian message", () => {
    expect(Object.keys(ERROR_CODE_MESSAGES)).toHaveLength(8);
    expect(getHumanErrorMessage("PERMISSION_DENIED")).toBe(
      "Anda tidak memiliki akses untuk tindakan ini."
    );
    expect(getHumanErrorMessage("RESOURCE_NOT_FOUND")).toBe(
      "Data tidak ditemukan."
    );
  });

  it("keeps privacy and success copy free of technical jargon", () => {
    expect(SUCCESS_MESSAGES.attendanceSaved).toBe("Presensi berhasil disimpan.");
    expect(PRIVACY_MESSAGES.auditLogged).toContain("jejak audit");
  });
});

