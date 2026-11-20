import { and, count, desc, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/db/client";
import {
  academicYears,
  classEnrollments,
  classes,
  schedules,
  subjects,
  teacherAssignments,
  teachers,
} from "@/db/schema";
import type {
  AcademicYearDTO,
  ClassSummaryDTO,
  ScheduleDetailDTO,
} from "../types/academic-types";
import type { CreateClassInput } from "../validators/academic-validator";

export async function findAcademicYearsByUnit(
  serviceUnitId: string
): Promise<AcademicYearDTO[]> {
  const rows = await db
    .select()
    .from(academicYears)
    .where(
      and(
        eq(academicYears.serviceUnitId, serviceUnitId),
        isNull(academicYears.archivedAt)
      )
    )
    .orderBy(desc(academicYears.active), desc(academicYears.startDate));

  return rows.map((r) => ({
    id: r.id,
    serviceUnitId: r.serviceUnitId,
    name: r.name,
    startDate: r.startDate,
    endDate: r.endDate,
    active: r.active,
  }));
}

export async function findActiveAcademicYearByUnit(
  serviceUnitId: string
): Promise<AcademicYearDTO | null> {
  const years = await findAcademicYearsByUnit(serviceUnitId);
  return years.find((y) => y.active) ?? years[0] ?? null;
}

export async function findClassRowById(classId: string) {
  const [row] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), isNull(classes.archivedAt)))
    .limit(1);
  return row ?? null;
}

export async function countActiveEnrollmentsByClassId(
  classId: string
): Promise<number> {
  const [res] = await db
    .select({ total: count() })
    .from(classEnrollments)
    .where(
      and(
        eq(classEnrollments.classId, classId),
        eq(classEnrollments.status, "ACTIVE"),
        isNull(classEnrollments.archivedAt)
      )
    );
  return Number(res?.total ?? 0);
}

export async function isStudentActivelyEnrolledInClass(
  studentId: string,
  classId: string
): Promise<boolean> {
  const [existing] = await db
    .select({ id: classEnrollments.id })
    .from(classEnrollments)
    .where(
      and(
        eq(classEnrollments.studentId, studentId),
        eq(classEnrollments.classId, classId),
        eq(classEnrollments.status, "ACTIVE"),
        isNull(classEnrollments.archivedAt)
      )
    )
    .limit(1);
  return Boolean(existing);
}

export async function findClassesByUnit(
  serviceUnitId: string,
  academicYearId?: string
): Promise<ClassSummaryDTO[]> {
  const conditions = [
    eq(classes.serviceUnitId, serviceUnitId),
    isNull(classes.archivedAt),
  ];
  if (academicYearId && academicYearId !== "ALL") {
    conditions.push(eq(classes.academicYearId, academicYearId));
  }

  const classRows = await db
    .select()
    .from(classes)
    .where(and(...conditions))
    .orderBy(classes.name);

  if (classRows.length === 0) return [];

  const mainTeachers = await db
    .select({
      classId: teacherAssignments.classId,
      teacherName: teachers.name,
    })
    .from(teacherAssignments)
    .innerJoin(teachers, eq(teacherAssignments.teacherId, teachers.id))
    .where(eq(teacherAssignments.isMainTeacher, true));

  const mainTeacherByClass = new Map<string, string>();
  for (const mt of mainTeachers) {
    mainTeacherByClass.set(mt.classId, mt.teacherName);
  }

  const summaries: ClassSummaryDTO[] = [];
  for (const row of classRows) {
    const enrolledCount = await countActiveEnrollmentsByClassId(row.id);
    const remainingSeats = Math.max(0, row.capacity - enrolledCount);
    summaries.push({
      id: row.id,
      organizationId: row.organizationId,
      serviceUnitId: row.serviceUnitId,
      academicYearId: row.academicYearId,
      programId: row.programId,
      name: row.name,
      category: row.category,
      capacity: row.capacity,
      enrolledCount,
      remainingSeats,
      isFull: enrolledCount >= row.capacity,
      roomName: row.roomName,
      mainTeacherName: mainTeacherByClass.get(row.id) ?? null,
      active: row.active,
    });
  }

  return summaries;
}

