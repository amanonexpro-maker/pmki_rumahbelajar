import { enrollStudentInClass } from "@/features/academic";
import { recordDomainAuditEvent } from "@/features/audit";
import { getHumanErrorMessage } from "@/lib/messages";
import { REGISTRATION_STATUS_META, type RegistrationStatus } from "@/lib/status";
import type { SessionUser } from "@/server/auth/session";
import { fail, ok, type ActionResult } from "@/server/contracts/result";
import { authorizeVerifyStudent } from "../permissions/student-policy";
import {
  findStudentRowById,
  updateStudentLifecycleStatus,
} from "../repositories/student-repository";
import { placeStudentSchema } from "../validators/student-validator";

const PLACEABLE_STATUSES: readonly RegistrationStatus[] = [
  "VERIFIED",
  "CLASS_PLACEMENT",
  "WAITLIST",
  "ACTIVE",
];

/**
 * Students Domain Placement Service (11 §10, §20–21).
 * RED-LINE BOUNDARY: Never accesses Academic repositories or tables directly.
 * All class capacity checks and enrollment writes go strictly through `AcademicService.enrollStudentInClass`.
 */
export async function placeStudentInClass(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<
  ActionResult<{
    studentId: string;
    classId: string;
    className: string;
    registrationStatus: RegistrationStatus;
    remainingSeats: number;
  }>
> {
  const parsed = placeStudentSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const student = await findStudentRowById(parsed.data.studentId);
  if (!student) {
    return fail("RESOURCE_NOT_FOUND", getHumanErrorMessage("RESOURCE_NOT_FOUND"));
  }

  const authz = authorizeVerifyStudent(user, student.serviceUnitId);
  if (!authz.success) return authz;

  if (!PLACEABLE_STATUSES.includes(student.registrationStatus)) {
    const currentLabel =
      REGISTRATION_STATUS_META[student.registrationStatus].label;
    return fail(
      "RESOURCE_CONFLICT",
      `Peserta didik dengan status "${currentLabel}" belum dapat ditempatkan ke kelas. Verifikasi pendaftaran terlebih dahulu.`
    );
  }

  // Step 1: Delegate enrollment & capacity check to AcademicService (Cross-domain via Service ONLY)
  const enrollmentResult = await enrollStudentInClass({
    studentId: student.id,
    classId: parsed.data.classId,
    expectedServiceUnitId: student.serviceUnitId,
    actorId: user?.id ?? null,
  });

  if (!enrollmentResult.success) {
    return enrollmentResult;
  }

  // Step 2: Persist CLASS_PLACEMENT -> ACTIVE transition on the student record
  await updateStudentLifecycleStatus({
    studentId: student.id,
    registrationStatus: "CLASS_PLACEMENT",
    assignedClassId: enrollmentResult.data.classId,
    actorId: user?.id ?? null,
  });

  const activated = await updateStudentLifecycleStatus({
    studentId: student.id,
    registrationStatus: "ACTIVE",
    assignedClassId: enrollmentResult.data.classId,
    actorId: user?.id ?? null,
  });

  if (!activated) {
    return fail("INTERNAL_ERROR", getHumanErrorMessage("INTERNAL_ERROR"));
  }

  // Step 3: Emit StudentPlaced domain event -> recorded in immutable audit_logs
  await recordDomainAuditEvent({
    name: "StudentPlaced",
    organizationId: student.organizationId,
    serviceUnitId: student.serviceUnitId,
    actorId: user?.id ?? null,
    entityType: "student",
    entityId: student.id,
    description: `Menempatkan peserta didik ${student.fullName} ke kelas ${enrollmentResult.data.className} (status: Aktif belajar).`,
    metadata: {
      previousStatus: student.registrationStatus,
      newStatus: "ACTIVE",
      classId: enrollmentResult.data.classId,
      className: enrollmentResult.data.className,
      enrollmentId: enrollmentResult.data.enrollmentId,
      notes: parsed.data.notes ?? null,
    },
  });

  return ok({
    studentId: student.id,
    classId: enrollmentResult.data.classId,
    className: enrollmentResult.data.className,
    registrationStatus: activated.registrationStatus,
    remainingSeats: enrollmentResult.data.remainingSeats,
  });
}

