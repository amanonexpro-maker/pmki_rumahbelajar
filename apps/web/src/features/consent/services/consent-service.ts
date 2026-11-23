import { recordDomainAuditEvent } from "@/features/audit";
import { listStudentsForWorkspace } from "@/features/students";
import { getHumanErrorMessage } from "@/lib/messages";
import { CONSENT_STATUS_META, type ConsentStatus } from "@/lib/status";
import type { SessionUser } from "@/server/auth/session";
import { fail, ok, type ActionResult } from "@/server/contracts/result";
import {
  authorizeReadConsents,
  authorizeUpdateConsent,
  canReadConfidentialConsentEvidence,
} from "../permissions/consent-policy";
import {
  countRevokedConsentsByUnitIds,
  findConsentById,
  findConsentsByServiceUnitIds,
  findLatestConsentByStudentId,
  insertStudentConsent,
  updateConsentRecordById,
  type UpsertStudentConsentInput,
} from "../repositories/consent-repository";
import type { StudentConsentRecordDTO } from "../types/consent-types";
import { updateStudentConsentSchema } from "../validators/consent-validator";

/**
 * Consent Domain Application Service (11 §14, 04 §18, 05 §13–14).
 * Single source of truth for Personal Data Consent vs Photo & Video Consent.
 * Cross-domain consumers (Students, Development, Media, Publishing) MUST call this service.
 */
export async function recordInitialRegistrationConsent(
  input: UpsertStudentConsentInput
) {
  const created = await insertStudentConsent(input);

  await recordDomainAuditEvent({
    name: "ConsentUpdated",
    organizationId: input.organizationId,
    serviceUnitId: input.serviceUnitId,
    actorId: input.actorId ?? null,
    entityType: "consent",
    entityId: created.id,
    description: `Mencatat persetujuan awal peserta didik (Data: ${CONSENT_STATUS_META[input.personalDataConsent].label}, Foto & Video: ${CONSENT_STATUS_META[input.photoVideoConsent].label}).`,
    metadata: {
      studentId: input.studentId,
      personalDataConsent: input.personalDataConsent,
      photoVideoConsent: input.photoVideoConsent,
    },
  });

  return created;
}

export async function getStudentConsentStatus(studentId: string) {
  return findLatestConsentByStudentId(studentId);
}

/**
 * Checks whether Personal Data processing is currently GRANTED for a student.
 * Returns `false` if consent is DENIED or REVOKED.
 */
export async function isPersonalDataProcessingAllowed(
  studentId: string
): Promise<boolean> {
  const latest = await findLatestConsentByStudentId(studentId);
  if (!latest) return false;
  return latest.personalDataConsent === "GRANTED" && !latest.revokedAt;
}

/**
 * Checks whether Photo & Video publication is currently GRANTED for a student.
 * Returns `false` if consent is DENIED or REVOKED.
 */
export async function isPhotoVideoPublicAllowed(
  studentId: string
): Promise<boolean> {
  const latest = await findLatestConsentByStudentId(studentId);
  if (!latest) return false;
  return latest.photoVideoConsent === "GRANTED";
}

/**
 * Verifies that every student in `studentIds` holds an active `GRANTED` Photo & Video consent.
 */
export async function verifyAllStudentsHavePhotoVideoConsent(
  studentIds: string[]
): Promise<{ allowed: boolean; blockedStudentIds: string[] }> {
  const blockedStudentIds: string[] = [];
  for (const studentId of studentIds) {
    const allowed = await isPhotoVideoPublicAllowed(studentId);
    if (!allowed) {
      blockedStudentIds.push(studentId);
    }
  }
  return {
    allowed: blockedStudentIds.length === 0,
    blockedStudentIds,
  };
}

