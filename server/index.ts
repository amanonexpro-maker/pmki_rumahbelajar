import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import pg, { type PoolClient } from 'pg';
import type { StorageSnapshot } from '../src/services/storage.ts';
import type { AttendanceSession, ServiceReport } from '../src/types/index.ts';

const { Pool } = pg;
pg.types.setTypeParser(1082, (value) => value);
const pool = new Pool({
  host: process.env.SQL_HOST || '127.0.0.1',
  port: Number(process.env.SQL_PORT || 5432),
  database: process.env.SQL_DB_NAME || 'pmki_terpadu',
  user: process.env.SQL_ADMIN_USER || 'pmki_admin',
  password: process.env.SQL_ADMIN_PASSWORD,
});
const app = express();
const snapshotFields: (keyof StorageSnapshot)[] = [
  'users',
  'organizations',
  'serviceUnits',
  'academicYears',
  'subjects',
  'teachers',
  'classes',
  'schedules',
  'students',
  'consents',
  'mediaAssets',
  'attendanceSessions',
  'developmentNotes',
  'publications',
  'reports',
  'auditLogs',
];

function isStorageSnapshot(value: unknown): value is StorageSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Record<string, unknown>;
  return snapshotFields.every((field) => Array.isArray(snapshot[field]))
    && Boolean(snapshot.currentUser && typeof snapshot.currentUser === 'object')
    && typeof (snapshot.currentUser as { id?: unknown }).id === 'string';
}

function dateOnly(value: string | undefined) {
  return value ? value.slice(0, 10) : null;
}

