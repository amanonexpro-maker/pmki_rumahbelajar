import { getHumanErrorMessage } from "@/lib/messages";
import type { SessionUser } from "@/server/auth/session";
import { fail, ok, type ActionResult } from "@/server/contracts/result";
import { canReadConfidentialGuardian } from "../permissions/student-policy";
import {
  findPrimaryGuardianByStudentId,
  findStudentRowById,
} from "../repositories/student-repository";
import {
  GUARDIAN_RELATIONSHIP_LABELS,
  type ConfidentialGuardianDTO,
  type GuardianRelationshipCode,
} from "../types/student-types";

/**
 * Guardian Service (11 §10, 05 §13–14).
 * Guardian contact & address are CONFIDENTIAL: default DENY unless caller holds
 * explicit `guardian.read` permission AND matching serviceUnitId scope.
 */
export async function getConfidentialGuardianForStudent(
  user: SessionUser | null | undefined,
  studentId: string
): Promise<ActionResult<ConfidentialGuardianDTO>> {
  const student = await findStudentRowById(studentId);
  if (!student) {
    return fail("RESOURCE_NOT_FOUND", getHumanErrorMessage("RESOURCE_NOT_FOUND"));
  }

  if (!canReadConfidentialGuardian(user, student.serviceUnitId)) {
    return fail("PERMISSION_DENIED", getHumanErrorMessage("PERMISSION_DENIED"));
  }

  const guardianRow = await findPrimaryGuardianByStudentId(studentId);
  if (!guardianRow) {
    return fail(
      "RESOURCE_NOT_FOUND",
      "Data orang tua atau wali belum tercatat."
    );
  }

  const rel = guardianRow.relationship as GuardianRelationshipCode;
  return ok({
    id: guardianRow.id,
    fullName: guardianRow.fullName,
    relationship: rel,
    relationshipLabel: GUARDIAN_RELATIONSHIP_LABELS[rel] ?? rel,
    phone: guardianRow.phone,
    occupation: guardianRow.occupation,
    address: guardianRow.address,
  });
}

