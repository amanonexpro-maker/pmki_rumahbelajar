import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CONSENT_STATUS_META } from "@/lib/status";
import type { SessionUser } from "@/server/auth/session";
import {
  authorizeUpdateConsent,
  canReadConfidentialConsentEvidence,
  canReadConsents,
} from "./permissions/consent-policy";
import { updateStudentConsentSchema } from "./validators/consent-validator";

const ORG_ID = "01950000-0000-7000-8000-000000000001";
const UNIT_ID = "01950000-0000-7000-8000-000000000010";
const OTHER_UNIT_ID = "01950000-0000-7000-8000-000000000099";

const coordinator: SessionUser = {
  id: "coord-1",
  email: "pengurus.lawang@pmki.org",
  name: "Ms. Evi",
  roles: ["UNIT_COORDINATOR"],
  permissions: ["consent.read", "consent.update", "consent.review"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

const teacher: SessionUser = {
  id: "teacher-1",
  email: "guru.matematika@pmki.org",
  name: "Pak Budi",
  roles: ["TEACHER"],
  permissions: ["student.read"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

function collectTsFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      !entry.name.endsWith(".test.ts")
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("Consent Domain — Validators, Policies, Canonical Labels & Boundaries", () => {
  it("uses canonical Indonesian consent status labels (10 §7)", () => {
    expect(CONSENT_STATUS_META.GRANTED.label).toBe("Disetujui");
    expect(CONSENT_STATUS_META.DENIED.label).toBe("Tidak diizinkan");
    expect(CONSENT_STATUS_META.REVOKED.label).toBe("Izin dicabut");
  });

  it("requires notes/reason when revoking consent in updateStudentConsentSchema", () => {
    const revokedWithoutNotes = updateStudentConsentSchema.safeParse({
      consentId: ORG_ID,
      personalDataConsent: "GRANTED",
      photoVideoConsent: "REVOKED",
      notes: "",
    });
    expect(revokedWithoutNotes.success).toBe(false);

    const revokedWithNotes = updateStudentConsentSchema.safeParse({
      consentId: ORG_ID,
      personalDataConsent: "GRANTED",
      photoVideoConsent: "REVOKED",
      notes: "Orang tua meminta foto anak ditarik dari publikasi umum.",
    });
    expect(revokedWithNotes.success).toBe(true);
  });

  it("enforces CONFIDENTIAL consent evidence policy and scope", () => {
    expect(canReadConsents(teacher, UNIT_ID)).toBe(false);
    expect(canReadConfidentialConsentEvidence(teacher, UNIT_ID)).toBe(false);

    expect(canReadConsents(coordinator, UNIT_ID)).toBe(true);
    expect(canReadConfidentialConsentEvidence(coordinator, UNIT_ID)).toBe(true);
    expect(canReadConfidentialConsentEvidence(coordinator, OTHER_UNIT_ID)).toBe(
      false
    );

    expect(authorizeUpdateConsent(coordinator, UNIT_ID).success).toBe(true);
    expect(authorizeUpdateConsent(teacher, UNIT_ID).success).toBe(false);
  });

  it("verifies RED-LINE domain boundary: features/consent never imports other domains' repositories or tables", () => {
    const dir = path.resolve(__dirname);
    const files = collectTsFiles(dir);
    expect(files.length).toBeGreaterThan(4);

    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      expect(source).not.toMatch(
        /@\/features\/(?!consent)[a-z-]+\/(repositories|queries)/
      );
      expect(source).not.toMatch(/db\/schema\/(students|media|publishing)/);
    }
  });
});

