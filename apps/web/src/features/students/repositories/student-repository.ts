import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
} from "drizzle-orm";
import { db } from "@/db/client";
import { guardians, studentGuardians, students } from "@/db/schema";
import type { RegistrationStatus } from "@/lib/status";
import type {
  EducationLevelCode,
  GuardianRelationshipCode,
} from "../types/student-types";

/**
 * Students Domain Repository (11 §10, §24).
 * STRICT BOUNDARY: Only queries `students`, `guardians`, and `student_guardians`.
 * Never imports or queries tables from `academic`, `consent`, or any other domain.
 */
export async function countTotalStudentsByUnit(
  serviceUnitId: string
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(students)
    .where(eq(students.serviceUnitId, serviceUnitId));
  return Number(row?.total ?? 0);
}

export async function insertStudentWithGuardian(params: {
  organizationId: string;
  serviceUnitId: string;
  academicYearId: string;
  registrationNumber: string;
  fullName: string;
  nickname: string;
  birthDate: string;
  gender: "L" | "P";
  educationLevel: EducationLevelCode;
  schoolName?: string | null;
  address?: string | null;
  district?: string | null;
  isRaalResident: boolean;
  guardianFullName: string;
  guardianRelationship: GuardianRelationshipCode;
  guardianPhone: string;
  guardianOccupation?: string | null;
  actorId?: string | null;
}) {
  return db.transaction(async (tx) => {
    const [createdStudent] = await tx
      .insert(students)
      .values({
        organizationId: params.organizationId,
        serviceUnitId: params.serviceUnitId,
        academicYearId: params.academicYearId,
        registrationNumber: params.registrationNumber,
        fullName: params.fullName,
        nickname: params.nickname,
        birthDate: params.birthDate,
        gender: params.gender,
        educationLevel: params.educationLevel,
        schoolName: params.schoolName ?? null,
        address: params.address ?? null,
        district: params.district ?? null,
        isRaalResident: params.isRaalResident,
        registrationStatus: "SUBMITTED",
        createdBy: params.actorId ?? null,
        updatedBy: params.actorId ?? null,
      })
      .returning();

    const [createdGuardian] = await tx
      .insert(guardians)
      .values({
        serviceUnitId: params.serviceUnitId,
        fullName: params.guardianFullName,
        phone: params.guardianPhone,
        occupation: params.guardianOccupation ?? null,
        address: params.address ?? null,
        createdBy: params.actorId ?? null,
        updatedBy: params.actorId ?? null,
      })
      .returning();

    await tx.insert(studentGuardians).values({
      studentId: createdStudent.id,
      guardianId: createdGuardian.id,
      relationship: params.guardianRelationship,
      isPrimary: true,
      createdBy: params.actorId ?? null,
      updatedBy: params.actorId ?? null,
    });

    return {
      student: createdStudent,
      guardian: createdGuardian,
    };
  });
}

export async function findStudentRowById(studentId: string) {
  const [row] = await db
    .select()
    .from(students)
    .where(and(eq(students.id, studentId), isNull(students.archivedAt)))
    .limit(1);
  return row ?? null;
}

export async function findPrimaryGuardianByStudentId(studentId: string) {
  const [row] = await db
    .select({
      id: guardians.id,
      serviceUnitId: guardians.serviceUnitId,
      fullName: guardians.fullName,
      phone: guardians.phone,
      occupation: guardians.occupation,
      address: guardians.address,
      relationship: studentGuardians.relationship,
    })
    .from(studentGuardians)
    .innerJoin(guardians, eq(studentGuardians.guardianId, guardians.id))
    .where(
      and(
        eq(studentGuardians.studentId, studentId),
        isNull(guardians.archivedAt)
      )
    )
    .orderBy(desc(studentGuardians.isPrimary))
    .limit(1);

  return row ?? null;
}

export async function updateStudentLifecycleStatus(params: {
  studentId: string;
  registrationStatus: RegistrationStatus;
  assignedClassId?: string | null;
  actorId?: string | null;
}) {
  const updatePayload: {
    registrationStatus: RegistrationStatus;
    updatedAt: Date;
    updatedBy: string | null;
    assignedClassId?: string | null;
  } = {
    registrationStatus: params.registrationStatus,
    updatedAt: new Date(),
    updatedBy: params.actorId ?? null,
  };

  if (params.assignedClassId !== undefined) {
    updatePayload.assignedClassId = params.assignedClassId;
  }

  const [updated] = await db
    .update(students)
    .set(updatePayload)
    .where(and(eq(students.id, params.studentId), isNull(students.archivedAt)))
    .returning();

  return updated ?? null;
}

