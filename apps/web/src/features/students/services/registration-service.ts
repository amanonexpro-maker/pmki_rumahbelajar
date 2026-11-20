import { getActiveAcademicYear } from "@/features/academic";
import { recordDomainAuditEvent } from "@/features/audit";
import { recordInitialRegistrationConsent } from "@/features/consent";
import { getDefaultPilotServiceUnit } from "@/features/organization";
import { getHumanErrorMessage } from "@/lib/messages";
import { REGISTRATION_STATUS_META, type RegistrationStatus } from "@/lib/status";
import type { SessionUser } from "@/server/auth/session";
import { fail, ok, type ActionResult } from "@/server/contracts/result";
import { authorizeVerifyStudent } from "../permissions/student-policy";
import {
  countTotalStudentsByUnit,
  findStudentRowById,
  insertStudentWithGuardian,
  updateStudentLifecycleStatus,
} from "../repositories/student-repository";
import {
  publicRegistrationSchema,
  verifyStudentSchema,
} from "../validators/student-validator";

/**
 * Valid Registration Lifecycle Transitions (04 §12, 11 §10).
 * Stored in PostgreSQL (`students.registration_status`), never inferred in UI.
 * Note: Transition to `ACTIVE` requires class enrollment via `PlacementService`.
 */
const ALLOWED_VERIFICATION_TRANSITIONS: Record<
  RegistrationStatus,
  readonly RegistrationStatus[]
> = {
  SUBMITTED: [
    "PENDING_VERIFICATION",
    "VERIFIED",
    "WAITLIST",
    "REJECTED",
    "CANCELLED",
  ],
  PENDING_VERIFICATION: ["VERIFIED", "WAITLIST", "REJECTED", "CANCELLED"],
  VERIFIED: ["CLASS_PLACEMENT", "WAITLIST", "CANCELLED"],
  CLASS_PLACEMENT: ["WAITLIST", "CANCELLED"],
  ACTIVE: ["WAITLIST", "CANCELLED"],
  WAITLIST: ["VERIFIED", "CLASS_PLACEMENT", "CANCELLED"],
  REJECTED: [],
  CANCELLED: [],
};

export function isValidVerificationTransition(
  from: RegistrationStatus,
  to: RegistrationStatus
): boolean {
  return ALLOWED_VERIFICATION_TRANSITIONS[from].includes(to);
}

/**
 * Public / Staff Registration Submission (5-Step Wizard -> DB Transaction + Consent + Audit Event).
 */
export async function submitPublicRegistration(
  rawInput: unknown,
  actorUser?: SessionUser | null
): Promise<
  ActionResult<{
    studentId: string;
    registrationNumber: string;
    fullName: string;
    registrationStatus: RegistrationStatus;
  }>
