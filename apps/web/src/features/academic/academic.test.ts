import { describe, expect, it } from "vitest";
import type { SessionUser } from "@/server/auth/session";
import {
  authorizeCreateClass,
  authorizeUpdateClass,
  canReadClasses,
  canReadSchedules,
} from "./permissions/academic-policy";
import {
  createClassSchema,
  enrollStudentToClassSchema,
} from "./validators/academic-validator";

const ORG_ID = "01950000-0000-7000-8000-000000000001";
const UNIT_ID = "01950000-0000-7000-8000-000000000010";
const OTHER_UNIT_ID = "01950000-0000-7000-8000-000000000099";
const YEAR_ID = "01950000-0000-7000-8000-000000000020";

const coordinatorUser: SessionUser = {
  id: "coord-1",
  email: "pengurus.lawang@pmki.org",
  name: "Ms. Evi",
  roles: ["UNIT_COORDINATOR"],
  permissions: ["class.read", "class.create", "class.update", "schedule.read"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

const teacherUser: SessionUser = {
  id: "teacher-1",
  email: "guru.matematika@pmki.org",
  name: "Pak Budi",
  roles: ["TEACHER"],
  permissions: ["class.read", "schedule.read"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

describe("Academic Domain — Validators & Policies", () => {
  it("validates createClassSchema and rejects invalid capacity or category", () => {
    const valid = createClassSchema.safeParse({
      organizationId: ORG_ID,
      serviceUnitId: UNIT_ID,
      academicYearId: YEAR_ID,
      name: "SD Kelas 3",
      category: "SD",
      capacity: 20,
      roomName: "Ruang A",
    });
    expect(valid.success).toBe(true);

    const invalid = createClassSchema.safeParse({
      organizationId: ORG_ID,
      serviceUnitId: UNIT_ID,
      academicYearId: YEAR_ID,
      name: "A",
      category: "SMA",
      capacity: 0,
    });
    expect(invalid.success).toBe(false);
  });

  it("validates enrollStudentToClassSchema UUIDs", () => {
    expect(
      enrollStudentToClassSchema.safeParse({
        studentId: ORG_ID,
        classId: UNIT_ID,
      }).success
    ).toBe(true);
    expect(
      enrollStudentToClassSchema.safeParse({
        studentId: "bukan-uuid",
        classId: "",
      }).success
    ).toBe(false);
  });

  it("enforces Academic RBAC and serviceUnitId scope", () => {
    expect(canReadClasses(teacherUser, UNIT_ID)).toBe(true);
    expect(canReadSchedules(teacherUser, UNIT_ID)).toBe(true);
    expect(canReadClasses(teacherUser, OTHER_UNIT_ID)).toBe(false);

    const teacherCreate = authorizeCreateClass(teacherUser, UNIT_ID);
    expect(teacherCreate.success).toBe(false);
    if (!teacherCreate.success) {
      expect(teacherCreate.error.code).toBe("PERMISSION_DENIED");
    }

    expect(authorizeCreateClass(coordinatorUser, UNIT_ID).success).toBe(true);
    expect(authorizeUpdateClass(coordinatorUser, UNIT_ID).success).toBe(true);

    const crossUnit = authorizeCreateClass(coordinatorUser, OTHER_UNIT_ID);
    expect(crossUnit.success).toBe(false);
    if (!crossUnit.success) {
      expect(crossUnit.error.code).toBe("SCOPE_DENIED");
    }
  });
});