export async function updateStudentAndGuardianProfile(params: {
  studentId: string;
  fullName: string;
  nickname: string;
  gender: "L" | "P";
  birthDate: string;
  educationLevel: EducationLevelCode;
  schoolName?: string | null;
  district: string;
  address?: string | null;
  isRaalResident: boolean;
  guardianUpdate?: {
    guardianId: string;
    fullName: string;
    relationship: GuardianRelationshipCode;
    phone: string;
    occupation?: string | null;
    address?: string | null;
  };
  actorId?: string | null;
}) {
  return db.transaction(async (tx) => {
    const [updatedStudent] = await tx
      .update(students)
      .set({
        fullName: params.fullName,
        nickname: params.nickname,
        gender: params.gender,
        birthDate: params.birthDate,
        educationLevel: params.educationLevel,
        schoolName: params.schoolName ?? null,
        district: params.district,
        ...(params.address !== undefined ? { address: params.address } : {}),
        isRaalResident: params.isRaalResident,
        updatedAt: new Date(),
        updatedBy: params.actorId ?? null,
      })
      .where(eq(students.id, params.studentId))
      .returning();

    if (params.guardianUpdate) {
      await tx
        .update(guardians)
        .set({
          fullName: params.guardianUpdate.fullName,
          phone: params.guardianUpdate.phone,
          occupation: params.guardianUpdate.occupation ?? null,
          address: params.guardianUpdate.address ?? null,
          updatedAt: new Date(),
          updatedBy: params.actorId ?? null,
        })
        .where(eq(guardians.id, params.guardianUpdate.guardianId));

      await tx
        .update(studentGuardians)
        .set({
          relationship: params.guardianUpdate.relationship,
          updatedAt: new Date(),
          updatedBy: params.actorId ?? null,
        })
        .where(
          and(
            eq(studentGuardians.studentId, params.studentId),
            eq(studentGuardians.guardianId, params.guardianUpdate.guardianId)
          )
        );
    }

    return updatedStudent;
  });
}

export async function findStudentsFiltered(params: {
  serviceUnitIds: string[];
  search?: string;
  status?: string;
  academicYearId?: string;
  classId?: string;
  educationLevel?: string;
}) {
  if (params.serviceUnitIds.length === 0) {
    return [];
  }

  const conditions = [
    inArray(students.serviceUnitId, params.serviceUnitIds),
    isNull(students.archivedAt),
  ];

  // Search ONLY non-confidential identity fields (fullName, nickname, registrationNumber)
  const trimmedSearch = params.search?.trim();
  if (trimmedSearch) {
    const pattern = `%${trimmedSearch}%`;
    const searchCond = or(
      ilike(students.fullName, pattern),
      ilike(students.nickname, pattern),
      ilike(students.registrationNumber, pattern)
    );
    if (searchCond) conditions.push(searchCond);
  }

  if (params.status && params.status !== "ALL") {
    conditions.push(
      eq(students.registrationStatus, params.status as RegistrationStatus)
    );
  }

  if (params.academicYearId && params.academicYearId !== "ALL") {
    conditions.push(eq(students.academicYearId, params.academicYearId));
  }

  if (params.classId && params.classId !== "ALL") {
    if (params.classId === "UNASSIGNED") {
      conditions.push(isNull(students.assignedClassId));
    } else {
      conditions.push(eq(students.assignedClassId, params.classId));
    }
  }

  if (params.educationLevel && params.educationLevel !== "ALL") {
    if (params.educationLevel === "SD_ALL") {
      conditions.push(ilike(students.educationLevel, "SD_%"));
    } else if (params.educationLevel === "SMP_ALL") {
      conditions.push(ilike(students.educationLevel, "SMP_%"));
    } else {
      conditions.push(eq(students.educationLevel, params.educationLevel));
    }
  }

  return db
    .select()
    .from(students)
    .where(and(...conditions))
    .orderBy(desc(students.createdAt), students.fullName);
}

