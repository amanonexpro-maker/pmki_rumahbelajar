import {
  getClassSummaryById,
  listClassesForServiceUnit,
  resolveTeacherForActor,
} from "@/features/academic";
import { recordDomainAuditEvent } from "@/features/audit";
import { listStudentsForWorkspace } from "@/features/students";
import { getHumanErrorMessage } from "@/lib/messages";
import type { AttendanceStatus } from "@/lib/status";
import type { SessionUser } from "@/server/auth/session";
import { fail, ok, type ActionResult } from "@/server/contracts/result";
import {
  authorizeReadAttendance,
  authorizeRecordAttendance,
} from "../permissions/attendance-policy";
import {
  findRecentSessionsByUnitIds,
  findRecordsBySessionId,
  findRecordsBySessionIds,
  findSessionByClassAndDate,
  findSessionsByClassIdsAndDate,
  upsertAttendanceSessionAndRecords,
} from "../repositories/attendance-repository";
import type {
  AttendanceRecordItemDTO,
  AttendanceSessionDetailDTO,
  AttendanceSessionHistoryItemDTO,
  QuickAttendanceRosterItemDTO,
  QuickAttendanceWorkspaceViewDTO,
  RecordAttendanceSessionResultDTO,
  RecordQuickAttendanceResultDTO,
} from "../types/attendance-types";
import {
  recordAttendanceSessionSchema,
  recordQuickAttendanceSchema,
} from "../validators/attendance-validator";

/**
 * Attendance Domain Application Service (11 §12, 06 §10, §14).
 * RED-LINE BOUNDARY: Fetches class metadata via `AcademicService` and active student
 * roster via `StudentService`. Never queries `classes` or `students` tables directly.
 */
export async function getAttendanceSessionWorkspaceView(
  user: SessionUser | null | undefined,
  params: { classId: string; sessionDate: string }
): Promise<ActionResult<AttendanceSessionDetailDTO>> {
  const classSummary = await getClassSummaryById(params.classId);
  if (!classSummary) {
    return fail("RESOURCE_NOT_FOUND", "Kelas tidak ditemukan.");
  }

  const authz = authorizeReadAttendance(user, classSummary.serviceUnitId);
  if (!authz.success) return authz;

  const [teacherInfo, rosterRes, existingSession] = await Promise.all([
    resolveTeacherForActor(classSummary.serviceUnitId, user?.id ?? null),
    listStudentsForWorkspace(user, {
      classId: classSummary.id,
      status: "ACTIVE",
      pageSize: 50,
    }),
    findSessionByClassAndDate(classSummary.id, params.sessionDate),
  ]);

  if (!rosterRes.success) {
    return rosterRes;
  }

  const existingRecords = existingSession
    ? await findRecordsBySessionId(existingSession.id)
    : [];
  const recordByStudentId = new Map(
    existingRecords.map((r) => [r.studentId, r])
  );

  const roster: AttendanceRecordItemDTO[] = rosterRes.data.items.map((st) => {
    const rec = recordByStudentId.get(st.id);
    return {
      id: rec?.id,
      studentId: st.id,
      studentFullName: st.fullName,
      studentNickname: st.nickname,
      registrationNumber: st.registrationNumber,
      educationLevelLabel: st.educationLevelLabel,
      status: (rec?.status as AttendanceStatus) ?? "PRESENT",
      note: rec?.note ?? null,
      recordedOfflineAt: rec?.recordedOfflineAt
        ? rec.recordedOfflineAt.toISOString()
        : null,
      syncedAt: rec?.syncedAt ? rec.syncedAt.toISOString() : null,
    };
  });

  const presentCount = roster.filter((r) => r.status === "PRESENT").length;
  const permittedCount = roster.filter((r) => r.status === "PERMITTED").length;
  const sickCount = roster.filter((r) => r.status === "SICK").length;
  const absentCount = roster.filter((r) => r.status === "ABSENT").length;

  return ok({
    sessionId: existingSession?.id ?? null,
    organizationId: classSummary.organizationId,
    serviceUnitId: classSummary.serviceUnitId,
    classId: classSummary.id,
    className: classSummary.name,
    teacherId: teacherInfo?.id ?? "",
    teacherName:
      teacherInfo?.name ?? classSummary.mainTeacherName ?? "Pengajar PMKI",
    sessionDate: params.sessionDate,
    notes: existingSession?.notes ?? null,
    needsManualReview: Boolean(
      existingSession?.notes?.includes("PERLU TINJAUAN KOORDINATOR")
    ),
    roster,
    summary: {
      total: roster.length,
      recorded: existingSession ? existingRecords.length : roster.length,
      presentCount,
      permittedCount,
      sickCount,
      absentCount,
    },
  });
}