function timestamp(value: Date | string | null) {
  if (value === null) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

async function insertMany(
  client: PoolClient,
  table: string,
  columns: string[],
  rows: unknown[][],
) {
  const chunkSize = Math.max(1, Math.floor(60000 / columns.length));
  for (let offset = 0; offset < rows.length; offset += chunkSize) {
    const chunk = rows.slice(offset, offset + chunkSize);
    const values: unknown[] = [];
    const tuples = chunk.map((row, rowIndex) => {
      const placeholders = row.map((value, columnIndex) => {
        values.push(value);
        return `$${rowIndex * columns.length + columnIndex + 1}`;
      });
      return `(${placeholders.join(', ')})`;
    });
    await client.query(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${tuples.join(', ')}`,
      values,
    );
  }
}

async function persistSnapshot(client: PoolClient, snapshot: StorageSnapshot) {
  await client.query(`
    TRUNCATE TABLE
      application_settings, audit_logs, report_approval_logs, service_reports,
      publication_posts, media_assets, student_development_notes, attendance_records,
      attendance_sessions, consents, students, guardians, class_schedules, classes,
      teacher_subjects, teachers, subjects, academic_years, users,
      service_unit_contacts, service_unit_sub_districts, service_units, organizations
    CASCADE
  `);

  await insertMany(client, 'organizations',
    ['id', 'name', 'code', 'level', 'parent_id', 'address', 'contact_email', 'contact_phone', 'position'],
    snapshot.organizations.map((item, position) => [
      item.id, item.name, item.code, item.level, item.parentId ?? null,
      item.address, item.contactEmail, item.contactPhone, position,
    ]));

  await insertMany(client, 'service_units',
    ['id', 'organization_id', 'name', 'code', 'type', 'headline', 'slogan', 'location', 'active', 'position'],
    snapshot.serviceUnits.map((item, position) => [
      item.id, item.organizationId, item.name, item.code, item.type,
      item.headline, item.slogan, item.location, item.active, position,
    ]));
  await insertMany(client, 'service_unit_sub_districts',
    ['service_unit_id', 'name', 'position'],
    snapshot.serviceUnits.flatMap((unit) => unit.subDistricts.map((name, position) => [
      unit.id, name, position,
    ])));
  await insertMany(client, 'service_unit_contacts',
    ['service_unit_id', 'name', 'phone', 'role', 'position'],
    snapshot.serviceUnits.flatMap((unit) => unit.contactPersons.map((contact, position) => [
      unit.id, contact.name, contact.phone, contact.role, position,
    ])));

  await insertMany(client, 'users',
    ['id', 'name', 'email', 'role', 'organization_id', 'service_unit_id', 'active', 'avatar_url', 'last_login_at', 'position'],
    snapshot.users.map((item, position) => [
      item.id, item.name, item.email, item.role, item.organizationId,
      item.serviceUnitId ?? null, item.active, item.avatarUrl ?? null,
      item.lastLoginAt ?? null, position,
    ]));

  await insertMany(client, 'academic_years',
    ['id', 'name', 'is_active', 'start_date', 'end_date', 'position'],
    snapshot.academicYears.map((item, position) => [
      item.id, item.name, item.isActive, dateOnly(item.startDate), dateOnly(item.endDate), position,
    ]));
  await insertMany(client, 'subjects',
    ['id', 'code', 'name', 'description', 'target_focus', 'position'],
    snapshot.subjects.map((item, position) => [
      item.id, item.code, item.name, item.description, item.targetFocus, position,
    ]));
  await insertMany(client, 'teachers',
    ['id', 'full_name', 'phone', 'email', 'origin_school', 'is_coordinator', 'position'],
    snapshot.teachers.map((item, position) => [
      item.id, item.fullName, item.phone, item.email, item.originSchool,
      item.isCoordinator ?? null, position,
    ]));
  await insertMany(client, 'teacher_subjects',
    ['teacher_id', 'subject_name', 'position'],
    snapshot.teachers.flatMap((teacher) => teacher.subjects.map((name, position) => [
      teacher.id, name, position,
    ])));
  await insertMany(client, 'classes',
    ['id', 'name', 'category', 'capacity', 'enrolled_count', 'room_name', 'main_teacher_id', 'position'],
    snapshot.classes.map((item, position) => [
      item.id, item.name, item.category, item.capacity, item.enrolledCount,
      item.roomName, item.mainTeacherId, position,
    ]));
  await insertMany(client, 'class_schedules',
    ['id', 'day_of_week', 'time_start', 'time_end', 'class_id', 'subject_id', 'teacher_id', 'location', 'position'],
    snapshot.schedules.map((item, position) => [
      item.id, item.dayOfWeek, item.timeStart, item.timeEnd, item.classId,
      item.subjectId, item.teacherId, item.location, position,
    ]));

  const guardians = [...new Map(snapshot.students.map((student) => [
    student.guardian.id, student.guardian,
  ])).values()];
  await insertMany(client, 'guardians',
    ['id', 'full_name', 'relationship', 'phone', 'occupation', 'address'],
    guardians.map((item) => [
      item.id, item.fullName, item.relationship, item.phone, item.occupation, item.address,
    ]));
  await insertMany(client, 'students',
    ['id', 'registration_number', 'full_name', 'nickname', 'gender', 'date_of_birth', 'place_of_birth', 'address', 'kelurahan', 'grade_level', 'assigned_class_id', 'is_raal_resident', 'status', 'guardian_id', 'notes', 'created_at', 'verified_at', 'verified_by', 'position'],
    snapshot.students.map((item, position) => [
      item.id, item.registrationNumber, item.fullName, item.nickname, item.gender,
      dateOnly(item.dateOfBirth), item.placeOfBirth, item.address, item.kelurahan,
      item.gradeLevel, item.assignedClassId ?? null, item.isRaalResident, item.status,
      item.guardian.id, item.notes ?? null, item.createdAt, item.verifiedAt ?? null,
      item.verifiedBy ?? null, position,
    ]));
  await insertMany(client, 'consents',
    ['id', 'student_id', 'student_name', 'guardian_name', 'personal_data_consent', 'photo_video_public_consent', 'effective_date', 'notes', 'updated_at', 'position'],
    snapshot.consents.map((item, position) => [
      item.id, item.studentId, item.studentName, item.guardianName,
      item.personalDataConsent, item.photoVideoPublicConsent, dateOnly(item.effectiveDate),
      item.notes ?? null, item.updatedAt, position,
    ]));

  await insertMany(client, 'attendance_sessions',
    ['id', 'class_id', 'class_name', 'session_date', 'recorded_by', 'recorded_by_name', 'notes', 'created_at', 'position'],
    snapshot.attendanceSessions.map((item, position) => [
      item.id, item.classId, item.className, dateOnly(item.date), item.recordedBy,
      item.recordedByName, item.notes ?? null, item.createdAt, position,
    ]));
  await insertMany(client, 'attendance_records',
    ['id', 'session_id', 'student_id', 'student_name', 'status', 'note', 'position'],
    snapshot.attendanceSessions.flatMap((session) => session.records.map((record, position) => [
      record.id, session.id, record.studentId, record.studentName, record.status,
      record.note ?? null, position,
    ])));
  const teacherIds = new Set(snapshot.teachers.map((teacher) => teacher.id));
  const userIds = new Set(snapshot.users.map((user) => user.id));
  await insertMany(client, 'student_development_notes',
    ['id', 'student_id', 'student_name', 'note_date', 'category', 'teacher_user_id', 'teacher_directory_id', 'teacher_name', 'observation', 'progress_notes', 'follow_up', 'classification', 'created_at', 'position'],
    snapshot.developmentNotes.map((item, position) => {
      if (!teacherIds.has(item.teacherId) && !userIds.has(item.teacherId)) {
        throw new Error(`Unknown teacher reference on development note ${item.id}`);
      }
      return [
        item.id, item.studentId, item.studentName, dateOnly(item.date), item.category,
        userIds.has(item.teacherId) ? item.teacherId : null,
        teacherIds.has(item.teacherId) && !userIds.has(item.teacherId) ? item.teacherId : null,
        item.teacherName, item.observation, item.progressNotes, item.followUp,
        item.classification, item.createdAt, position,
      ];
    }));

  await insertMany(client, 'media_assets',
    ['id', 'title', 'description', 'url', 'category', 'captured_date', 'privacy_reviewed', 'is_eligible_for_public', 'reviewed_by', 'position'],
    snapshot.mediaAssets.map((item, position) => [
      item.id, item.title, item.description, item.url, item.category,
      dateOnly(item.capturedDate), item.privacyReviewed, item.isEligibleForPublic,
      item.reviewedBy ?? null, position,
    ]));
  await insertMany(client, 'publication_posts',
    ['id', 'title', 'slug', 'category', 'summary', 'content', 'cover_image', 'status', 'author_id', 'author_name', 'published_at', 'scheduled_for', 'event_date', 'event_location', 'position'],
    snapshot.publications.map((item, position) => [
      item.id, item.title, item.slug, item.category, item.summary, item.content,
      item.coverImage ?? null, item.status, item.authorId, item.authorName,
      item.publishedAt ?? null, item.scheduledFor ?? null, dateOnly(item.eventDate),
      item.eventLocation ?? null, position,
    ]));
  await insertMany(client, 'service_reports',
    ['id', 'title', 'period', 'report_type', 'summary', 'total_beneficiaries', 'total_sessions', 'average_attendance_pct', 'created_by', 'created_by_name', 'status', 'classification', 'is_public_summary_generated', 'created_at', 'updated_at', 'position'],
    snapshot.reports.map((item, position) => [
      item.id, item.title, item.period, item.reportType, item.summary,
      item.totalBeneficiaries, item.totalSessions, item.averageAttendancePct,
      item.createdBy, item.createdByName, item.status, item.classification,
      item.isPublicSummaryGenerated, item.createdAt, item.updatedAt, position,
    ]));
  await insertMany(client, 'report_approval_logs',
    ['report_id', 'step', 'actor_id', 'actor_name', 'action', 'comment', 'occurred_at', 'position'],
    snapshot.reports.flatMap((report) => report.workflowLogs.map((log, position) => [
      report.id, log.step, log.actorId, log.actorName, log.action,
      log.comment, log.timestamp, position,
    ])));
  await insertMany(client, 'audit_logs',
    ['id', 'actor_id', 'actor_name', 'actor_role', 'action', 'entity_type', 'entity_id', 'description', 'occurred_at', 'ip_address', 'position'],
    snapshot.auditLogs.map((item, position) => [
      item.id, item.actorId, item.actorName, item.actorRole, item.action,
      item.entityType, item.entityId, item.description, item.timestamp,
      item.ipAddress ?? null, position,
    ]));
  await insertMany(client, 'application_settings', ['id', 'current_user_id'], [
    [1, snapshot.currentUser.id],
  ]);
}

async function loadSnapshot(client: PoolClient): Promise<StorageSnapshot | null> {
  const counts = await client.query<{ count: string }>('SELECT count(*) FROM users');
  if (Number(counts.rows[0].count) === 0) return null;

  const organizations = await client.query(
    'SELECT * FROM organizations ORDER BY position',
  );
  const serviceUnits = await client.query(
    'SELECT * FROM service_units ORDER BY position',
  );
  const subDistricts = await client.query(
    'SELECT service_unit_id, name FROM service_unit_sub_districts ORDER BY service_unit_id, position',
  );
  const contacts = await client.query(
    'SELECT service_unit_id, name, phone, role FROM service_unit_contacts ORDER BY service_unit_id, position',
  );
  const users = await client.query(
    'SELECT * FROM users ORDER BY position',
  );
  const academicYears = await client.query(
    'SELECT * FROM academic_years ORDER BY position',
  );
  const subjects = await client.query(
    'SELECT * FROM subjects ORDER BY position',
  );
  const teachers = await client.query(
    'SELECT * FROM teachers ORDER BY position',
  );
  const teacherSubjects = await client.query(
    'SELECT teacher_id, subject_name FROM teacher_subjects ORDER BY teacher_id, position',
  );
  const classes = await client.query(
    'SELECT * FROM classes ORDER BY position',
  );
  const schedules = await client.query(
    'SELECT * FROM class_schedules ORDER BY position',
  );
  const students = await client.query(`
    SELECT s.*, g.full_name AS guardian_full_name, g.relationship AS guardian_relationship,
      g.phone AS guardian_phone, g.occupation AS guardian_occupation, g.address AS guardian_address
    FROM students s JOIN guardians g ON g.id = s.guardian_id
    ORDER BY s.position
  `);
  const consents = await client.query(
    'SELECT * FROM consents ORDER BY position',
  );
  const sessions = await client.query(
    'SELECT * FROM attendance_sessions ORDER BY position',
  );
  const attendanceRecords = await client.query(
    'SELECT * FROM attendance_records ORDER BY session_id, position',
  );
  const developmentNotes = await client.query(
    'SELECT *, COALESCE(teacher_user_id, teacher_directory_id) AS teacher_reference_id FROM student_development_notes ORDER BY position',
  );
  const mediaAssets = await client.query(
    'SELECT * FROM media_assets ORDER BY position',
  );
  const publications = await client.query(
    'SELECT * FROM publication_posts ORDER BY position',
  );
  const reports = await client.query(
    'SELECT * FROM service_reports ORDER BY position',
  );
  const approvalLogs = await client.query(
    'SELECT * FROM report_approval_logs ORDER BY report_id, position',
  );
  const auditLogs = await client.query(
    'SELECT * FROM audit_logs ORDER BY position',
  );
  const settings = await client.query<{ current_user_id: string }>(
    'SELECT current_user_id FROM application_settings WHERE id = 1',
  );

  const contactsByUnit = new Map<string, { name: string; phone: string; role: string }[]>();
  for (const contact of contacts.rows) {
    const list = contactsByUnit.get(contact.service_unit_id) ?? [];
    list.push({ name: contact.name, phone: contact.phone, role: contact.role });
    contactsByUnit.set(contact.service_unit_id, list);
  }
  const districtsByUnit = new Map<string, string[]>();
  for (const district of subDistricts.rows) {
    const list = districtsByUnit.get(district.service_unit_id) ?? [];
    list.push(district.name);
    districtsByUnit.set(district.service_unit_id, list);
  }
  const subjectsByTeacher = new Map<string, string[]>();
  for (const subject of teacherSubjects.rows) {
    const list = subjectsByTeacher.get(subject.teacher_id) ?? [];
    list.push(subject.subject_name);
    subjectsByTeacher.set(subject.teacher_id, list);
  }
  const recordsBySession = new Map<string, AttendanceSession['records']>();
  for (const record of attendanceRecords.rows) {
    const list = recordsBySession.get(record.session_id) ?? [];
    list.push({
      id: record.id,
      studentId: record.student_id,
      studentName: record.student_name,
      status: record.status,
      ...(record.note === null ? {} : { note: record.note }),
    });
    recordsBySession.set(record.session_id, list);
  }
  const logsByReport = new Map<string, ServiceReport['workflowLogs']>();
  for (const log of approvalLogs.rows) {
    const list = logsByReport.get(log.report_id) ?? [];
    list.push({
      step: log.step,
      actorId: log.actor_id,
      actorName: log.actor_name,
      action: log.action,
      comment: log.comment,
      timestamp: timestamp(log.occurred_at)!,
    });
    logsByReport.set(log.report_id, list);
  }

  const usersList: StorageSnapshot['users'] = users.rows.map((item) => ({
    id: item.id,
    name: item.name,
    email: item.email,
    role: item.role,
    organizationId: item.organization_id,
    ...(item.service_unit_id === null ? {} : { serviceUnitId: item.service_unit_id }),
    active: item.active,
    ...(item.avatar_url === null ? {} : { avatarUrl: item.avatar_url }),
    ...(item.last_login_at === null ? {} : { lastLoginAt: timestamp(item.last_login_at) }),
  }));
  const currentUser = usersList.find((user) => user.id === settings.rows[0]?.current_user_id);
  if (!currentUser) throw new Error('Configured current user is missing from users table');

  return {
    organizations: organizations.rows.map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      level: item.level,
      ...(item.parent_id === null ? {} : { parentId: item.parent_id }),
      address: item.address,
      contactEmail: item.contact_email,
      contactPhone: item.contact_phone,
    })),
    serviceUnits: serviceUnits.rows.map((item) => ({
      id: item.id,
      organizationId: item.organization_id,
      name: item.name,
      code: item.code,
      type: item.type,
      headline: item.headline,
      slogan: item.slogan,
      location: item.location,
      subDistricts: districtsByUnit.get(item.id) ?? [],
      contactPersons: contactsByUnit.get(item.id) ?? [],
      active: item.active,
    })),
    users: usersList,
    currentUser,
    academicYears: academicYears.rows.map((item) => ({
      id: item.id,
      name: item.name,
      isActive: item.is_active,
      startDate: item.start_date,
      endDate: item.end_date,
    })),
    subjects: subjects.rows.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description,
      targetFocus: item.target_focus,
    })),
    teachers: teachers.rows.map((item) => ({
      id: item.id,
      fullName: item.full_name,
      phone: item.phone,
      email: item.email,
      originSchool: item.origin_school,
      subjects: subjectsByTeacher.get(item.id) ?? [],
      ...(item.is_coordinator === null ? {} : { isCoordinator: item.is_coordinator }),
    })),
    classes: classes.rows.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      capacity: item.capacity,
      enrolledCount: item.enrolled_count,
      roomName: item.room_name,
      mainTeacherId: item.main_teacher_id,
    })),
    schedules: schedules.rows.map((item) => ({
      id: item.id,
      dayOfWeek: item.day_of_week,
      timeStart: item.time_start,
      timeEnd: item.time_end,
      classId: item.class_id,
      subjectId: item.subject_id,
      teacherId: item.teacher_id,
      location: item.location,
    })),
    students: students.rows.map((item) => ({
      id: item.id,
      registrationNumber: item.registration_number,
      fullName: item.full_name,
      nickname: item.nickname,
      gender: item.gender,
      dateOfBirth: item.date_of_birth,
      placeOfBirth: item.place_of_birth,
      address: item.address,
      kelurahan: item.kelurahan,
      gradeLevel: item.grade_level,
      ...(item.assigned_class_id === null ? {} : { assignedClassId: item.assigned_class_id }),
      isRaalResident: item.is_raal_resident,
      status: item.status,
      guardian: {
        id: item.guardian_id,
        fullName: item.guardian_full_name,
        relationship: item.guardian_relationship,
        phone: item.guardian_phone,
        occupation: item.guardian_occupation,
        address: item.guardian_address,
      },
      ...(item.notes === null ? {} : { notes: item.notes }),
      createdAt: timestamp(item.created_at)!,
      ...(item.verified_at === null ? {} : { verifiedAt: timestamp(item.verified_at) }),
      ...(item.verified_by === null ? {} : { verifiedBy: item.verified_by }),
    })),
    consents: consents.rows.map((item) => ({
      id: item.id,
      studentId: item.student_id,
      studentName: item.student_name,
      guardianName: item.guardian_name,
      personalDataConsent: item.personal_data_consent,
      photoVideoPublicConsent: item.photo_video_public_consent,
      effectiveDate: item.effective_date,
      ...(item.notes === null ? {} : { notes: item.notes }),
      updatedAt: timestamp(item.updated_at)!,
    })),
    attendanceSessions: sessions.rows.map((item) => {
      const records = recordsBySession.get(item.id) ?? [];
      const present = records.filter((record) => record.status === 'PRESENT').length;
      const sick = records.filter((record) => record.status === 'SICK').length;
      const permitted = records.filter((record) => record.status === 'PERMITTED').length;
      const absent = records.filter((record) => record.status === 'ABSENT').length;
      return {
        id: item.id,
        classId: item.class_id,
        className: item.class_name,
        date: item.session_date,
        recordedBy: item.recorded_by,
        recordedByName: item.recorded_by_name,
        summary: { present, sick, permitted, absent, total: records.length },
        records,
        ...(item.notes === null ? {} : { notes: item.notes }),
        createdAt: timestamp(item.created_at)!,
      };
    }),
    developmentNotes: developmentNotes.rows.map((item) => ({
      id: item.id,
      studentId: item.student_id,
      studentName: item.student_name,
      date: item.note_date,
      category: item.category,
      teacherId: item.teacher_reference_id,
      teacherName: item.teacher_name,
      observation: item.observation,
      progressNotes: item.progress_notes,
      followUp: item.follow_up,
      classification: item.classification,
      createdAt: timestamp(item.created_at)!,
    })),
    mediaAssets: mediaAssets.rows.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      url: item.url,
      category: item.category,
      capturedDate: item.captured_date,
      privacyReviewed: item.privacy_reviewed,
      isEligibleForPublic: item.is_eligible_for_public,
      ...(item.reviewed_by === null ? {} : { reviewedBy: item.reviewed_by }),
    })),
    publications: publications.rows.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      category: item.category,
      summary: item.summary,
      content: item.content,
      ...(item.cover_image === null ? {} : { coverImage: item.cover_image }),
      status: item.status,
      authorId: item.author_id,
      authorName: item.author_name,
      ...(item.published_at === null ? {} : { publishedAt: timestamp(item.published_at) }),
      ...(item.scheduled_for === null ? {} : { scheduledFor: timestamp(item.scheduled_for) }),
      ...(item.event_date === null ? {} : { eventDate: item.event_date }),
      ...(item.event_location === null ? {} : { eventLocation: item.event_location }),
    })),
    reports: reports.rows.map((item) => ({
      id: item.id,
      title: item.title,
      period: item.period,
      reportType: item.report_type,
      summary: item.summary,
      totalBeneficiaries: item.total_beneficiaries,
      totalSessions: item.total_sessions,
      averageAttendancePct: item.average_attendance_pct,
      createdBy: item.created_by,
      createdByName: item.created_by_name,
      status: item.status,
      workflowLogs: logsByReport.get(item.id) ?? [],
      classification: item.classification,
      isPublicSummaryGenerated: item.is_public_summary_generated,
      createdAt: timestamp(item.created_at)!,
      updatedAt: timestamp(item.updated_at)!,
    })),
    auditLogs: auditLogs.rows.map((item) => ({
      id: item.id,
      actorId: item.actor_id,
      actorName: item.actor_name,
      actorRole: item.actor_role,
      action: item.action,
      entityType: item.entity_type,
      entityId: item.entity_id,
      description: item.description,
      timestamp: timestamp(item.occurred_at)!,
      ...(item.ip_address === null ? {} : { ipAddress: item.ip_address }),
    })),
  };
}

async function saveSnapshot(snapshot: StorageSnapshot) {
  if (!snapshot.users.some((user) => user.id === snapshot.currentUser.id)) {
    throw new Error('Current user must be present in users');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET CONSTRAINTS ALL DEFERRED');
    await persistSnapshot(client, snapshot);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function migrateLegacySnapshot() {
  const migrations = [
    { version: 1, file: '001_relational_schema.sql' },
    { version: 2, file: '002_development_note_teacher_refs.sql' },
  ];
  for (const migration of migrations) {
    const sql = await readFile(
      path.resolve(process.cwd(), 'migrations', migration.file),
      'utf8',
    );
    await pool.query(sql);
    await pool.query(
      'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING',
      [migration.version],
    );
  }

  const legacyTable = await pool.query<{ table_name: string | null }>(
    "SELECT to_regclass('public.pmki_app_state')::text AS table_name",
  );
  const existingData = await pool.query<{ count: string }>('SELECT count(*) FROM users');
  if (Number(existingData.rows[0].count) === 0 && legacyTable.rows[0]?.table_name) {
    const legacy = await pool.query<{ state: unknown }>(
      'SELECT state FROM pmki_app_state WHERE id = 1',
    );
    if (legacy.rows[0] && isStorageSnapshot(legacy.rows[0].state)) {
      await saveSnapshot(legacy.rows[0].state);
      console.log('Migrated existing application snapshot into relational tables.');
    }
  }
}

app.use(express.json({ limit: '5mb' }));

app.get('/api/health', async (_request, response, next) => {
  try {
    await pool.query('SELECT 1');
    response.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/state', async (_request, response, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const state = await loadSnapshot(client);
    await client.query('COMMIT');
    response.json({ state });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

app.put('/api/state', async (request, response, next) => {
  try {
    if (!isStorageSnapshot(request.body)) {
      response.status(400).json({ error: 'Invalid application state payload' });
      return;
    }
    await saveSnapshot(request.body);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  console.error('API request failed:', error);
  response.status(500).json({ error: 'Internal API error' });
});

async function start() {
  await migrateLegacySnapshot();
  const port = Number(process.env.API_PORT || 3001);
  const host = process.env.API_HOST || '127.0.0.1';
  app.listen(port, host, () => {
    console.log(`PMKI API listening at http://${host}:${port}`);
  });
}

start().catch((error: unknown) => {
  console.error('Could not start PMKI API:', error);
  process.exitCode = 1;
});
