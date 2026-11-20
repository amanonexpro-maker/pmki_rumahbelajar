import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  auditLogs,
  classEnrollments,
  classes,
  consents,
  guardians,
  studentGuardians,
  students,
  users,
} from "@/db/schema";
import { resolveAccess } from "@/features/administration";
import { createAcademicClass } from "@/features/academic";
import type { SessionUser } from "@/server/auth/session";
import {
  getConfidentialGuardianForStudent,
  getStudentDetailForWorkspace,
  listStudentsForWorkspace,
  placeStudentInClass,
  submitPublicRegistration,
  verifyStudentRegistration,
} from "./index";

async function loadSessionByEmail(email: string): Promise<SessionUser> {
  const [userRow] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!userRow) {
    throw new Error(`Seeded user ${email} not found. Run npm run db:seed.`);
  }
  const access = await resolveAccess(userRow.id);
  return {
    id: userRow.id,
    email: userRow.email,
    name: access.name,
    roles: access.roles,
    permissions: access.permissions,
    memberships: access.memberships,
  };
}

describe("Fase 4 Integration — Registration -> Verification -> Placement -> Confidential Guardian Privacy", () => {
  let coordinatorSession!: SessionUser;
  let volunteerSession!: SessionUser;
  const createdStudentIds: string[] = [];
  const createdGuardianIds: string[] = [];
  const createdClassIds: string[] = [];

  beforeAll(async () => {
    coordinatorSession = await loadSessionByEmail("pengurus.lawang@pmki.org");
    volunteerSession = await loadSessionByEmail("relawan.lawang@pmki.org");
  });

  afterAll(async () => {
    if (createdStudentIds.length > 0) {
      await db
        .delete(classEnrollments)
        .where(inArray(classEnrollments.studentId, createdStudentIds));
      const cRows = await db
        .select({ id: consents.id, guardianId: consents.guardianId })
        .from(consents)
        .where(inArray(consents.studentId, createdStudentIds));
      for (const c of cRows) {
        createdGuardianIds.push(c.guardianId);
      }
      await db
        .delete(consents)
        .where(inArray(consents.studentId, createdStudentIds));
      await db
        .delete(studentGuardians)
        .where(inArray(studentGuardians.studentId, createdStudentIds));
      await db
        .delete(students)
        .where(inArray(students.id, createdStudentIds));
    }
    if (createdGuardianIds.length > 0) {
      await db
        .delete(guardians)
        .where(inArray(guardians.id, Array.from(new Set(createdGuardianIds))));
    }
    if (createdClassIds.length > 0) {
      await db.delete(classes).where(inArray(classes.id, createdClassIds));
    }
  });

  it("executes full lifecycle: Registration (SUBMITTED) -> Verification (VERIFIED) -> Placement via AcademicService (ACTIVE) + Audit Trail", async () => {
    // 1. Public Registration -> SUBMITTED
    const regResult = await submitPublicRegistration({
      fullName: "Yohanes Adi Nugroho",
      nickname: "Adi",
      gender: "L",
      birthDate: "2016-08-17",
      district: "Kalirejo",
      address: "Jl. Sumber Waras No. 14, Kalirejo",
      isRaalResident: false,
      guardianFullName: "Bapak Petrus Nugroho",
      guardianRelationship: "AYAH",
      guardianPhone: "081398765432",
      guardianOccupation: "Petani",
      educationLevel: "SD_2",
      schoolName: "SDN Kalirejo 2",
      notes: "Semangat belajar matematika",
      personalDataConsent: true,
      photoVideoConsent: "GRANTED",
    });

    expect(regResult.success).toBe(true);
    if (!regResult.success) return;

    const studentId = regResult.data.studentId;
    createdStudentIds.push(studentId);
    expect(regResult.data.registrationStatus).toBe("SUBMITTED");
    expect(regResult.data.registrationNumber).toMatch(/^RB-2026-/);

    // 2. Illegal direct placement before verification MUST be rejected
    const [existingClass] = await db.select().from(classes).limit(1);
    expect(existingClass).toBeTruthy();

    const prematurePlace = await placeStudentInClass(coordinatorSession, {
      studentId,
      classId: existingClass!.id,
    });
    expect(prematurePlace.success).toBe(false);
    if (!prematurePlace.success) {
      expect(prematurePlace.error.code).toBe("RESOURCE_CONFLICT");
    }

    // 3. Unauthorized verification by VOLUNTEER MUST be rejected (PERMISSION_DENIED)
    const unauthorizedVerify = await verifyStudentRegistration(
      volunteerSession,
      {
        studentId,
        decision: "VERIFIED",
      }
    );
    expect(unauthorizedVerify.success).toBe(false);
    if (!unauthorizedVerify.success) {
      expect(unauthorizedVerify.error.code).toBe("PERMISSION_DENIED");
    }

    // 4. Authorized verification by UNIT_COORDINATOR -> PENDING_VERIFICATION -> VERIFIED
    const pendingRes = await verifyStudentRegistration(coordinatorSession, {
      studentId,
      decision: "PENDING_VERIFICATION",
      reason: "Menunggu konfirmasi jadwal dengan wali.",
    });
    expect(pendingRes.success).toBe(true);

    const verifiedRes = await verifyStudentRegistration(coordinatorSession, {
      studentId,
      decision: "VERIFIED",
      reason: "Data lengkap dan sesuai jenjang SD Kelas 2.",
    });
    expect(verifiedRes.success).toBe(true);
    if (verifiedRes.success) {
      expect(verifiedRes.data.newStatus).toBe("VERIFIED");
    }

    // 5. Class Placement via PlacementService -> calls AcademicService -> status ACTIVE
    const placedRes = await placeStudentInClass(coordinatorSession, {
      studentId,
      classId: existingClass!.id,
      notes: "Ditempatkan ke kelas reguler Sabtu.",
    });
    expect(placedRes.success).toBe(true);
    if (placedRes.success) {
      expect(placedRes.data.registrationStatus).toBe("ACTIVE");
      expect(placedRes.data.classId).toBe(existingClass!.id);
    }

    // 6. Illegal backward transition from ACTIVE to VERIFIED is rejected
    const illegalBack = await verifyStudentRegistration(coordinatorSession, {
      studentId,
      decision: "VERIFIED",
    });
    expect(illegalBack.success).toBe(false);
    if (!illegalBack.success) {
      expect(illegalBack.error.code).toBe("RESOURCE_CONFLICT");
    }

    // 7. Verify all 3 domain events (StudentRegistered, StudentVerified, StudentPlaced) are in audit_logs
    const studentAudits = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entityId, studentId));

    const actions = studentAudits.map((a) => a.action);
    expect(actions).toContain("StudentRegistered");
    expect(actions).toContain("StudentVerified");
    expect(actions).toContain("StudentPlaced");
  });

  it("enforces class capacity limits in AcademicService and confidential guardian stripping in StudentService", async () => {
    const studentId = createdStudentIds[0];
    expect(studentId).toBeTruthy();

    // 1. Server-side CONFIDENTIAL guardian stripping:
    // VOLUNTEER has `student.read` but NOT `guardian.read`
    const volunteerDetail = await getStudentDetailForWorkspace(
      volunteerSession,
      studentId
    );
    expect(volunteerDetail.success).toBe(true);
    if (volunteerDetail.success) {
      expect(volunteerDetail.data.guardianAccessDenied).toBe(true);
      expect(volunteerDetail.data.guardian).toBeNull();
      expect(volunteerDetail.data.address).toBeNull();
    }

    const volunteerGuardianDirect = await getConfidentialGuardianForStudent(
      volunteerSession,
      studentId
    );
    expect(volunteerGuardianDirect.success).toBe(false);
    if (!volunteerGuardianDirect.success) {
      expect(volunteerGuardianDirect.error.code).toBe("PERMISSION_DENIED");
    }

    // UNIT_COORDINATOR has `guardian.read` + matching serviceUnitId scope
    const coordinatorDetail = await getStudentDetailForWorkspace(
      coordinatorSession,
      studentId
    );
    expect(coordinatorDetail.success).toBe(true);
    if (coordinatorDetail.success) {
      expect(coordinatorDetail.data.guardianAccessDenied).toBe(false);
      expect(coordinatorDetail.data.guardian?.fullName).toBe(
        "Bapak Petrus Nugroho"
      );
      expect(coordinatorDetail.data.guardian?.phone).toBe("081398765432");
      expect(coordinatorDetail.data.address).toContain("Kalirejo");
    }

    // 2. Search/filter privacy check: searching by guardian phone number must return 0 matches
    const phoneSearch = await listStudentsForWorkspace(coordinatorSession, {
      search: "081398765432",
    });
    expect(phoneSearch.success).toBe(true);
    if (phoneSearch.success) {
      expect(phoneSearch.data.totalCount).toBe(0);
    }

    // 3. Class capacity limit enforcement (capacity = 1)
    if (coordinatorDetail.success) {
      const sData = coordinatorDetail.data;
      const tinyClassRes = await createAcademicClass(coordinatorSession, {
        organizationId: sData.organizationId,
        serviceUnitId: sData.serviceUnitId,
        academicYearId: sData.academicYearId,
        name: "Kelas Literasi Khusus (Kapasitas 1)",
        category: "LITERASI",
        capacity: 1,
        roomName: "Sudut Baca",
      });
      expect(tinyClassRes.success).toBe(true);
      if (tinyClassRes.success) {
        const tinyClassId = tinyClassRes.data.id;
        createdClassIds.push(tinyClassId);

        // Place first student into capacity-1 class -> succeeds
        const firstPlace = await placeStudentInClass(coordinatorSession, {
          studentId,
          classId: tinyClassId,
        });
        expect(firstPlace.success).toBe(true);

        // Register & verify a second student, then attempt placement into the now-full class -> RESOURCE_CONFLICT
        const reg2 = await submitPublicRegistration({
          fullName: "Maria Clara",
          nickname: "Clara",
          gender: "P",
          birthDate: "2017-01-10",
          district: "Lawang",
          isRaalResident: true,
          guardianFullName: "Pengasuh RAAL",
          guardianRelationship: "PENGASUH_RAAL",
          guardianPhone: "081200001111",
          educationLevel: "SD_1",
          personalDataConsent: true,
          photoVideoConsent: "DENIED",
        });
        expect(reg2.success).toBe(true);
        if (reg2.success) {
          createdStudentIds.push(reg2.data.studentId);
          await verifyStudentRegistration(coordinatorSession, {
            studentId: reg2.data.studentId,
            decision: "VERIFIED",
          });

          const fullPlace = await placeStudentInClass(coordinatorSession, {
            studentId: reg2.data.studentId,
            classId: tinyClassId,
          });
          expect(fullPlace.success).toBe(false);
          if (!fullPlace.success) {
            expect(fullPlace.error.code).toBe("RESOURCE_CONFLICT");
            expect(fullPlace.error.message).toContain("penuh");
          }
        }
      }
    }
  });
});