export async function listConsentsForWorkspace(
  user: SessionUser | null | undefined,
  filters: { search?: string; photoVideoStatus?: string } = {}
): Promise<ActionResult<StudentConsentRecordDTO[]>> {
  const authz = authorizeReadConsents(user);
  if (!authz.success) return authz;

  const serviceUnitIds = Array.from(
    new Set((user?.memberships ?? []).map((m) => m.serviceUnitId))
  );
  if (serviceUnitIds.length === 0) {
    return fail("SCOPE_DENIED", getHumanErrorMessage("SCOPE_DENIED"));
  }

  const [rows, studentsRes] = await Promise.all([
    findConsentsByServiceUnitIds(serviceUnitIds),
    listStudentsForWorkspace(user, { pageSize: 50 }),
  ]);

  const studentById = new Map(
    (studentsRes.success ? studentsRes.data.items : []).map((s) => [s.id, s])
  );

  const searchLower = filters.search?.trim().toLowerCase() ?? "";

  const mapped: StudentConsentRecordDTO[] = rows
    .map((row) => {
      const st = studentById.get(row.studentId);
      const allowEvidence = canReadConfidentialConsentEvidence(
        user,
        row.serviceUnitId
      );
      return {
        id: row.id,
        organizationId: row.organizationId,
        serviceUnitId: row.serviceUnitId,
        studentId: row.studentId,
        studentFullName: st?.fullName ?? "Peserta Didik",
        studentRegistrationNumber: st?.registrationNumber ?? "—",
        studentEducationLevelLabel: st?.educationLevelLabel ?? "Rumah Belajar",
        guardianId: row.guardianId,
        personalDataConsent: row.personalDataConsent as ConsentStatus,
        photoVideoConsent: row.photoVideoConsent as ConsentStatus,
        notes: allowEvidence ? row.notes : null,
        effectiveAt: row.effectiveAt.toISOString(),
        revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
        updatedAt: row.updatedAt.toISOString(),
      };
    })
    .filter((item) => {
      const matchesStatus =
        !filters.photoVideoStatus ||
        filters.photoVideoStatus === "ALL" ||
        item.photoVideoConsent === filters.photoVideoStatus;
      const matchesSearch =
        !searchLower ||
        item.studentFullName.toLowerCase().includes(searchLower) ||
        item.studentRegistrationNumber.toLowerCase().includes(searchLower);
      return matchesStatus && matchesSearch;
    });

  return ok(mapped);
}

export async function updateStudentConsent(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<
  ActionResult<{
    consentId: string;
    studentId: string;
    personalDataConsent: ConsentStatus;
    photoVideoConsent: ConsentStatus;
    revokedAt: string | null;
  }>
> {
  const parsed = updateStudentConsentSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ??
        getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const existing = await findConsentById(parsed.data.consentId);
  if (!existing) {
    return fail("RESOURCE_NOT_FOUND", "Data persetujuan tidak ditemukan.");
  }

  const authz = authorizeUpdateConsent(user, existing.serviceUnitId);
  if (!authz.success) return authz;

  const updated = await updateConsentRecordById({
    consentId: existing.id,
    personalDataConsent: parsed.data.personalDataConsent,
    photoVideoConsent: parsed.data.photoVideoConsent,
    notes: parsed.data.notes ?? existing.notes,
    actorId: user?.id ?? null,
  });

  if (!updated) {
    return fail("INTERNAL_ERROR", getHumanErrorMessage("INTERNAL_ERROR"));
  }

  await recordDomainAuditEvent({
    name: "ConsentUpdated",
    organizationId: existing.organizationId,
    serviceUnitId: existing.serviceUnitId,
    actorId: user?.id ?? null,
    entityType: "consent",
    entityId: updated.id,
    description: `Memperbarui persetujuan peserta didik (Data: ${CONSENT_STATUS_META[updated.personalDataConsent].label}, Foto & Video: ${CONSENT_STATUS_META[updated.photoVideoConsent].label}).`,
    metadata: {
      studentId: existing.studentId,
      previousPersonalDataConsent: existing.personalDataConsent,
      newPersonalDataConsent: updated.personalDataConsent,
      previousPhotoVideoConsent: existing.photoVideoConsent,
      newPhotoVideoConsent: updated.photoVideoConsent,
      revokedAt: updated.revokedAt?.toISOString() ?? null,
      notes: parsed.data.notes ?? null,
    },
  });

  return ok({
    consentId: updated.id,
    studentId: updated.studentId,
    personalDataConsent: updated.personalDataConsent as ConsentStatus,
    photoVideoConsent: updated.photoVideoConsent as ConsentStatus,
    revokedAt: updated.revokedAt ? updated.revokedAt.toISOString() : null,
  });
}

export async function countRevokedConsentsForDashboard(
  user: SessionUser | null | undefined
): Promise<number> {
  const authz = authorizeReadConsents(user);
  if (!authz.success) return 0;

  const serviceUnitIds = Array.from(
    new Set((user?.memberships ?? []).map((m) => m.serviceUnitId))
  );
  if (serviceUnitIds.length === 0) return 0;

  return countRevokedConsentsByUnitIds(serviceUnitIds);
}