export async function recordAttendanceSession(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<ActionResult<RecordAttendanceSessionResultDTO>> {
  const parsed = recordAttendanceSessionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const classSummary = await getClassSummaryById(parsed.data.classId);
  if (!classSummary) {
    return fail("RESOURCE_NOT_FOUND", "Kelas tidak ditemukan.");
  }

  const authz = authorizeRecordAttendance(user, classSummary.serviceUnitId);
  if (!authz.success) return authz;

  const teacherInfo = await resolveTeacherForActor(
    classSummary.serviceUnitId,
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

  const result = await upsertAttendanceSessionAndRecords({
    organizationId: classSummary.organizationId,
    serviceUnitId: classSummary.serviceUnitId,
    classId: classSummary.id,
    teacherId: teacherInfo.id,
    sessionDate: parsed.data.sessionDate,
    notes: parsed.data.notes ?? null,
    entries: parsed.data.entries.map((e) => ({
      studentId: e.studentId,
      status: e.status,
      note: e.note ?? null,
    })),
    actorId: user?.id ?? null,
    recordedOfflineAt,
    syncedAt,
    preserveExistingOnConflict: isOfflineSync,
  });

  await recordDomainAuditEvent({
    name: "AttendanceRecorded",
    organizationId: classSummary.organizationId,
    serviceUnitId: classSummary.serviceUnitId,
    actorId: user?.id ?? null,
    entityType: "attendance_session",
    entityId: result.sessionId,
    description: result.conflictNeedsManualReview
      ? `Sinkronisasi presensi kelas ${classSummary.name} (${parsed.data.sessionDate}) mendeteksi konflik — data server dipertahankan & ditandai untuk tinjauan koordinator.`
      : `Mencatat presensi kelas ${classSummary.name} pada tanggal ${parsed.data.sessionDate} (${result.recordedCount} peserta didik).`,
    occurredAt: recordedOfflineAt ?? new Date(),
    metadata: {
      classId: classSummary.id,
      className: classSummary.name,
      sessionDate: parsed.data.sessionDate,
      recordedCount: result.recordedCount,
      isOfflineSync,
      originalTimestamp: recordedOfflineAt?.toISOString() ?? null,
      syncedAt: syncedAt?.toISOString() ?? null,
      conflictNeedsManualReview: result.conflictNeedsManualReview,
    },
  });

  return ok({
    sessionId: result.sessionId,
    classId: classSummary.id,
    sessionDate: parsed.data.sessionDate,
    recordedCount: result.recordedCount,
    conflictNeedsManualReview: result.conflictNeedsManualReview,
  });
}

export async function listAttendanceSessionHistory(
  user: SessionUser | null | undefined,
  classId?: string
): Promise<ActionResult<AttendanceSessionHistoryItemDTO[]>> {
  const authz = authorizeReadAttendance(user);
  if (!authz.success) return authz;

  const serviceUnitIds = Array.from(
    new Set((user?.memberships ?? []).map((m) => m.serviceUnitId))
  );
  if (serviceUnitIds.length === 0) {
    return fail("SCOPE_DENIED", getHumanErrorMessage("SCOPE_DENIED"));
  }

  const classNameById = new Map<string, string>();
  for (const unitId of serviceUnitIds) {
    const unitClasses = await listClassesForServiceUnit(unitId);
    for (const c of unitClasses) classNameById.set(c.id, c.name);
  }

  const sessions = await findRecentSessionsByUnitIds(serviceUnitIds, classId);
  const items: AttendanceSessionHistoryItemDTO[] = [];

  for (const sess of sessions) {
    const records = await findRecordsBySessionId(sess.id);
    items.push({
      id: sess.id,
      classId: sess.classId,
      className: classNameById.get(sess.classId) ?? "Kelas",
      sessionDate: sess.sessionDate,
      notes: sess.notes,
      needsManualReview: Boolean(
        sess.notes?.includes("PERLU TINJAUAN KOORDINATOR")
      ),
      totalRecorded: records.length,
      presentCount: records.filter((r) => r.status === "PRESENT").length,
      permittedCount: records.filter((r) => r.status === "PERMITTED").length,
      sickCount: records.filter((r) => r.status === "SICK").length,
      absentCount: records.filter((r) => r.status === "ABSENT").length,
      updatedAt: sess.updatedAt.toISOString(),
    });
  }

  return ok(items);
}

/**
 * Loads active students across all classes in the user's service units for
 * cross-class quick attendance check-in on a given `sessionDate`.
 */
export async function getQuickAttendanceRosterView(
  user: SessionUser | null | undefined,
  params: { sessionDate: string }
): Promise<ActionResult<QuickAttendanceWorkspaceViewDTO>> {
  const authz = authorizeReadAttendance(user);
  if (!authz.success) return authz;

  const serviceUnitIds = Array.from(
    new Set((user?.memberships ?? []).map((m) => m.serviceUnitId))
  );
  if (serviceUnitIds.length === 0) {
    return fail("SCOPE_DENIED", getHumanErrorMessage("SCOPE_DENIED"));
  }

  const classNameById = new Map<string, string>();
  for (const unitId of serviceUnitIds) {
    const unitClasses = await listClassesForServiceUnit(unitId);
    for (const c of unitClasses) classNameById.set(c.id, c.name);
  }

  const studentsRes = await listStudentsForWorkspace(user, {
    status: "ACTIVE",
    sortBy: "name",
    sortDir: "asc",
    pageSize: 50,
  });
  if (!studentsRes.success) return studentsRes;

  const activeInClass = studentsRes.data.items.filter((st) =>
    Boolean(st.assignedClassId)
  );
  const classIds = Array.from(
    new Set(
      activeInClass
        .map((st) => st.assignedClassId)
        .filter((id): id is string => Boolean(id))
    )
  );

  const sessions = await findSessionsByClassIdsAndDate(
    classIds,
    params.sessionDate
  );
  const records = await findRecordsBySessionIds(sessions.map((s) => s.id));
  const recordByStudentId = new Map(records.map((r) => [r.studentId, r]));

  const items: QuickAttendanceRosterItemDTO[] = activeInClass.map((st) => {
    const rec = recordByStudentId.get(st.id);
    const classId = st.assignedClassId!;
    return {
      studentId: st.id,
      studentFullName: st.fullName,
      studentNickname: st.nickname,
      registrationNumber: st.registrationNumber,
      educationLevelLabel: st.educationLevelLabel,
      classId,
      className:
        st.assignedClassName ?? classNameById.get(classId) ?? "Kelas",
      recordedStatus: (rec?.status as AttendanceStatus) ?? null,
      note: rec?.note ?? null,
      hasExistingRecord: Boolean(rec),
    };
  });

  return ok({
    sessionDate: params.sessionDate,
    items,
  });
}

/**
 * Incremental cross-class check-in (Opsi B):
 * Groups touched student entries by `classId` and updates only those students
 * without overwriting existing records of other students in the same class.
 */
export async function recordQuickAttendanceBatch(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<ActionResult<RecordQuickAttendanceResultDTO>> {
  const parsed = recordQuickAttendanceSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const entriesByClass = new Map<
    string,
    Array<{ studentId: string; status: AttendanceStatus; note?: string | null }>
  >();

  for (const entry of parsed.data.entries) {
    const list = entriesByClass.get(entry.classId) ?? [];
    list.push({
      studentId: entry.studentId,
      status: entry.status,
      note: entry.note ?? null,
    });
    entriesByClass.set(entry.classId, list);
  }

  let totalRecorded = 0;
  let anyConflict = false;

  for (const [classId, entries] of entriesByClass.entries()) {
    const res = await recordAttendanceSession(user, {
      classId,
      sessionDate: parsed.data.sessionDate,
      entries,
      recordedOfflineAt: parsed.data.recordedOfflineAt ?? null,
      isOfflineSync: parsed.data.isOfflineSync,
    });
    if (!res.success) return res;
    totalRecorded += entries.length;
    if (res.data.conflictNeedsManualReview) {
      anyConflict = true;
    }
  }

  return ok({
    sessionDate: parsed.data.sessionDate,
    recordedCount: totalRecorded,
    classCount: entriesByClass.size,
    conflictNeedsManualReview: anyConflict,
  });
}

