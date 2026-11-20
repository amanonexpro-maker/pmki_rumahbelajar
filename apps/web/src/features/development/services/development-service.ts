import {
  listTeachersForServiceUnit,
  resolveTeacherForActor,
} from "@/features/academic";
import { recordDomainAuditEvent } from "@/features/audit";
import { getStudentConsentStatus } from "@/features/consent";
import {
  getStudentDetailForWorkspace,
  listStudentsForWorkspace,
} from "@/features/students";
import { getHumanErrorMessage } from "@/lib/messages";
import type { SessionUser } from "@/server/auth/session";
import { fail, ok, type ActionResult } from "@/server/contracts/result";
import {
  authorizeCreateOrUpdateDevelopment,
  authorizeReadDevelopment,
  canViewDevelopmentNoteRecord,
} from "../permissions/development-policy";
import {
  findDevelopmentCategoriesByUnit,
  findDevelopmentNotesByUnitIds,
  findNoteRevisionsByNoteId,
  upsertVersionedDevelopmentNote,
} from "../repositories/development-repository";
import type {
  DevelopmentCategoryDTO,
  DevelopmentNoteDTO,
  DevelopmentNoteRevisionDTO,
} from "../types/development-types";
import { upsertDevelopmentNoteSchema } from "../validators/development-validator";

/**
 * Development Notes Domain Application Service (11 §13, 04 §17, 05 §13–14).
 * RED-LINE BOUNDARY:
 * - Resolves student metadata via `StudentService`.
 * - Resolves teacher metadata via `AcademicService`.
 * - Resolves consent status via `ConsentService`.
 * - Filters `confidential` notes on the SERVER per actor permission & scope.
 */
export async function listDevelopmentCategories(
  serviceUnitId: string
): Promise<DevelopmentCategoryDTO[]> {
  const rows = await findDevelopmentCategoriesByUnit(serviceUnitId);
  return rows.map((r) => ({
    id: r.id,
    serviceUnitId: r.serviceUnitId,
    code: r.code,
    name: r.name,
    description: r.description,
  }));
}

export async function listDevelopmentNotesForWorkspace(
  user: SessionUser | null | undefined,
  filters: { studentId?: string; categoryId?: string } = {}
): Promise<ActionResult<DevelopmentNoteDTO[]>> {
  const authz = authorizeReadDevelopment(user);
  if (!authz.success) return authz;

  const serviceUnitIds = Array.from(
    new Set((user?.memberships ?? []).map((m) => m.serviceUnitId))
  );
  if (serviceUnitIds.length === 0) {
    return fail("SCOPE_DENIED", getHumanErrorMessage("SCOPE_DENIED"));
  }

  const studentRes = await listStudentsForWorkspace(user, { pageSize: 50 });
  const studentMap = new Map(
    (studentRes.success ? studentRes.data.items : []).map((s) => [s.id, s])
  );

  const categoryMap = new Map<string, { code: string; name: string }>();
  const teacherMap = new Map<string, string>();
  const actorTeacherByUnit = new Map<string, string>();

  for (const unitId of serviceUnitIds) {
    const [cats, teachers, actorTeacher] = await Promise.all([
      findDevelopmentCategoriesByUnit(unitId),
      listTeachersForServiceUnit(unitId),
      resolveTeacherForActor(unitId, user?.id ?? null),
    ]);
    for (const c of cats) categoryMap.set(c.id, { code: c.code, name: c.name });
    for (const t of teachers) teacherMap.set(t.id, t.name);
    if (actorTeacher && actorTeacher.userId === user?.id) {
      actorTeacherByUnit.set(unitId, actorTeacher.id);
    }
  }

  const rawNotes = await findDevelopmentNotesByUnitIds({
    serviceUnitIds,
    studentId: filters.studentId,
    categoryId: filters.categoryId,
  });

  // Server-side CONFIDENTIAL filtering (05 §13–14, Product Owner Rule #4)
  const visibleNotes = rawNotes.filter((note) =>
    canViewDevelopmentNoteRecord({
      user,
      serviceUnitId: note.serviceUnitId,
      confidential: note.confidential,
      noteTeacherId: note.teacherId,
      noteCreatedBy: note.createdBy,
      actorTeacherId: actorTeacherByUnit.get(note.serviceUnitId) ?? null,
    })
  );

  const items: DevelopmentNoteDTO[] = visibleNotes.map((note) => {
    const st = studentMap.get(note.studentId);
    const cat = categoryMap.get(note.categoryId);
    return {
      id: note.id,
      organizationId: note.organizationId,
      serviceUnitId: note.serviceUnitId,
      studentId: note.studentId,
      studentFullName: st?.fullName ?? "Peserta Didik",
      studentEducationLevelLabel: st?.educationLevelLabel ?? "Rumah Belajar",
      teacherId: note.teacherId,
      teacherName: teacherMap.get(note.teacherId) ?? "Pengajar PMKI",
      categoryId: note.categoryId,
      categoryCode: cat?.code ?? "GENERAL",
      categoryName: cat?.name ?? "Perkembangan",
      observation: note.observation,
      progress: note.progress,
      followUp: note.followUp,
      confidential: note.confidential,
      version: note.version,
      recordedOfflineAt: note.recordedOfflineAt
        ? note.recordedOfflineAt.toISOString()
        : null,
      syncedAt: note.syncedAt ? note.syncedAt.toISOString() : null,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };
  });

  return ok(items);
}

