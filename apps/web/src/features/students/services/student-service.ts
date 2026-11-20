import {
  getClassLearningContext,
  listAcademicYears,
  listClassesForServiceUnit,
} from "@/features/academic";
import { recordAuditLog } from "@/features/audit";
import { getStudentConsentStatus } from "@/features/consent";
import { getHumanErrorMessage } from "@/lib/messages";
import type { SessionUser } from "@/server/auth/session";
import { fail, ok, type ActionResult } from "@/server/contracts/result";
import {
  authorizeReadStudents,
  authorizeUpdateStudent,
  canReadConfidentialGuardian,
  canUpdateConfidentialGuardian,
} from "../permissions/student-policy";
import {
  findPrimaryGuardianByStudentId,
  findStudentRowById,
  findStudentsFiltered,
  updateStudentAndGuardianProfile,
} from "../repositories/student-repository";
import {
  EDUCATION_LEVEL_LABELS,
  GUARDIAN_RELATIONSHIP_LABELS,
  type ConfidentialGuardianDTO,
  type EducationLevelCode,
  type GuardianRelationshipCode,
  type StudentDetailDTO,
  type StudentListFilterParams,
  type StudentListItemDTO,
  type StudentListResultDTO,
} from "../types/student-types";
import { updateStudentProfileSchema } from "../validators/student-validator";

/**
 * Student Domain Application Service (11 §10).
 * Server-side read models enforce scope and strip CONFIDENTIAL guardian/address
 * data whenever the caller lacks `guardian.read` + service unit scope.
 */
export async function listStudentsForWorkspace(
  user: SessionUser | null | undefined,
  filters: StudentListFilterParams = {}
): Promise<ActionResult<StudentListResultDTO>> {
  const authz = authorizeReadStudents(user);
  if (!authz.success) return authz;

  const serviceUnitIds = Array.from(
    new Set((user?.memberships ?? []).map((m) => m.serviceUnitId))
  );

  if (serviceUnitIds.length === 0) {
    return fail("SCOPE_DENIED", getHumanErrorMessage("SCOPE_DENIED"));
  }

  // Resolve academic year & class metadata via AcademicService (Cross-domain via Service ONLY)
  const classNameById = new Map<string, string>();
  const yearNameById = new Map<string, string>();
  for (const unitId of serviceUnitIds) {
    const [unitClasses, unitYears] = await Promise.all([
      listClassesForServiceUnit(unitId),
      listAcademicYears(unitId),
    ]);
    for (const c of unitClasses) classNameById.set(c.id, c.name);
    for (const y of unitYears) yearNameById.set(y.id, y.name);
  }

  const rows = await findStudentsFiltered({
    serviceUnitIds,
    search: filters.search,
    status: filters.status,
    academicYearId: filters.academicYearId,
    classId: filters.classId,
    educationLevel: filters.educationLevel,
  });

  const allItems: StudentListItemDTO[] = rows.map((row) => {
    const edCode = (row.educationLevel as EducationLevelCode) || "SD_1";
    return {
      id: row.id,
      organizationId: row.organizationId,
      serviceUnitId: row.serviceUnitId,
      academicYearId: row.academicYearId,
      academicYearName: yearNameById.get(row.academicYearId) ?? "2026/2027",
      assignedClassId: row.assignedClassId,
      assignedClassName: row.assignedClassId
        ? (classNameById.get(row.assignedClassId) ?? null)
        : null,
      registrationNumber: row.registrationNumber,
      fullName: row.fullName,
      nickname: row.nickname,
      birthDate: row.birthDate,
      gender: (row.gender === "P" ? "P" : "L") as "L" | "P",
      educationLevel: edCode,
      educationLevelLabel: EDUCATION_LEVEL_LABELS[edCode] ?? row.educationLevel,
      schoolName: row.schoolName,
      district: row.district,
      isRaalResident: row.isRaalResident,
      registrationStatus: row.registrationStatus,
      createdAt: row.createdAt.toISOString(),
    };
  });

  const pendingVerificationCount = allItems.filter(
    (s) =>
      s.registrationStatus === "SUBMITTED" ||
      s.registrationStatus === "PENDING_VERIFICATION"
  ).length;

  const awaitingPlacementCount = allItems.filter(
    (s) =>
      (s.registrationStatus === "VERIFIED" ||
        s.registrationStatus === "CLASS_PLACEMENT") &&
      !s.assignedClassId
  ).length;

  const pageSize = Math.max(1, Math.min(50, filters.pageSize ?? 20));
  const totalCount = allItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.max(1, Math.min(totalPages, filters.page ?? 1));
  const startIdx = (page - 1) * pageSize;
  const paginatedItems = allItems.slice(startIdx, startIdx + pageSize);

  return ok({
    items: paginatedItems,
    totalCount,
    page,
    pageSize,
    totalPages,
    pendingVerificationCount,
    awaitingPlacementCount,
  });
}

