import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { db } from "@/db/client";
import {
  attendanceRecords,
  attendanceSessions,
  auditLogs,
  classes,
  developmentCategories,
  developmentNoteRevisions,
  developmentNotes,
  students,
  syncOperations,
  teachers,
  users,
} from "@/db/schema";
import { resolveAccess } from "@/features/administration";
import {
  listDevelopmentNoteRevisions,
  listDevelopmentNotesForWorkspace,
} from "@/features/development";
import type { SessionUser } from "@/server/auth/session";
import { processOfflineSyncOperation } from "@/server/sync/sync-processor";
import { insertRawAttendanceSession } from "./repositories/attendance-repository";
import { recordAttendanceSession } from "./services/attendance-service";

async function loadSessionByEmail(email: string): Promise<SessionUser> {
  const [userRow] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!userRow) {
    throw new Error(`Seeded user ${email} not found. Run npm run db:seed.`);
  }
  const access = await resolveAccess(userRow.id);
  return {
    id: userRow.id,
    email: userRow.email,
    name: access.name,
    roles: access.roles,
    permissions: access.permissions,
    memberships: access.memberships,
  };
}

describe("Fase 5 Integration — Attendance UNIQUE, Idempotent /api/sync, Conflict Server Wins, Versioned Confidential Development Notes", () => {
  let coordinatorSession!: SessionUser;
  let teacherSession!: SessionUser;
  let volunteerSession!: SessionUser;
  let seededClassId = "";
  let seededOrgId = "";
  let seededUnitId = "";
  let seededTeacherId = "";
  let seededStudentId = "";
  let seededCategoryId = "";

  const createdSessionIds: string[] = [];
  const createdNoteIds: string[] = [];
  const createdOperationIds: string[] = [];

  beforeAll(async () => {
    coordinatorSession = await loadSessionByEmail("pengurus.lawang@pmki.org");
    teacherSession = await loadSessionByEmail("guru.matematika@pmki.org");
    volunteerSession = await loadSessionByEmail("relawan.lawang@pmki.org");

    const [cls] = await db.select().from(classes).limit(1);
    const [tch] = await db.select().from(teachers).limit(1);
    const [st] = await db.select().from(students).limit(1);
    const [cat] = await db.select().from(developmentCategories).limit(1);

    if (!cls || !tch || !st || !cat) {
      throw new Error("Seeded pilot entities missing. Run npm run db:seed.");
    }

    seededClassId = cls.id;
    seededOrgId = cls.organizationId;
    seededUnitId = cls.serviceUnitId;
    seededTeacherId = tch.id;
    seededStudentId = st.id;
    seededCategoryId = cat.id;
  });

  afterAll(async () => {
    if (createdOperationIds.length > 0) {
      await db
        .delete(syncOperations)
        .where(inArray(syncOperations.operationId, createdOperationIds));
    }
    if (createdNoteIds.length > 0) {
      await db
        .delete(developmentNoteRevisions)
        .where(inArray(developmentNoteRevisions.noteId, createdNoteIds));
      await db
        .delete(developmentNotes)
        .where(inArray(developmentNotes.id, createdNoteIds));
    }
    if (createdSessionIds.length > 0) {
      await db
        .delete(attendanceRecords)
        .where(inArray(attendanceRecords.sessionId, createdSessionIds));
      await db
        .delete(attendanceSessions)
        .where(inArray(attendanceSessions.id, createdSessionIds));
    }
  });

  it("enforces PostgreSQL UNIQUE(class_id, session_date) against duplicate raw attendance sessions", async () => {
    const testDate = "2026-12-19";
    const first = await insertRawAttendanceSession({
      organizationId: seededOrgId,
      serviceUnitId: seededUnitId,
      classId: seededClassId,
      teacherId: seededTeacherId,
      sessionDate: testDate,
      notes: "Sesi Pertama",
      actorId: teacherSession.id,
    });
    createdSessionIds.push(first.id);

    await expect(
      insertRawAttendanceSession({
        organizationId: seededOrgId,
        serviceUnitId: seededUnitId,
        classId: seededClassId,
        teacherId: seededTeacherId,
        sessionDate: testDate,
        notes: "Duplikat Sesi",
        actorId: teacherSession.id,
      })
    ).rejects.toThrow();
  });

  it("enforces /api/sync idempotency (2x send = 1 effect), Server Wins + Manual Review on attendance conflict, and dual timestamps in audit_logs", async () => {
    const conflictDate = "2026-12-26";

    // 1. Online session recorded first on server: student is PRESENT
    const onlineRes = await recordAttendanceSession(teacherSession, {
      classId: seededClassId,
      sessionDate: conflictDate,
      notes: "Dicatat langsung di kelas",
      entries: [
        {
          studentId: seededStudentId,
          status: "PRESENT",
          note: "Hadir tepat waktu",
        },
      ],
    });
    expect(onlineRes.success).toBe(true);
    if (!onlineRes.success) return;
    createdSessionIds.push(onlineRes.data.sessionId);

    // 2. Offline sync operation arrives with conflicting status ABSENT ("Tidak hadir")
    const opId = `sync-att-${uuidv7()}`;
    createdOperationIds.push(opId);
    const offlineTimestamp = "2026-12-26T08:15:00.000Z";

    const firstSync = await processOfflineSyncOperation(coordinatorSession, {
      operationId: opId,
      operation: "ATTENDANCE_RECORD",
      entityType: "attendance_session",
      entityId: `${seededClassId}:${conflictDate}`,
      createdAt: offlineTimestamp,
      payload: {
        classId: seededClassId,
        sessionDate: conflictDate,
        notes: "Kiriman offline koordinator",
        entries: [
          {
            studentId: seededStudentId,
            status: "ABSENT",
            note: "Belum terlihat saat awal sesi",
          },
        ],
      },
    });

    expect(firstSync.success).toBe(true);
    if (firstSync.success) {
      expect(firstSync.data.conflictNeedsManualReview).toBe(true);
    }

    // Verify Server Wins: student's status in DB is STILL "PRESENT" and session is flagged for manual review
    const [serverRec] = await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.sessionId, onlineRes.data.sessionId));
    expect(serverRec?.status).toBe("PRESENT");

    const [serverSess] = await db
      .select()
      .from(attendanceSessions)
      .where(eq(attendanceSessions.id, onlineRes.data.sessionId));
    expect(serverSess?.notes).toContain("PERLU TINJAUAN KOORDINATOR");

    // Verify audit log recorded offline intent (originalTimestamp + syncedAt)
    const audits = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entityId, onlineRes.data.sessionId));
    const offlineAudit = audits.find(
      (a) =>
        (a.metadata as Record<string, unknown> | null)?.isOfflineSync === true
    );
    expect(offlineAudit).toBeTruthy();
    expect(
      (offlineAudit?.metadata as Record<string, unknown> | null)
        ?.originalTimestamp
    ).toBe(offlineTimestamp);
    expect(
      (offlineAudit?.metadata as Record<string, unknown> | null)?.syncedAt
    ).toBeTruthy();

    // 3. Idempotency: sending the exact same operationId a second time MUST be rejected with RESOURCE_CONFLICT
    const duplicateSync = await processOfflineSyncOperation(
      coordinatorSession,
      {
        operationId: opId,
        operation: "ATTENDANCE_RECORD",
        entityType: "attendance_session",
        entityId: `${seededClassId}:${conflictDate}`,
        createdAt: offlineTimestamp,
        payload: {
          classId: seededClassId,
          sessionDate: conflictDate,
          entries: [
            {
              studentId: seededStudentId,
              status: "ABSENT",
            },
          ],
        },
      }
    );
    expect(duplicateSync.success).toBe(false);
    if (!duplicateSync.success) {
      expect(duplicateSync.error.code).toBe("RESOURCE_CONFLICT");
    }
  });

  it("versions development notes on offline sync (no silent overwrite) and enforces server-side CONFIDENTIAL filtering", async () => {
    // 1. Coordinator creates a confidential note via offline sync -> version 1
    const opCreate = `sync-dev-1-${uuidv7()}`;
    createdOperationIds.push(opCreate);

    const createSync = await processOfflineSyncOperation(coordinatorSession, {
      operationId: opCreate,
      operation: "DEVELOPMENT_NOTE_UPSERT",
      entityType: "development_note",
      entityId: "new-note-1",
      createdAt: "2026-11-20T07:30:00.000Z",
      payload: {
        studentId: seededStudentId,
        categoryId: seededCategoryId,
        observation: "Observasi awal koordinator (rahasia v1).",
        progress: "Mulai mengenal suku kata.",
        followUp: "Pendampingan baca 15 menit.",
        confidential: true,
      },
    });
    expect(createSync.success).toBe(true);
    if (!createSync.success) return;

    const noteId = createSync.data.entityId;
    createdNoteIds.push(noteId);

    // 2. Offline revision arrives for the same noteId -> increments to version 2 & preserves revision 1
    const opUpdate = `sync-dev-2-${uuidv7()}`;
    createdOperationIds.push(opUpdate);

    const updateSync = await processOfflineSyncOperation(coordinatorSession, {
      operationId: opUpdate,
      operation: "DEVELOPMENT_NOTE_UPSERT",
      entityType: "development_note",
      entityId: noteId,
      createdAt: "2026-11-20T08:00:00.000Z",
      payload: {
        noteId,
        studentId: seededStudentId,
        categoryId: seededCategoryId,
        observation: "Observasi lanjutan koordinator (rahasia v2).",
        progress: "Sudah lancar membaca kalimat pendek.",
        followUp: "Lanjut buku cerita bergambar.",
        confidential: true,
      },
    });
    expect(updateSync.success).toBe(true);

    const revisionsRes = await listDevelopmentNoteRevisions(
      coordinatorSession,
      noteId
    );
    expect(revisionsRes.success).toBe(true);
    if (revisionsRes.success) {
      expect(revisionsRes.data.length).toBe(2);
      expect(revisionsRes.data[0]?.version).toBe(2);
      expect(revisionsRes.data[1]?.version).toBe(1);
    }

    // 3. Server-side CONFIDENTIAL filtering:
    // Regular teacher (`teacherSession`) did NOT author this note and lacks `development.review` -> filtered out!
    const teacherList = await listDevelopmentNotesForWorkspace(teacherSession, {
      studentId: seededStudentId,
    });
    expect(teacherList.success).toBe(true);
    if (teacherList.success) {
      expect(teacherList.data.some((n) => n.id === noteId)).toBe(false);
    }

    // Coordinator (`coordinatorSession`) holds `development.review` -> note is visible!
    const coordList = await listDevelopmentNotesForWorkspace(
      coordinatorSession,
      {
        studentId: seededStudentId,
      }
    );
    expect(coordList.success).toBe(true);
    if (coordList.success) {
      const found = coordList.data.find((n) => n.id === noteId);
      expect(found).toBeTruthy();
      expect(found?.version).toBe(2);
    }
  });

  it("handles session expiry, unauthorized role change, and Tier C rejection in sync processor (08 §37)", async () => {
    // Session expired (null user) -> UNAUTHORIZED
    const expiredRes = await processOfflineSyncOperation(null, {
      operationId: `sync-exp-${uuidv7()}`,
      operation: "ATTENDANCE_RECORD",
      entityType: "attendance_session",
      entityId: "test",
      createdAt: "2026-11-20T08:00:00.000Z",
      payload: {},
    });
    expect(expiredRes.success).toBe(false);
    if (!expiredRes.success) {
      expect(expiredRes.error.code).toBe("UNAUTHORIZED");
    }

    // Role without `attendance.record` (VOLUNTEER) -> PERMISSION_DENIED
    const roleDeniedRes = await processOfflineSyncOperation(volunteerSession, {
      operationId: `sync-vol-${uuidv7()}`,
      operation: "ATTENDANCE_RECORD",
      entityType: "attendance_session",
      entityId: `${seededClassId}:2026-12-27`,
      createdAt: "2026-11-20T08:00:00.000Z",
      payload: {
        classId: seededClassId,
        sessionDate: "2026-12-27",
        entries: [{ studentId: seededStudentId, status: "PRESENT" }],
      },
    });
    expect(roleDeniedRes.success).toBe(false);
    if (!roleDeniedRes.success) {
      expect(roleDeniedRes.error.code).toBe("PERMISSION_DENIED");
    }

    // Tier C operation attempted over /api/sync -> VALIDATION_FAILED
    const tierCRes = await processOfflineSyncOperation(coordinatorSession, {
      operationId: `sync-tierc-${uuidv7()}`,
      operation: "REPORT_APPROVE",
      entityType: "report",
      entityId: "rep-1",
      createdAt: "2026-11-20T08:00:00.000Z",
      payload: {},
    });
    expect(tierCRes.success).toBe(false);
    if (!tierCRes.success) {
      expect(tierCRes.error.code).toBe("VALIDATION_FAILED");
    }
  });
});

