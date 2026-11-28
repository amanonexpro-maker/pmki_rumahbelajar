import {
  listTeachersForServiceUnit,
  resolveTeacherForActor,
} from "@/features/academic";
import { recordAuditLog, recordDomainAuditEvent } from "@/features/audit";
import { getStudentConsentStatus } from "@/features/consent";
import { getUserNamesByIds } from "@/features/identity";
import { createSimplePdf } from "@/lib/pdf-builder";
import { formatDateID } from "@/utils/date-formatter";
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
  const actorIds = Array.from(
    new Set(
      revisions
        .map((r) => r.actorId)
        .filter((id): id is string => Boolean(id))
    )
  );
  const actorNameMap =
    actorIds.length > 0
      ? await getUserNamesByIds(actorIds)
      : new Map<string, string>();

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
      actorName: r.actorId ? (actorNameMap.get(r.actorId) ?? null) : null,
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

/**
 * Generates an on-the-fly PDF summary of non-confidential development notes
 * for a single student, intended for sharing with parents/guardians (e.g. via WhatsApp).
 * STRICT PRIVACY: Excludes all `confidential === true` notes and requires active personal data consent.
 */
export async function generateStudentDevelopmentSummaryPdf(
  user: SessionUser | null | undefined,
  studentId: string,
  options?: { checkOnly?: boolean }
): Promise<ActionResult<{ bytes: Uint8Array; filename: string }>> {
  const authz = authorizeReadDevelopment(user);
  if (!authz.success) return authz;

  if (!studentId || studentId === "ALL") {
    return fail(
      "VALIDATION_FAILED",
      "Pilih satu peserta didik terlebih dahulu untuk membuat ringkasan PDF."
    );
  }

  const [studentRes, consentRow] = await Promise.all([
    getStudentDetailForWorkspace(user, studentId),
    getStudentConsentStatus(studentId),
  ]);
  if (!studentRes.success) return studentRes;
  const student = studentRes.data;

  if (consentRow && consentRow.personalDataConsent !== "GRANTED") {
    return fail(
      "POLICY_DENIED",
      "Ringkasan perkembangan memerlukan persetujuan data pribadi peserta didik yang aktif."
    );
  }

  const [rawNotes, categories, teachers] = await Promise.all([
    findDevelopmentNotesByUnitIds({
      serviceUnitIds: [student.serviceUnitId],
      studentId: student.id,
    }),
    findDevelopmentCategoriesByUnit(student.serviceUnitId),
    listTeachersForServiceUnit(student.serviceUnitId),
  ]);

  // Strict privacy guard: NEVER export confidential notes to parent/guardian summary PDF
  const publicNotes = rawNotes.filter((n) => !n.confidential);
  if (publicNotes.length === 0) {
    return fail(
      "RESOURCE_NOT_FOUND",
      "Belum ada catatan perkembangan non-rahasia untuk peserta didik ini yang dapat dibagikan ke orang tua/wali."
    );
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t.name]));
  const printedAt = new Date();

  const pdf = createSimplePdf();
  pdf.addText("Ringkasan Perkembangan Peserta Didik", {
    fontSize: 16,
    bold: true,
    gapAfter: 2,
  });
  pdf.addText("Rumah Belajar PMKI - Laporan Singkat Orang Tua / Wali", {
    fontSize: 10,
    muted: true,
    gapAfter: 10,
  });
  pdf.addDivider(10);

  pdf.addText(`Nama peserta didik: ${student.fullName}`, {
    fontSize: 11,
    bold: true,
    gapAfter: 2,
  });
  pdf.addText(`Jenjang: ${student.educationLevelLabel}`, {
    fontSize: 10,
    muted: true,
    gapAfter: 2,
  });
  const publisherName =
    user?.name?.trim() || user?.email || "Pengajar PMKI";

  pdf.addText(`Tanggal cetak: ${formatDateID(printedAt)}`, {
    fontSize: 10,
    muted: true,
    gapAfter: 2,
  });
  pdf.addText(`Diterbitkan oleh: ${publisherName}`, {
    fontSize: 10,
    muted: true,
    gapAfter: 10,
  });
  pdf.addDivider(12);

  for (const note of publicNotes) {
    const categoryName = categoryMap.get(note.categoryId) ?? "Perkembangan";
    const teacherName = teacherMap.get(note.teacherId) ?? "Pengajar PMKI";
    const noteDate = formatDateID(note.updatedAt);

    pdf.addText(`${categoryName} (v${note.version}) - ${noteDate}`, {
      fontSize: 11,
      bold: true,
      gapAfter: 2,
    });
    pdf.addText(`Pengajar: ${teacherName}`, {
      fontSize: 9,
      muted: true,
      gapAfter: 4,
    });
    pdf.addText(`Pengamatan: ${note.observation}`, {
      fontSize: 10,
      gapAfter: 3,
    });
    if (note.progress) {
      pdf.addText(`Kemajuan: ${note.progress}`, {
        fontSize: 10,
        gapAfter: 3,
      });
    }
    if (note.followUp) {
      pdf.addText(`Tindak lanjut: ${note.followUp}`, {
        fontSize: 10,
        gapAfter: 6,
      });
    }
    pdf.addDivider(10);
  }

  const slug = student.fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const datePart = printedAt.toISOString().slice(0, 10);
  const filename = `perkembangan-${slug || "peserta-didik"}-${datePart}.pdf`;

  if (options?.checkOnly) {
    return ok({
      bytes: new Uint8Array(),
      filename,
    });
  }

  await recordAuditLog({
    organizationId: student.organizationId,
    serviceUnitId: student.serviceUnitId,
    actorId: user?.id ?? null,
    action: "DEVELOPMENT_SUMMARY_PDF_EXPORTED",
    entityType: "student",
    entityId: student.id,
    description: `Mengekspor ringkasan perkembangan PDF non-rahasia untuk peserta didik ${student.fullName}.`,
    metadata: {
      noteCount: publicNotes.length,
    },
  });

  return ok({
    bytes: pdf.build(),
    filename,
  });
}

