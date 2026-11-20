"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/server/auth/session";
import type { ActionResult } from "@/server/contracts/result";
import type { RegistrationStatus } from "@/lib/status";
import { placeStudentInClass } from "../services/placement-service";
import {
  submitPublicRegistration,
  verifyStudentRegistration,
} from "../services/registration-service";
import { updateStudentProfile } from "../services/student-service";

/**
 * Thin Server Actions for Students Domain (09 §6–8).
 * Zod validation, RBAC, scope, policy, and audit happen inside Domain Services.
 */
export async function submitPublicRegistrationAction(
  payload: unknown
): Promise<
  ActionResult<{
    studentId: string;
    registrationNumber: string;
    fullName: string;
    registrationStatus: RegistrationStatus;
  }>
> {
  const session = await getCurrentSession();
  const result = await submitPublicRegistration(payload, session);
  if (result.success) {
    revalidatePath("/workspace/students");
  }
  return result;
}

export async function verifyStudentRegistrationAction(
  payload: unknown
): Promise<
  ActionResult<{
    studentId: string;
    previousStatus: RegistrationStatus;
    newStatus: RegistrationStatus;
  }>
> {
  const session = await getCurrentSession();
  const result = await verifyStudentRegistration(session, payload);
  if (result.success) {
    revalidatePath("/workspace/students");
    revalidatePath(`/workspace/students/${result.data.studentId}`);
  }
  return result;
}

export async function placeStudentInClassAction(
  payload: unknown
): Promise<
  ActionResult<{
    studentId: string;
    classId: string;
    className: string;
    registrationStatus: RegistrationStatus;
    remainingSeats: number;
  }>
> {
  const session = await getCurrentSession();
  const result = await placeStudentInClass(session, payload);
  if (result.success) {
    revalidatePath("/workspace/students");
    revalidatePath(`/workspace/students/${result.data.studentId}`);
  }
  return result;
}

export async function updateStudentProfileAction(
  payload: unknown
): Promise<ActionResult<{ studentId: string }>> {
  const session = await getCurrentSession();
  const result = await updateStudentProfile(session, payload);
  if (result.success) {
    revalidatePath("/workspace/students");
    revalidatePath(`/workspace/students/${result.data.studentId}`);
  }
  return result;
}