export async function listDevelopmentNoteRevisions(
  user: SessionUser | null | undefined,
  noteId: string
): Promise<ActionResult<DevelopmentNoteRevisionDTO[]>> {
  const authz = authorizeReadDevelopment(user);
  if (!authz.success) return authz;

  const revisions = await findNoteRevisionsByNoteId(noteId);
  return ok(
    revisions.map((r) => ({
      id: r.id,
      noteId: r.noteId,
      version: r.version,
      observation: r.observation,
      progress: r.progress,
      followUp: r.followUp,
      confidential: r.confidential,
      actorId: r.actorId,
      createdAt: r.createdAt.toISOString(),
    }))
  );
}

export async function upsertDevelopmentNote(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<
  ActionResult<{
    noteId: string;
    version: number;
    confidential: boolean;
    isNewRevisionOnExisting: boolean;
  }>
> {
  const parsed = upsertDevelopmentNoteSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  // Verify student existence & scope via StudentService (Cross-domain via Service ONLY)
  const studentRes = await getStudentDetailForWorkspace(
    user,
    parsed.data.studentId
  );
  if (!studentRes.success) {
    return studentRes;
  }
  const student = studentRes.data;

  const authz = authorizeCreateOrUpdateDevelopment(
    user,
    student.serviceUnitId,
    Boolean(parsed.data.noteId)
  );
  if (!authz.success) return authz;

  // Verify personal data consent via ConsentService (Cross-domain via Service ONLY)
  const consentRow = await getStudentConsentStatus(student.id);
  if (consentRow && consentRow.personalDataConsent !== "GRANTED") {
    return fail(
      "POLICY_DENIED",
      "Catatan perkembangan memerlukan persetujuan data pribadi peserta didik yang aktif."
    );
  }

  const teacherInfo = await resolveTeacherForActor(
    student.serviceUnitId,
    user?.id ?? null
  );
  if (!teacherInfo) {
    return fail(
      "RESOURCE_NOT_FOUND",
      "Profil pengajar untuk unit layanan ini belum terdaftar."
    );
  }

  const isOfflineSync = Boolean(parsed.data.isOfflineSync);
  const recordedOfflineAt = parsed.data.recordedOfflineAt
    ? new Date(parsed.data.recordedOfflineAt)
    : null;
  const syncedAt = isOfflineSync ? new Date() : null;

  const { note, isNewRevisionOnExisting } =
    await upsertVersionedDevelopmentNote({
      noteId: parsed.data.noteId ?? null,
      organizationId: student.organizationId,
      serviceUnitId: student.serviceUnitId,
      studentId: student.id,
      teacherId: teacherInfo.id,
      categoryId: parsed.data.categoryId,
      observation: parsed.data.observation,
      progress: parsed.data.progress ?? null,
      followUp: parsed.data.followUp ?? null,
      confidential: parsed.data.confidential,
      actorId: user?.id ?? null,
      recordedOfflineAt,
      syncedAt,
    });

  await recordDomainAuditEvent({
    name: "DevelopmentNoteCreated",
    organizationId: student.organizationId,
    serviceUnitId: student.serviceUnitId,
    actorId: user?.id ?? null,
    entityType: "development_note",
    entityId: note.id,
    description: isNewRevisionOnExisting
      ? `Menyimpan revisi catatan perkembangan v${note.version} untuk peserta didik ${student.fullName}.`
      : `Menambahkan catatan perkembangan baru untuk peserta didik ${student.fullName}.`,
    occurredAt: recordedOfflineAt ?? new Date(),
    metadata: {
      studentId: student.id,
      version: note.version,
      confidential: note.confidential,
      isOfflineSync,
      originalTimestamp: recordedOfflineAt?.toISOString() ?? null,
      syncedAt: syncedAt?.toISOString() ?? null,
    },
  });

  return ok({
    noteId: note.id,
    version: note.version,
    confidential: note.confidential,
    isNewRevisionOnExisting,
  });
}

