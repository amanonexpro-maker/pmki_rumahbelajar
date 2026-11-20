import { describe, expect, it } from "vitest";
import { fail, ok } from "./result";

describe("src/server/contracts/result (09 §22–24)", () => {
  it("wraps success results consistently", () => {
    const res = ok({ id: "123" });
    expect(res).toEqual({ success: true, data: { id: "123" } });
  });

  it("wraps error results with code and human message", () => {
    const res = fail("PERMISSION_DENIED", "Anda tidak memiliki akses untuk tindakan ini.");
    expect(res).toEqual({
      success: false,
      error: {
        code: "PERMISSION_DENIED",
        message: "Anda tidak memiliki akses untuk tindakan ini.",
      },
    });
  });
});

