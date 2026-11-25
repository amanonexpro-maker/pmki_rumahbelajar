import { describe, expect, it } from "vitest";
import { ROLE_LABELS, type SystemRole } from "@/lib/status";
import {
  getUserPersona,
  PERSONA_LABELS,
  PERSONA_ROLE_MAP,
} from "./personas";

describe("UserPersona Abstraction (personas.ts)", () => {
  it("maps single happy-path roles to their expected personas", () => {
    expect(getUserPersona(["TEACHER"])).toBe("GURU");
    expect(getUserPersona(["UNIT_COORDINATOR"])).toBe("PENGURUS");
    expect(getUserPersona(["PLATFORM_ADMIN"])).toBe("SUPERADMIN");
  });

  it("resolves priority conflicts deterministically (SUPERADMIN > PENGURUS > GURU)", () => {
    expect(getUserPersona(["TEACHER", "ORG_ADMIN"])).toBe("PENGURUS");
    expect(getUserPersona(["TEACHER", "PLATFORM_ADMIN"])).toBe("SUPERADMIN");
    expect(getUserPersona(["VOLUNTEER", "REVIEWER"])).toBe("PENGURUS");
    expect(
      getUserPersona(["STAKEHOLDER", "APPROVER", "AUDITOR"])
    ).toBe("SUPERADMIN");
  });

  it("defaults safely to GURU for empty or unknown role arrays", () => {
    expect(getUserPersona([])).toBe("GURU");
    expect(getUserPersona(["UNKNOWN_ROLE"])).toBe("GURU");
    expect(getUserPersona(["", "CUSTOM_UNDEFINED"])).toBe("GURU");
  });

  it("covers all 11 official SystemRole codes in PERSONA_ROLE_MAP and defines labels", () => {
    const mappedRoles = new Set([
      ...PERSONA_ROLE_MAP.SUPERADMIN,
      ...PERSONA_ROLE_MAP.PENGURUS,
      ...PERSONA_ROLE_MAP.GURU,
    ]);

    const officialRoles = Object.keys(ROLE_LABELS) as SystemRole[];
    expect(mappedRoles.size).toBe(officialRoles.length);
    for (const role of officialRoles) {
      expect(mappedRoles.has(role)).toBe(true);
    }

    expect(PERSONA_LABELS).toEqual({
      GURU: "Guru",
      PENGURUS: "Pengurus",
      SUPERADMIN: "Superadmin",
    });
  });
});

