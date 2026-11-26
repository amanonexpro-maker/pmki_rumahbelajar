import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { attendanceRecords, attendanceSessions } from "@/db/schema";
import type { AttendanceStatus } from "@/lib/status";

/**
 * Attendance Domain Repository (11 §12, §24).
 * STRICT BOUNDARY: Only queries `attendance_sessions` and `attendance_records`.
 * Never imports or queries tables from `academic`, `students`, or any other domain.
 */
export async function findSessionByClassAndDate(
  classId: string,
  sessionDate: string
) {
  const [row] = await db
    .select()
    .from(attendanceSessions)
    .where(
      and(
        eq(attendanceSessions.classId, classId),
        eq(attendanceSessions.sessionDate, sessionDate),
        isNull(attendanceSessions.archivedAt)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function findRecordsBySessionId(sessionId: string) {
  return db
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.sessionId, sessionId));
}

export async function findSessionsByClassIdsAndDate(
  classIds: string[],
  sessionDate: string
) {
  if (classIds.length === 0) return [];
  return db
    .select()
    .from(attendanceSessions)
    .where(
      and(
        inArray(attendanceSessions.classId, classIds),
        eq(attendanceSessions.sessionDate, sessionDate),
        isNull(attendanceSessions.archivedAt)
      )
    );
}

export async function findRecordsBySessionIds(sessionIds: string[]) {
  if (sessionIds.length === 0) return [];
  return db
    .select()
    .from(attendanceRecords)
    .where(inArray(attendanceRecords.sessionId, sessionIds));
}

export async function findRecentSessionsByUnitIds(
  serviceUnitIds: string[],
  classId?: string
) {
  if (serviceUnitIds.length === 0) return [];
  const conditions = [
    inArray(attendanceSessions.serviceUnitId, serviceUnitIds),
    isNull(attendanceSessions.archivedAt),
  ];
  if (classId && classId !== "ALL") {
    conditions.push(eq(attendanceSessions.classId, classId));
  }

  return db
    .select()
    .from(attendanceSessions)
    .where(and(...conditions))
    .orderBy(
      desc(attendanceSessions.sessionDate),
      desc(attendanceSessions.updatedAt)
    )
    .limit(30);
}

export async function insertRawAttendanceSession(params: {
  organizationId: string;
  serviceUnitId: string;
  classId: string;
  teacherId: string;
  sessionDate: string;
  notes?: string | null;
  actorId?: string | null;
}) {
  const [created] = await db
    .insert(attendanceSessions)
    .values({
      organizationId: params.organizationId,
      serviceUnitId: params.serviceUnitId,
      classId: params.classId,
      teacherId: params.teacherId,
      sessionDate: params.sessionDate,
      notes: params.notes ?? null,
      createdBy: params.actorId ?? null,
      updatedBy: params.actorId ?? null,
    })
    .returning();
  return created;
}

export async function upsertAttendanceSessionAndRecords(params: {
  organizationId: string;
  serviceUnitId: string;
  classId: string;
  teacherId: string;
  sessionDate: string;
  notes?: string | null;
  entries: Array<{
    studentId: string;
    status: AttendanceStatus;
    note?: string | null;
  }>;
  actorId?: string | null;
  recordedOfflineAt?: Date | null;
  syncedAt?: Date | null;
  /** When true (06 §14): server wins on existing records & marks session for manual review */
  preserveExistingOnConflict?: boolean;
}): Promise<{
  sessionId: string;
  recordedCount: number;
  conflictNeedsManualReview: boolean;
}> {
  return db.transaction(async (tx) => {
    const [existingSession] = await tx
      .select()
      .from(attendanceSessions)
      .where(
        and(
          eq(attendanceSessions.classId, params.classId),
          eq(attendanceSessions.sessionDate, params.sessionDate)
        )
      )
      .limit(1);

    let sessionId: string;
    let conflictNeedsManualReview = false;

    if (!existingSession) {
      const [created] = await tx
        .insert(attendanceSessions)
        .values({
          organizationId: params.organizationId,
          serviceUnitId: params.serviceUnitId,
          classId: params.classId,
          teacherId: params.teacherId,
          sessionDate: params.sessionDate,
          notes: params.notes ?? null,
          createdBy: params.actorId ?? null,
          updatedBy: params.actorId ?? null,
        })
        .returning();
      sessionId = created.id;
    } else {
      sessionId = existingSession.id;
      const existingRecords = await tx
        .select()
        .from(attendanceRecords)
        .where(eq(attendanceRecords.sessionId, sessionId));

      const existingByStudent = new Map(
        existingRecords.map((r) => [r.studentId, r])
      );

      if (params.preserveExistingOnConflict && existingRecords.length > 0) {
        // Check if incoming offline entries differ from already-committed server records
        for (const entry of params.entries) {
          const serverRec = existingByStudent.get(entry.studentId);
          if (serverRec && serverRec.status !== entry.status) {
            conflictNeedsManualReview = true;
            break;
          }
        }
      }

      const conflictTag =
        "[PERLU TINJAUAN KOORDINATOR: Konflik sinkronisasi offline — data server dipertahankan]";
      const nextNotes = conflictNeedsManualReview
        ? existingSession.notes?.includes(conflictTag)
          ? existingSession.notes
          : [existingSession.notes, conflictTag].filter(Boolean).join(" | ")
        : (params.notes ?? existingSession.notes);

      await tx
        .update(attendanceSessions)
        .set({
          notes: nextNotes,
          updatedAt: new Date(),
          updatedBy: params.actorId ?? null,
        })
        .where(eq(attendanceSessions.id, sessionId));

      if (conflictNeedsManualReview) {
        // Server Wins (06 §14): only insert records for students not yet recorded on server
        let insertedCount = 0;
        for (const entry of params.entries) {
          if (existingByStudent.has(entry.studentId)) {
            continue;
          }
          await tx.insert(attendanceRecords).values({
            sessionId,
            studentId: entry.studentId,
            status: entry.status,
            note: entry.note ?? null,
            recordedOfflineAt: params.recordedOfflineAt ?? null,
            syncedAt: params.syncedAt ?? null,
            createdBy: params.actorId ?? null,
            updatedBy: params.actorId ?? null,
          });
          insertedCount += 1;
        }
        return {
          sessionId,
          recordedCount: existingRecords.length + insertedCount,
          conflictNeedsManualReview: true,
        };
      }
    }

    // Normal online or non-conflicting upsert
    for (const entry of params.entries) {
      await tx
        .insert(attendanceRecords)
        .values({
          sessionId,
          studentId: entry.studentId,
          status: entry.status,
          note: entry.note ?? null,
          recordedOfflineAt: params.recordedOfflineAt ?? null,
          syncedAt: params.syncedAt ?? null,
          createdBy: params.actorId ?? null,
          updatedBy: params.actorId ?? null,
        })
        .onConflictDoUpdate({
          target: [attendanceRecords.sessionId, attendanceRecords.studentId],
          set: {
            status: entry.status,
            note: entry.note ?? null,
            recordedOfflineAt: params.recordedOfflineAt ?? null,
            syncedAt: params.syncedAt ?? null,
            updatedAt: new Date(),
            updatedBy: params.actorId ?? null,
          },
        });
    }

    return {
      sessionId,
      recordedCount: params.entries.length,
      conflictNeedsManualReview: false,
    };
  });
}

