import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { SessionUser } from "@/server/auth/session";
import { createSimplePdf } from "@/lib/pdf-builder";
import {
  authorizeCreateOrUpdateDevelopment,
  canViewDevelopmentNoteRecord,
} from "./permissions/development-policy";
import { upsertDevelopmentNoteSchema } from "./validators/development-validator";

const ORG_ID = "01950000-0000-7000-8000-000000000001";
const UNIT_ID = "01950000-0000-7000-8000-000000000010";
const OTHER_UNIT_ID = "01950000-0000-7000-8000-000000000099";

const teacherA: SessionUser = {
  id: "user-teacher-a",
  email: "guru.matematika@pmki.org",
  name: "Pak Budi",
  roles: ["TEACHER"],
  permissions: ["development.read", "development.create"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

const teacherB: SessionUser = {
  id: "user-teacher-b",
  email: "guru.lain@pmki.org",
  name: "Bu Sari",
  roles: ["TEACHER"],
  permissions: ["development.read", "development.create"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

const coordinator: SessionUser = {
  id: "user-coord",
  email: "pengurus.lawang@pmki.org",
  name: "Ms. Evi",
  roles: ["UNIT_COORDINATOR"],
  permissions: [
    "development.read",
    "development.create",
    "development.update",
    "development.review",
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

describe("Development Domain — Validators, Confidential Policy & Boundaries", () => {
  it("defaults confidential to true in upsertDevelopmentNoteSchema", () => {
    const parsed = upsertDevelopmentNoteSchema.safeParse({
      studentId: ORG_ID,
      categoryId: UNIT_ID,
      observation: "Peserta didik mampu membaca paragraf pendek dengan lancar.",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.confidential).toBe(true);
    }
  });

  it("enforces server-side CONFIDENTIAL visibility: regular teachers cannot view other teachers' confidential notes", () => {
    // Teacher A can view their own confidential note
    expect(
      canViewDevelopmentNoteRecord({
        user: teacherA,
        serviceUnitId: UNIT_ID,
        confidential: true,
        noteTeacherId: "teacher-row-a",
        noteCreatedBy: teacherA.id,
        actorTeacherId: "teacher-row-a",
      })
    ).toBe(true);

    // Teacher B CANNOT view Teacher A's confidential note
    expect(
      canViewDevelopmentNoteRecord({
        user: teacherB,
        serviceUnitId: UNIT_ID,
        confidential: true,
        noteTeacherId: "teacher-row-a",
        noteCreatedBy: teacherA.id,
        actorTeacherId: "teacher-row-b",
      })
    ).toBe(false);

    // Coordinator with `development.review` CAN view Teacher A's confidential note
    expect(
      canViewDevelopmentNoteRecord({
        user: coordinator,
        serviceUnitId: UNIT_ID,
        confidential: true,
        noteTeacherId: "teacher-row-a",
        noteCreatedBy: teacherA.id,
        actorTeacherId: "teacher-row-coord",
      })
    ).toBe(true);

    // Cross-unit access is denied even for coordinator
    expect(
      canViewDevelopmentNoteRecord({
        user: coordinator,
        serviceUnitId: OTHER_UNIT_ID,
        confidential: true,
        noteTeacherId: "teacher-row-a",
        noteCreatedBy: teacherA.id,
      })
    ).toBe(false);

    expect(
      authorizeCreateOrUpdateDevelopment(teacherA, UNIT_ID, false).success
    ).toBe(true);
  });

  it("verifies RED-LINE domain boundary: features/development never imports other domains' repositories or tables", () => {
    const dir = path.resolve(__dirname);
    const files = collectTsFiles(dir);
    expect(files.length).toBeGreaterThan(4);

    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      expect(source).not.toMatch(
        /@\/features\/(?!development)[a-z-]+\/(repositories|queries)/
      );
      expect(source).not.toMatch(/db\/schema\/(academic|students|consent)/);
    }
  });

  it("builds a valid multi-page PDF 1.4 buffer for student development summary", () => {
    const pdf = createSimplePdf();
    pdf.addText("Ringkasan Perkembangan Peserta Didik", {
      fontSize: 16,
      bold: true,
    });
    for (let i = 0; i < 45; i++) {
      pdf.addText(
        `Catatan ke-${i + 1}: Peserta didik menunjukkan kemajuan membaca kalimat pendek secara mandiri.`,
        { fontSize: 10, gapAfter: 6 }
      );
    }
    const bytes = pdf.build();
    const content = new TextDecoder().decode(bytes);
    expect(content.startsWith("%PDF-1.4\n")).toBe(true);
    expect(content.includes("/Count 2")).toBe(true);
    expect(content.trimEnd().endsWith("%%EOF")).toBe(true);
  });
});

