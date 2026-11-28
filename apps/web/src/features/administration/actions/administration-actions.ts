"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/server/auth/session";
import type { ActionResult } from "@/server/contracts/result";
import {
  applyUserPermissionOverride,
  createCustomRole,
  deleteCustomRole,
  provisionNewPlatformUser,
  removeUserPermissionOverride,
  resetUserToDefaultPassword,
  setPlatformUserActiveState,
  updateCustomRole,
  updateUserRoleAssignments,
  updateUserScopeAssignment,
} from "../services/access-service";
import type { AdminRoleRecordDTO } from "../types/administration-types";

/**
 * Thin Server Actions for Administration Domain (09 §6–8, D-20).
 * Every mutation calls `revalidatePath("/workspace", "layout")` so dynamic RBAC
 * changes take effect immediately on the very next request without re-login.
 */
export async function provisionNewPlatformUserAction(
  payload: unknown
): Promise<ActionResult<{ userId: string; email: string }>> {
  const session = await getCurrentSession();
  const result = await provisionNewPlatformUser(session, payload);
  if (result.success) {
    revalidatePath("/workspace", "layout");
    revalidatePath("/workspace/administration");
    revalidatePath("/workspace/audit");
  }
  return result;
}

export async function updateUserRoleAssignmentsAction(
  payload: unknown
): Promise<ActionResult<{ userId: string; roleCodes: string[] }>> {
  const session = await getCurrentSession();
  const result = await updateUserRoleAssignments(session, payload);
  if (result.success) {
    revalidatePath("/workspace", "layout");
    revalidatePath("/workspace/administration");
    revalidatePath("/workspace/audit");
  }
  return result;
}

export async function setPlatformUserActiveStateAction(
  payload: unknown
): Promise<ActionResult<{ userId: string; active: boolean }>> {
  const session = await getCurrentSession();
  const result = await setPlatformUserActiveState(session, payload);
  if (result.success) {
    revalidatePath("/workspace", "layout");
    revalidatePath("/workspace/administration");
    revalidatePath("/workspace/audit");
  }
  return result;
}

export async function createCustomRoleAction(
  payload: unknown
): Promise<ActionResult<AdminRoleRecordDTO>> {
  const session = await getCurrentSession();
  const result = await createCustomRole(session, payload);
  if (result.success) {
    revalidatePath("/workspace", "layout");
    revalidatePath("/workspace/administration");
    revalidatePath("/workspace/audit");
  }
  return result;
}

export async function updateCustomRoleAction(
  payload: unknown
): Promise<ActionResult<AdminRoleRecordDTO>> {
  const session = await getCurrentSession();
  const result = await updateCustomRole(session, payload);
  if (result.success) {
    revalidatePath("/workspace", "layout");
    revalidatePath("/workspace/administration");
    revalidatePath("/workspace/audit");
  }
  return result;
}

export async function deleteCustomRoleAction(
  payload: unknown
): Promise<ActionResult<{ roleId: string; code: string; name: string }>> {
  const session = await getCurrentSession();
  const result = await deleteCustomRole(session, payload);
  if (result.success) {
    revalidatePath("/workspace", "layout");
    revalidatePath("/workspace/administration");
    revalidatePath("/workspace/audit");
  }
  return result;
}

export async function applyUserPermissionOverrideAction(
  payload: unknown
): Promise<
  ActionResult<{
    userId: string;
    permissionCode: string;
    mode: "GRANT" | "REVOKE";
  }>
> {
  const session = await getCurrentSession();
  const result = await applyUserPermissionOverride(session, payload);
  if (result.success) {
    revalidatePath("/workspace", "layout");
    revalidatePath("/workspace/administration");
    revalidatePath("/workspace/audit");
  }
  return result;
}

export async function updateUserScopeAssignmentAction(
  payload: unknown
): Promise<
  ActionResult<{
    membershipId: string;
    userId: string;
    serviceUnitId: string;
    active: boolean;
  }>
> {
  const session = await getCurrentSession();
  const result = await updateUserScopeAssignment(session, payload);
  if (result.success) {
    revalidatePath("/workspace", "layout");
    revalidatePath("/workspace/administration");
    revalidatePath("/workspace/audit");
  }
  return result;
}

export async function resetUserToDefaultPasswordAction(
  targetUserId: string
): Promise<ActionResult<{ reset: true; temporaryPassword: string }>> {
  const session = await getCurrentSession();
  const result = await resetUserToDefaultPassword(session, targetUserId);
  if (result.success) {
    revalidatePath("/workspace/administration");
    revalidatePath("/workspace/audit");
  }
  return result;
}

export async function removeUserPermissionOverrideAction(
  targetUserId: string,
  permissionCode: string
): Promise<ActionResult<{ removed: true; permissionCode: string }>> {
  const session = await getCurrentSession();
  const result = await removeUserPermissionOverride(
    session,
    targetUserId,
    permissionCode
  );
  if (result.success) {
    revalidatePath("/workspace", "layout");
    revalidatePath("/workspace/administration");
    revalidatePath("/workspace/audit");
  }
  return result;
}