export async function getStudentDetailForWorkspace(
  user: SessionUser | null | undefined,
  studentId: string
): Promise<ActionResult<StudentDetailDTO>> {
  const row = await findStudentRowById(studentId);
  if (!row) {
    return fail("RESOURCE_NOT_FOUND", getHumanErrorMessage("RESOURCE_NOT_FOUND"));
  }

  const authz = authorizeReadStudents(user, row.serviceUnitId);
  if (!authz.success) return authz;

  const [unitClasses, unitYears, consentRow, learningContext] =
    await Promise.all([
      listClassesForServiceUnit(row.serviceUnitId),
      listAcademicYears(row.serviceUnitId),
      getStudentConsentStatus(row.id),
      row.assignedClassId
        ? getClassLearningContext(row.assignedClassId)
        : Promise.resolve(null),
    ]);

  const assignedClass = row.assignedClassId
    ? unitClasses.find((c) => c.id === row.assignedClassId)
    : null;
  const academicYear = unitYears.find((y) => y.id === row.academicYearId);

  // Server-side CONFIDENTIAL data gate (05 §13–14)
  const allowGuardian = canReadConfidentialGuardian(user, row.serviceUnitId);
  let guardianDto: ConfidentialGuardianDTO | null = null;

  if (allowGuardian) {
    const guardianRow = await findPrimaryGuardianByStudentId(row.id);
    if (guardianRow) {
      const rel = guardianRow.relationship as GuardianRelationshipCode;
      guardianDto = {
        id: guardianRow.id,
        fullName: guardianRow.fullName,
        relationship: rel,
        relationshipLabel: GUARDIAN_RELATIONSHIP_LABELS[rel] ?? rel,
        phone: guardianRow.phone,
        occupation: guardianRow.occupation,
        address: guardianRow.address,
      };
    }
  }

  const edCode = (row.educationLevel as EducationLevelCode) || "SD_1";

  return ok({
    id: row.id,
    organizationId: row.organizationId,
    serviceUnitId: row.serviceUnitId,
    academicYearId: row.academicYearId,
    academicYearName: academicYear?.name ?? "2026/2027",
    assignedClassId: row.assignedClassId,
    assignedClassName: assignedClass?.name ?? null,
    registrationNumber: row.registrationNumber,
    fullName: row.fullName,
    nickname: row.nickname,
    birthDate: row.birthDate,
    gender: (row.gender === "P" ? "P" : "L") as "L" | "P",
    educationLevel: edCode,
    educationLevelLabel: EDUCATION_LEVEL_LABELS[edCode] ?? row.educationLevel,
    schoolName: row.schoolName,
    district: row.district,
    isRaalResident: row.isRaalResident,
    registrationStatus: row.registrationStatus,
    createdAt: row.createdAt.toISOString(),
    address: allowGuardian ? row.address : null,
    guardian: guardianDto,
    guardianAccessDenied: !allowGuardian,
    consentSummary: consentRow
      ? {
          personalDataConsent: consentRow.personalDataConsent,
          photoVideoConsent: consentRow.photoVideoConsent,
        }
      : null,
    learningContext,
  });
}

export async function updateStudentProfile(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<ActionResult<{ studentId: string }>> {
  const parsed = updateStudentProfileSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const row = await findStudentRowById(parsed.data.studentId);
  if (!row) {
    return fail("RESOURCE_NOT_FOUND", getHumanErrorMessage("RESOURCE_NOT_FOUND"));
  }

  const authz = authorizeUpdateStudent(user, row.serviceUnitId);
  if (!authz.success) return authz;

  const canUpdateGuardian = canUpdateConfidentialGuardian(
    user,
    row.serviceUnitId
  );
  let guardianUpdatePayload:
    | {
        guardianId: string;
        fullName: string;
        relationship: GuardianRelationshipCode;
        phone: string;
        occupation?: string | null;
        address?: string | null;
      }
    | undefined;

  if (
    canUpdateGuardian &&
    parsed.data.guardianFullName &&
    parsed.data.guardianPhone &&
    parsed.data.guardianRelationship
  ) {
    const existingGuardian = await findPrimaryGuardianByStudentId(row.id);
    if (existingGuardian) {
      guardianUpdatePayload = {
        guardianId: existingGuardian.id,
        fullName: parsed.data.guardianFullName,
        relationship: parsed.data.guardianRelationship,
        phone: parsed.data.guardianPhone,
        occupation: parsed.data.guardianOccupation ?? null,
        address: parsed.data.address ?? existingGuardian.address,
      };
    }
  }

  await updateStudentAndGuardianProfile({
    studentId: row.id,
    fullName: parsed.data.fullName,
    nickname: parsed.data.nickname,
    gender: parsed.data.gender,
    birthDate: parsed.data.birthDate,
    educationLevel: parsed.data.educationLevel,
    schoolName: parsed.data.schoolName ?? null,
    district: parsed.data.district,
    address: canUpdateGuardian ? (parsed.data.address ?? row.address) : undefined,
    isRaalResident: parsed.data.isRaalResident,
    guardianUpdate: guardianUpdatePayload,
    actorId: user?.id ?? null,
  });

  await recordAuditLog({
    organizationId: row.organizationId,
    serviceUnitId: row.serviceUnitId,
    actorId: user?.id ?? null,
    action: "StudentProfileUpdated",
    entityType: "student",
    entityId: row.id,
    description: `Memperbarui profil peserta didik ${parsed.data.fullName}.`,
    metadata: {
      guardianUpdated: Boolean(guardianUpdatePayload),
    },
  });

  return ok({ studentId: row.id });
}

