import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { consents } from "@/db/schema";
import type { ConsentStatus } from "@/lib/status";

export interface UpsertStudentConsentInput {
  organizationId: string;
  serviceUnitId: string;
  studentId: string;
  guardianId: string;
  personalDataConsent: ConsentStatus;
  photoVideoConsent: ConsentStatus;
  notes?: string | null;
  actorId?: string | null;
}

/**
 * Consent Domain Repository (11 §14, §24).
 * STRICT BOUNDARY: Only queries `consents`. Never queries `students`, `media_assets`, or `publications`.
 */
export async function findLatestConsentByStudentId(studentId: string) {
  const [row] = await db
    .select()
    .from(consents)
    .where(and(eq(consents.studentId, studentId), isNull(consents.archivedAt)))
    .orderBy(desc(consents.effectiveAt), desc(consents.updatedAt))
    .limit(1);
  return row ?? null;
}

export async function findConsentById(consentId: string) {
  const [row] = await db
    .select()
    .from(consents)
    .where(and(eq(consents.id, consentId), isNull(consents.archivedAt)))
    .limit(1);
  return row ?? null;
}

export async function findConsentsByServiceUnitIds(serviceUnitIds: string[]) {
  if (serviceUnitIds.length === 0) return [];
  return db
    .select()
    .from(consents)
    .where(
      and(
        inArray(consents.serviceUnitId, serviceUnitIds),
        isNull(consents.archivedAt)
      )
    )
    .orderBy(desc(consents.updatedAt), desc(consents.effectiveAt));
}

export async function insertStudentConsent(input: UpsertStudentConsentInput) {
  const isRevoked =
    input.personalDataConsent === "REVOKED" ||
    input.photoVideoConsent === "REVOKED";

  const [inserted] = await db
    .insert(consents)
    .values({
      organizationId: input.organizationId,
      serviceUnitId: input.serviceUnitId,
      studentId: input.studentId,
      guardianId: input.guardianId,
      personalDataConsent: input.personalDataConsent,
      photoVideoConsent: input.photoVideoConsent,
      notes: input.notes ?? null,
      revokedAt: isRevoked ? new Date() : null,
      createdBy: input.actorId ?? null,
      updatedBy: input.actorId ?? null,
    })
    .returning();
  return inserted;
}

export async function updateConsentRecordById(params: {
  consentId: string;
  personalDataConsent: ConsentStatus;
  photoVideoConsent: ConsentStatus;
  notes?: string | null;
  actorId?: string | null;
}) {
  const isRevoked =
    params.personalDataConsent === "REVOKED" ||
    params.photoVideoConsent === "REVOKED";

  const [updated] = await db
    .update(consents)
    .set({
      personalDataConsent: params.personalDataConsent,
      photoVideoConsent: params.photoVideoConsent,
      notes: params.notes ?? null,
      revokedAt: isRevoked ? new Date() : null,
      updatedAt: new Date(),
      updatedBy: params.actorId ?? null,
    })
    .where(eq(consents.id, params.consentId))
    .returning();

  return updated ?? null;
}
