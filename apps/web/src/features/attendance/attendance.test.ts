import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ATTENDANCE_STATUS_META } from "@/lib/status";
import { buildStudentQrPayload, parseStudentQrPayload } from "@/lib/student-qr";
import type { SessionUser } from "@/server/auth/session";
import {
  authorizeReadAttendance,
  authorizeRecordAttendance,
  canReadAttendance,
  canRecordAttendance,
} from "./permissions/attendance-policy";
import {
  recordAttendanceSessionSchema,
  recordQuickAttendanceSchema,
} from "./validators/attendance-validator";

const ORG_ID = "01950000-0000-7000-8000-000000000001";
const UNIT_ID = "01950000-0000-7000-8000-000000000010";
const OTHER_UNIT_ID = "01950000-0000-7000-8000-000000000099";

const teacherSession: SessionUser = {
  id: "teacher-1",
  email: "guru.matematika@pmki.org",
  name: "Pak Budi",
  roles: ["TEACHER"],
  permissions: ["attendance.read", "attendance.record"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

const volunteerSession: SessionUser = {
  id: "vol-1",
  email: "relawan.lawang@pmki.org",
  name: "Agustinus",
  roles: ["VOLUNTEER"],
  permissions: ["attendance.read"],
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

describe("Attendance Domain — Validators, Policies, Canonical Labels & Boundaries", () => {
  it("uses canonical Indonesian attendance status labels (Tidak hadir, never Alpa)", () => {
    expect(ATTENDANCE_STATUS_META.PRESENT.label).toBe("Hadir");
    expect(ATTENDANCE_STATUS_META.PERMITTED.label).toBe("Izin");
    expect(ATTENDANCE_STATUS_META.SICK.label).toBe("Sakit");
    expect(ATTENDANCE_STATUS_META.ABSENT.label).toBe("Tidak hadir");
    expect(ATTENDANCE_STATUS_META.ABSENT.label).not.toBe("Alpa");
  });

  it("validates recordAttendanceSessionSchema", () => {
    const valid = recordAttendanceSessionSchema.safeParse({
      classId: ORG_ID,
      sessionDate: "2026-11-21",
      notes: "Sesi Matematika Ceria",
      entries: [
        {
          studentId: UNIT_ID,
          status: "PRESENT",
          note: "Aktif bertanya",
        },
      ],
    });
    expect(valid.success).toBe(true);

    const invalid = recordAttendanceSessionSchema.safeParse({
      classId: ORG_ID,
      sessionDate: "21-11-2026",
      entries: [],
    });
    expect(invalid.success).toBe(false);
  });

  it("validates recordQuickAttendanceSchema for cross-class incremental check-in", () => {
    const valid = recordQuickAttendanceSchema.safeParse({
      sessionDate: "2026-11-26",
      entries: [
        {
          classId: ORG_ID,
          studentId: UNIT_ID,
          status: "PRESENT",
        },
        {
          classId: OTHER_UNIT_ID,
          studentId: UNIT_ID,
          status: "PERMITTED",
        },
      ],
    });
    expect(valid.success).toBe(true);

    const emptyInvalid = recordQuickAttendanceSchema.safeParse({
      sessionDate: "2026-11-26",
      entries: [],
    });
    expect(emptyInvalid.success).toBe(false);
  });

  it("encodes and parses non-sensitive student QR payloads safely", () => {
    const payload = buildStudentQrPayload("rb-2026-002413");
    expect(payload).toBe("PMKI:RB-2026-002413");
    expect(parseStudentQrPayload(payload)).toBe("RB-2026-002413");
    expect(parseStudentQrPayload("RB-2026-000123")).toBe("RB-2026-000123");
    expect(parseStudentQrPayload("https://example.com/phish")).toBeNull();
  });

  it("enforces attendance RBAC and serviceUnitId scope", () => {
    expect(canReadAttendance(teacherSession, UNIT_ID)).toBe(true);
    expect(canRecordAttendance(teacherSession, UNIT_ID)).toBe(true);
    expect(authorizeRecordAttendance(teacherSession, UNIT_ID).success).toBe(
      true
    );

    expect(canRecordAttendance(volunteerSession, UNIT_ID)).toBe(false);
    const volDenied = authorizeRecordAttendance(volunteerSession, UNIT_ID);
    expect(volDenied.success).toBe(false);
    if (!volDenied.success) {
      expect(volDenied.error.code).toBe("PERMISSION_DENIED");
    }

    const crossUnit = authorizeReadAttendance(teacherSession, OTHER_UNIT_ID);
    expect(crossUnit.success).toBe(false);
    if (!crossUnit.success) {
      expect(crossUnit.error.code).toBe("SCOPE_DENIED");
    }
  });

  it("verifies RED-LINE domain boundary: features/attendance never imports other domains' repositories or tables", () => {
    const dir = path.resolve(__dirname);
    const files = collectTsFiles(dir);
    expect(files.length).toBeGreaterThan(4);

    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      expect(source).not.toMatch(
        /@\/features\/(?!attendance)[a-z-]+\/(repositories|queries)/
      );
      expect(source).not.toMatch(/db\/schema\/(academic|students|consent)/);
    }
  });
});