export async function findSchedulesByClassId(
  classId: string
): Promise<ScheduleDetailDTO[]> {
  const rows = await db
    .select({
      id: schedules.id,
      classId: schedules.classId,
      className: classes.name,
      subjectName: subjects.name,
      teacherName: teachers.name,
      dayOfWeek: schedules.dayOfWeek,
      startTime: schedules.startTime,
      endTime: schedules.endTime,
      location: schedules.location,
    })
    .from(schedules)
    .innerJoin(classes, eq(schedules.classId, classes.id))
    .innerJoin(subjects, eq(schedules.subjectId, subjects.id))
    .innerJoin(teachers, eq(schedules.teacherId, teachers.id))
    .where(
      and(
        eq(schedules.classId, classId),
        eq(schedules.active, true),
        isNull(schedules.archivedAt)
      )
    );

  return rows;
}

export async function upsertActiveClassEnrollment(params: {
  studentId: string;
  classId: string;
  academicYearId: string;
  actorId?: string | null;
}) {
  // Deactivate any previous active enrollment for the same student & academic year
  await db
    .update(classEnrollments)
    .set({
      status: "TRANSFERRED",
      updatedAt: new Date(),
      updatedBy: params.actorId ?? null,
    })
    .where(
      and(
        eq(classEnrollments.studentId, params.studentId),
        eq(classEnrollments.academicYearId, params.academicYearId),
        ne(classEnrollments.classId, params.classId),
        eq(classEnrollments.status, "ACTIVE")
      )
    );

  const [enrolled] = await db
    .insert(classEnrollments)
    .values({
      studentId: params.studentId,
      classId: params.classId,
      academicYearId: params.academicYearId,
      status: "ACTIVE",
      createdBy: params.actorId ?? null,
      updatedBy: params.actorId ?? null,
    })
    .onConflictDoUpdate({
      target: [
        classEnrollments.studentId,
        classEnrollments.classId,
        classEnrollments.academicYearId,
      ],
      set: {
        status: "ACTIVE",
        archivedAt: null,
        archivedBy: null,
        updatedAt: new Date(),
        updatedBy: params.actorId ?? null,
      },
    })
    .returning();

  return enrolled;
}

export async function insertClass(
  input: CreateClassInput,
  actorId?: string | null
) {
  const [inserted] = await db
    .insert(classes)
    .values({
      organizationId: input.organizationId,
      serviceUnitId: input.serviceUnitId,
      academicYearId: input.academicYearId,
      programId: input.programId ?? null,
      name: input.name,
      category: input.category,
      capacity: input.capacity,
      roomName: input.roomName ?? null,
      createdBy: actorId ?? null,
      updatedBy: actorId ?? null,
    })
    .returning();
  return inserted;
}

export async function findTeacherForActorInUnit(
  serviceUnitId: string,
  userId?: string | null
): Promise<{ id: string; userId: string | null; name: string } | null> {
  const rows = await db
    .select({
      id: teachers.id,
      userId: teachers.userId,
      name: teachers.name,
    })
    .from(teachers)
    .where(
      and(
        eq(teachers.serviceUnitId, serviceUnitId),
        eq(teachers.active, true),
        isNull(teachers.archivedAt)
      )
    );

  if (rows.length === 0) return null;
  if (userId) {
    const matched = rows.find((r) => r.userId === userId);
    if (matched) return matched;
  }
  return rows[0] ?? null;
}

export async function findTeachersByUnit(
  serviceUnitId: string
): Promise<Array<{ id: string; userId: string | null; name: string }>> {
  return db
    .select({
      id: teachers.id,
      userId: teachers.userId,
      name: teachers.name,
    })
    .from(teachers)
    .where(
      and(
        eq(teachers.serviceUnitId, serviceUnitId),
        eq(teachers.active, true),
        isNull(teachers.archivedAt)
      )
    );
}


