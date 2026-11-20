import type { SessionUser } from "@/server/auth/session";
import { fail, ok, type ActionResult } from "@/server/contracts/result";
import { getHumanErrorMessage } from "@/lib/messages";
import { authorizeCreateClass } from "../permissions/academic-policy";
import {
  countActiveEnrollmentsByClassId,
  findAcademicYearsByUnit,
  findActiveAcademicYearByUnit,
  findClassesByUnit,
  findClassRowById,
  findSchedulesByClassId,
  findTeacherForActorInUnit,
  findTeachersByUnit,
  insertClass,
  isStudentActivelyEnrolledInClass,
  upsertActiveClassEnrollment,
} from "../repositories/academic-repository";
import type {
  AcademicYearDTO,
  ClassLearningContextDTO,
  ClassSummaryDTO,
  EnrollStudentResultDTO,
} from "../types/academic-types";
import {
  createClassSchema,
  enrollStudentToClassSchema,
} from "../validators/academic-validator";

/**
 * Academic Domain Application Service (11 §11).
 * Cross-domain consumers (such as `students.PlacementService`) MUST interact
 * with classes & enrollments ONLY through this service.
 */
export async function getActiveAcademicYear(
  serviceUnitId: string
): Promise<AcademicYearDTO | null> {
  return findActiveAcademicYearByUnit(serviceUnitId);
}

export async function listAcademicYears(
  serviceUnitId: string
): Promise<AcademicYearDTO[]> {
  return findAcademicYearsByUnit(serviceUnitId);
}

export async function listClassesForServiceUnit(
  serviceUnitId: string,
  academicYearId?: string
): Promise<ClassSummaryDTO[]> {
  return findClassesByUnit(serviceUnitId, academicYearId);
}

export async function getClassSummaryById(
  classId: string
): Promise<ClassSummaryDTO | null> {
  const row = await findClassRowById(classId);
  if (!row) return null;

  const list = await findClassesByUnit(row.serviceUnitId, row.academicYearId);
  return list.find((c) => c.id === classId) ?? null;
}

export async function getClassLearningContext(
  classId: string
): Promise<ClassLearningContextDTO | null> {
  const classInfo = await getClassSummaryById(classId);
  if (!classInfo) return null;

  const schedules = await findSchedulesByClassId(classId);
  return { classInfo, schedules };
}

/**
 * Enrolls a student into a class after verifying class existence, active status,
 * and remaining seat capacity. Owned by Academic domain; invoked by Students.PlacementService.
 */
export async function enrollStudentInClass(params: {
  studentId: string;
  classId: string;
  expectedServiceUnitId?: string;
  actorId?: string | null;
}): Promise<ActionResult<EnrollStudentResultDTO>> {
  const parsed = enrollStudentToClassSchema.safeParse({
    studentId: params.studentId,
    classId: params.classId,
  });
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const classRow = await findClassRowById(params.classId);
  if (!classRow || !classRow.active) {
    return fail(
      "RESOURCE_NOT_FOUND",
      "Kelas yang dipilih tidak ditemukan atau sudah tidak aktif."
    );
  }

  if (
    params.expectedServiceUnitId &&
    classRow.serviceUnitId !== params.expectedServiceUnitId
  ) {
    return fail("SCOPE_DENIED", getHumanErrorMessage("SCOPE_DENIED"));
  }

  const alreadyEnrolled = await isStudentActivelyEnrolledInClass(
    params.studentId,
    params.classId
  );
  const currentEnrolled = await countActiveEnrollmentsByClassId(params.classId);

  if (!alreadyEnrolled && currentEnrolled >= classRow.capacity) {
    return fail(
      "RESOURCE_CONFLICT",
      `Kapasitas kelas ${classRow.name} sudah penuh (${classRow.capacity}/${classRow.capacity}). Silakan pilih kelas lain atau tempatkan peserta didik ke daftar tunggu.`
    );
  }

  const enrolled = await upsertActiveClassEnrollment({
    studentId: params.studentId,
    classId: classRow.id,
    academicYearId: classRow.academicYearId,
    actorId: params.actorId ?? null,
  });

  const updatedCount = await countActiveEnrollmentsByClassId(classRow.id);

  return ok({
    enrollmentId: enrolled.id,
    classId: classRow.id,
    className: classRow.name,
    academicYearId: classRow.academicYearId,
    remainingSeats: Math.max(0, classRow.capacity - updatedCount),
  });
}

export async function createAcademicClass(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<ActionResult<{ id: string; name: string }>> {
  const parsed = createClassSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const authz = authorizeCreateClass(user, parsed.data.serviceUnitId);
  if (!authz.success) return authz;

  const created = await insertClass(parsed.data, user?.id ?? null);
  return ok({ id: created.id, name: created.name });
}

export async function resolveTeacherForActor(
  serviceUnitId: string,
  userId?: string | null
): Promise<{ id: string; userId: string | null; name: string } | null> {
  return findTeacherForActorInUnit(serviceUnitId, userId);
}

export async function listTeachersForServiceUnit(
  serviceUnitId: string
): Promise<Array<{ id: string; userId: string | null; name: string }>> {
  return findTeachersByUnit(serviceUnitId);
}


