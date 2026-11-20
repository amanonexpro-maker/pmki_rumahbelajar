import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { SessionUser } from "@/server/auth/session";
import {
  authorizeCreateStudent,
  authorizeVerifyStudent,
  canReadConfidentialGuardian,
  canReadStudents,
} from "./permissions/student-policy";
import { isValidVerificationTransition } from "./services/registration-service";
import {
  publicRegistrationSchema,
  verifyStudentSchema,
} from "./validators/student-validator";

const ORG_ID = "01950000-0000-7000-8000-000000000001";
const UNIT_ID = "01950000-0000-7000-8000-000000000010";
const OTHER_UNIT_ID = "01950000-0000-7000-8000-000000000099";

const teacherDefaultSession: SessionUser = {
  id: "teacher-1",
  email: "guru.matematika@pmki.org",
  name: "Pak Budi",
  roles: ["TEACHER"],
  permissions: ["student.read", "attendance.record"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

const coordinatorSession: SessionUser = {
  id: "coord-1",
  email: "pengurus.lawang@pmki.org",
  name: "Ms. Evi",
  roles: ["UNIT_COORDINATOR"],
  permissions: [
    "student.read",
    "student.create",
    "student.update",
    "student.verify",
    "guardian.read",
    "guardian.update",
  ],
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

describe("Students Domain — Validators, Policies, Lifecycle & Domain Boundaries", () => {
  it("validates 5-step public registration and enforces separate consents", () => {
    const valid = publicRegistrationSchema.safeParse({
      fullName: "Samuel Pratama",
      nickname: "Sam",
      gender: "L",
      birthDate: "2017-04-12",
      district: "Kalirejo",
      address: "Jl. Kalirejo No. 5",
      isRaalResident: false,
      guardianFullName: "Ibu Maria Lestari",
      guardianRelationship: "IBU",
      guardianPhone: "081234567890",
      guardianOccupation: "Wiraswasta",
      educationLevel: "SD_2",
      schoolName: "SDN Kalirejo 1",
      notes: "Senang berhitung",
      personalDataConsent: true,
      photoVideoConsent: "DENIED",
    });
    expect(valid.success).toBe(true);

    // Missing personalDataConsent or missing photoVideoConsent must fail
    const missingConsent = publicRegistrationSchema.safeParse({
      fullName: "Samuel Pratama",
      nickname: "Sam",
      gender: "L",
      birthDate: "2017-04-12",
      district: "Kalirejo",
      isRaalResident: false,
      guardianFullName: "Ibu Maria",
      guardianRelationship: "IBU",
      guardianPhone: "081234567890",
      educationLevel: "SD_2",
      personalDataConsent: false,
    });
    expect(missingConsent.success).toBe(false);
  });

  it("requires reason when verifyStudentSchema decision is REJECTED or CANCELLED", () => {
    const rejectedWithoutReason = verifyStudentSchema.safeParse({
      studentId: ORG_ID,
      decision: "REJECTED",
      reason: "",
    });
    expect(rejectedWithoutReason.success).toBe(false);

    const rejectedWithReason = verifyStudentSchema.safeParse({
      studentId: ORG_ID,
      decision: "REJECTED",
      reason: "Usia di luar rentang jenjang layanan Rumah Belajar.",
    });
    expect(rejectedWithReason.success).toBe(true);
  });

  it("enforces stored lifecycle transition rules", () => {
    expect(isValidVerificationTransition("SUBMITTED", "PENDING_VERIFICATION")).toBe(
      true
    );
    expect(isValidVerificationTransition("SUBMITTED", "VERIFIED")).toBe(true);
    expect(
      isValidVerificationTransition("PENDING_VERIFICATION", "VERIFIED")
    ).toBe(true);
    // Cannot jump to ACTIVE via verification (requires PlacementService)
    expect(isValidVerificationTransition("SUBMITTED", "ACTIVE")).toBe(false);
    expect(isValidVerificationTransition("VERIFIED", "ACTIVE")).toBe(false);
    // Terminal states cannot transition
    expect(isValidVerificationTransition("REJECTED", "VERIFIED")).toBe(false);
    expect(isValidVerificationTransition("CANCELLED", "VERIFIED")).toBe(false);
  });

  it("enforces CONFIDENTIAL guardian default-deny policy + scope", () => {
    expect(canReadStudents(teacherDefaultSession, UNIT_ID)).toBe(true);
    expect(canReadConfidentialGuardian(teacherDefaultSession, UNIT_ID)).toBe(
      false
    );
    expect(canReadConfidentialGuardian(coordinatorSession, UNIT_ID)).toBe(true);
    expect(
      canReadConfidentialGuardian(coordinatorSession, OTHER_UNIT_ID)
    ).toBe(false);

    expect(authorizeVerifyStudent(teacherDefaultSession, UNIT_ID).success).toBe(
      false
    );
    expect(authorizeVerifyStudent(coordinatorSession, UNIT_ID).success).toBe(
      true
    );
    expect(authorizeCreateStudent(coordinatorSession, UNIT_ID).success).toBe(
      true
    );
  });

  it("verifies RED-LINE domain boundary: features/students never imports other domains' repositories or academic tables", () => {
    const studentsDir = path.resolve(__dirname);
    const files = collectTsFiles(studentsDir);
    expect(files.length).toBeGreaterThan(5);

    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      // Must never import another domain's repository or query folder
      expect(source).not.toMatch(
        /@\/features\/(?!students)[a-z-]+\/(repositories|queries)/
      );
      // Must never import academic tables directly
      expect(source).not.toMatch(/db\/schema\/academic/);
      expect(source).not.toMatch(/classEnrollments/);
    }
  });
});
