import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  developmentCategories,
  developmentNoteRevisions,
  developmentNotes,
} from "@/db/schema";

/**
 * Development Domain Repository (11 §13, §24).
 * STRICT BOUNDARY: Only queries `development_categories`, `development_notes`,
 * and `development_note_revisions`. Never queries `students`, `teachers`, or `consents`.
 */
export async function findDevelopmentCategoriesByUnit(serviceUnitId: string) {
  return db
    .select()
    .from(developmentCategories)
    .where(
      and(
        eq(developmentCategories.serviceUnitId, serviceUnitId),
        isNull(developmentCategories.archivedAt)
      )
    )
    .orderBy(developmentCategories.name);
}

export async function findDevelopmentNoteById(noteId: string) {
  const [row] = await db
    .select()
    .from(developmentNotes)
    .where(
      and(
        eq(developmentNotes.id, noteId),
        isNull(developmentNotes.archivedAt)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function findDevelopmentNotesByUnitIds(params: {
  serviceUnitIds: string[];
  studentId?: string;
  categoryId?: string;
}) {
  if (params.serviceUnitIds.length === 0) return [];
  const conditions = [
    inArray(developmentNotes.serviceUnitId, params.serviceUnitIds),
    isNull(developmentNotes.archivedAt),
  ];
  if (params.studentId && params.studentId !== "ALL") {
    conditions.push(eq(developmentNotes.studentId, params.studentId));
  }
  if (params.categoryId && params.categoryId !== "ALL") {
    conditions.push(eq(developmentNotes.categoryId, params.categoryId));
  }

  return db
    .select()
    .from(developmentNotes)
    .where(and(...conditions))
    .orderBy(desc(developmentNotes.updatedAt), desc(developmentNotes.createdAt));
}

export async function findNoteRevisionsByNoteId(noteId: string) {
  return db
    .select()
    .from(developmentNoteRevisions)
    .where(eq(developmentNoteRevisions.noteId, noteId))
    .orderBy(desc(developmentNoteRevisions.version));
}

/**
 * Versioned Create/Update for Development Notes (U-05 B-lite, 06 §14).
 * Never overwrites silently: every creation or update increments `version`
 * and appends an immutable snapshot to `development_note_revisions`.
 */
export async function upsertVersionedDevelopmentNote(params: {
  noteId?: string | null;
  organizationId: string;
  serviceUnitId: string;
  studentId: string;
  teacherId: string;
  categoryId: string;
  observation: string;
  progress?: string | null;
  followUp?: string | null;
  confidential: boolean;
  actorId?: string | null;
  recordedOfflineAt?: Date | null;
  syncedAt?: Date | null;
}) {
  return db.transaction(async (tx) => {
    if (params.noteId) {
      const [existing] = await tx
        .select()
        .from(developmentNotes)
        .where(eq(developmentNotes.id, params.noteId))
        .limit(1);

      if (existing) {
        const nextVersion = existing.version + 1;
        const [updated] = await tx
          .update(developmentNotes)
          .set({
            categoryId: params.categoryId,
            observation: params.observation,
            progress: params.progress ?? null,
            followUp: params.followUp ?? null,
            confidential: params.confidential,
            version: nextVersion,
            recordedOfflineAt:
              params.recordedOfflineAt ?? existing.recordedOfflineAt,
            syncedAt: params.syncedAt ?? existing.syncedAt,
            updatedAt: new Date(),
            updatedBy: params.actorId ?? null,
          })
          .where(eq(developmentNotes.id, existing.id))
          .returning();

        await tx.insert(developmentNoteRevisions).values({
          noteId: existing.id,
          version: nextVersion,
          observation: params.observation,
          progress: params.progress ?? null,
          followUp: params.followUp ?? null,
          confidential: params.confidential,
          actorId: params.actorId ?? null,
        });

        return { note: updated, isNewRevisionOnExisting: true };
      }
    }

    const [created] = await tx
      .insert(developmentNotes)
      .values({
        organizationId: params.organizationId,
        serviceUnitId: params.serviceUnitId,
        studentId: params.studentId,
        teacherId: params.teacherId,
        categoryId: params.categoryId,
        observation: params.observation,
        progress: params.progress ?? null,
        followUp: params.followUp ?? null,
        confidential: params.confidential,
        version: 1,
        recordedOfflineAt: params.recordedOfflineAt ?? null,
        syncedAt: params.syncedAt ?? null,
        createdBy: params.actorId ?? null,
        updatedBy: params.actorId ?? null,
      })
      .returning();

    await tx.insert(developmentNoteRevisions).values({
      noteId: created.id,
      version: 1,
      observation: params.observation,
      progress: params.progress ?? null,
      followUp: params.followUp ?? null,
      confidential: params.confidential,
      actorId: params.actorId ?? null,
    });

    return { note: created, isNewRevisionOnExisting: false };
  });
}