> {
  const parsed = publicRegistrationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const pilotUnit = await getDefaultPilotServiceUnit();
  if (!pilotUnit) {
    return fail(
      "RESOURCE_NOT_FOUND",
      "Unit layanan Rumah Belajar belum terkonfigurasi."
    );
  }

  const activeYear = await getActiveAcademicYear(pilotUnit.serviceUnitId);
  if (!activeYear) {
    return fail(
      "RESOURCE_NOT_FOUND",
      "Tahun ajaran aktif belum tersedia untuk unit layanan ini."
    );
  }

  const currentTotal = await countTotalStudentsByUnit(pilotUnit.serviceUnitId);
  const yearPrefix = activeYear.name.slice(0, 4) || "2026";
  const seq = String(currentTotal + 1).padStart(3, "0");
  const suffix = String(Date.now() % 1000).padStart(3, "0");
  const registrationNumber = `RB-${yearPrefix}-${seq}${suffix}`;

  const resolvedAddress =
    parsed.data.address?.trim() || `Kelurahan ${parsed.data.district}, Lawang`;

  const { student, guardian } = await insertStudentWithGuardian({
    organizationId: pilotUnit.organizationId,
    serviceUnitId: pilotUnit.serviceUnitId,
    academicYearId: activeYear.id,
    registrationNumber,
    fullName: parsed.data.fullName,
    nickname: parsed.data.nickname,
    birthDate: parsed.data.birthDate,
    gender: parsed.data.gender,
    educationLevel: parsed.data.educationLevel,
    schoolName: parsed.data.schoolName || null,
    address: resolvedAddress,
    district: parsed.data.district,
    isRaalResident: parsed.data.isRaalResident,
    guardianFullName: parsed.data.guardianFullName,
    guardianRelationship: parsed.data.guardianRelationship,
    guardianPhone: parsed.data.guardianPhone,
    guardianOccupation: parsed.data.guardianOccupation || null,
    actorId: actorUser?.id ?? null,
  });

  // Record initial consent via ConsentService (strict separation of Personal Data vs Photo/Video)
  await recordInitialRegistrationConsent({
    organizationId: pilotUnit.organizationId,
    serviceUnitId: pilotUnit.serviceUnitId,
    studentId: student.id,
    guardianId: guardian.id,
    personalDataConsent: "GRANTED",
    photoVideoConsent: parsed.data.photoVideoConsent,
    notes: parsed.data.notes || null,
    actorId: actorUser?.id ?? null,
  });

  // Emit StudentRegistered domain event -> persisted in immutable audit_logs
  await recordDomainAuditEvent({
    name: "StudentRegistered",
    organizationId: pilotUnit.organizationId,
    serviceUnitId: pilotUnit.serviceUnitId,
    actorId: actorUser?.id ?? null,
    entityType: "student",
    entityId: student.id,
    description: `Pendaftaran peserta didik baru ${student.fullName} (${student.registrationNumber}) diterima.`,
    metadata: {
      registrationNumber: student.registrationNumber,
      educationLevel: student.educationLevel,
      registrationStatus: student.registrationStatus,
      photoVideoConsent: parsed.data.photoVideoConsent,
    },
  });

  return ok({
    studentId: student.id,
    registrationNumber: student.registrationNumber,
    fullName: student.fullName,
    registrationStatus: student.registrationStatus,
  });
}

/**
 * Verifies or updates a student's registration lifecycle status (`student.verify`).
 * Enforces state machine rules and records `StudentVerified` domain event.
 */
export async function verifyStudentRegistration(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<
  ActionResult<{
    studentId: string;
    previousStatus: RegistrationStatus;
    newStatus: RegistrationStatus;
  }>
> {
  const parsed = verifyStudentSchema.safeParse(rawInput);
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

  const previousStatus = student.registrationStatus;
  const targetStatus = parsed.data.decision;

  if (!isValidVerificationTransition(previousStatus, targetStatus)) {
    const fromLabel = REGISTRATION_STATUS_META[previousStatus].label;
    const toLabel = REGISTRATION_STATUS_META[targetStatus].label;
    return fail(
      "RESOURCE_CONFLICT",
      `Perubahan status dari "${fromLabel}" ke "${toLabel}" tidak diizinkan oleh aturan siklus pendaftaran.`
    );
  }

  const shouldClearClass =
    targetStatus === "WAITLIST" ||
    targetStatus === "CANCELLED" ||
    targetStatus === "REJECTED";

  const updated = await updateStudentLifecycleStatus({
    studentId: student.id,
    registrationStatus: targetStatus,
    ...(shouldClearClass ? { assignedClassId: null } : {}),
    actorId: user?.id ?? null,
  });

  if (!updated) {
    return fail("INTERNAL_ERROR", getHumanErrorMessage("INTERNAL_ERROR"));
  }

  await recordDomainAuditEvent({
    name: "StudentVerified",
    organizationId: student.organizationId,
    serviceUnitId: student.serviceUnitId,
    actorId: user?.id ?? null,
    entityType: "student",
    entityId: student.id,
    description: `Memperbarui status pendaftaran ${student.fullName} dari ${REGISTRATION_STATUS_META[previousStatus].label} menjadi ${REGISTRATION_STATUS_META[targetStatus].label}.`,
    metadata: {
      previousStatus,
      newStatus: targetStatus,
      reason: parsed.data.reason ?? null,
    },
  });

  return ok({
    studentId: student.id,
    previousStatus,
    newStatus: updated.registrationStatus,
  });
}

