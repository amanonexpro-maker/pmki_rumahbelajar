import { cache } from "react";
import { listTeachersForServiceUnit } from "@/features/academic";
import { recordAuditLog } from "@/features/audit";
import {
  getIdentityUserStatusById,
  listAllIdentityUsers,
  provisionIdentityUserViaAdminApi,
  resetIdentityUserPasswordToDefault,
  updateIdentityUserActiveState,
} from "@/features/identity";
import {
  assignOrUpdateUserScopeMembership,
  getOrganizationScopeCatalog,
  getUserMemberships,
  listAllUserScopeMemberships,
  type MembershipRecord,
} from "@/features/organization";
import { getHumanErrorMessage } from "@/lib/messages";
import type { SessionUser } from "@/server/auth/session";
import { fail, ok, type ActionResult } from "@/server/contracts/result";
import {
  authorizeManagePermissions,
  authorizeManageRoles,
  authorizeManageUsers,
  authorizeReadAdministration,
  canAccessSandboxEnvironment,
} from "../permissions/administration-policy";
import {
  deleteUserPermissionOverride,
  findAllPermissionsRegistry,
  findAllRolesWithDetails,
  findUserRoleAndOverrideMaps,
  findUserRoleAndPermissionRaw,
  insertCustomRoleWithPermissions,
  replaceUserRolesByCodes,
  upsertUserPermissionOverride,
} from "../repositories/rbac-repository";
import type {
  AdministrationWorkspaceViewDTO,
  AdminRoleRecordDTO,
  AdminUserRecordDTO,
} from "../types/administration-types";
import {
  assignUserScopeSchema,
  createCustomRoleSchema,
  provisionUserSchema,
  setPermissionOverrideSchema,
  setUserActiveStatusSchema,
  updateUserRolesSchema,
} from "../validators/administration-validator";
import { computeEffectivePermissions } from "./permission-resolver";

export interface ResolvedAccess {
  active: boolean;
  name: string;
  avatarUrl: string | null;
  mustChangePassword: boolean;
  roles: string[];
  permissions: string[];
  memberships: MembershipRecord[];
}

export {
  computeEffectivePermissions,
  upsertUserPermissionOverride,
  deleteUserPermissionOverride,
};

/**
 * Resolves a user's dynamic RBAC access directly from PostgreSQL per request (D-20).
 * Inactive or unknown users receive an empty permission set (Default Deny).
 */
export async function resolveAccess(userId: string): Promise<ResolvedAccess> {
  const userStatus = await getIdentityUserStatusById(userId);
  if (!userStatus || !userStatus.active) {
    return {
      active: false,
      name: userStatus?.name ?? "",
      avatarUrl: null,
      mustChangePassword: false,
      roles: [],
      permissions: [],
      memberships: [],
    };
  }

  const [raw, memberships] = await Promise.all([
    findUserRoleAndPermissionRaw(userId),
    getUserMemberships(userId),
  ]);
  const permissions = computeEffectivePermissions(
    raw.rolePermissionCodes,
    raw.grantedCodes,
    raw.revokedCodes
  );

  return {
    active: true,
    name: userStatus.name,
    avatarUrl: userStatus.avatarUrl,
    mustChangePassword: userStatus.mustChangePassword,
    roles: raw.roleCodes,
    permissions,
    memberships,
  };
}

export const resolveAccessCached = cache(resolveAccess);

/**
 * Loads the complete 5-tab Administration Workspace view (`05 §16`).
 */
export async function getAdministrationWorkspaceView(
  user: SessionUser | null | undefined
): Promise<ActionResult<AdministrationWorkspaceViewDTO>> {
  const authz = authorizeReadAdministration(user);
  if (!authz.success) return authz;

  const [
    identityUsers,
    rolesList,
    permissionsList,
    roleOverrideMaps,
    allMemberships,
    scopeCatalog,
  ] = await Promise.all([
    listAllIdentityUsers(),
    findAllRolesWithDetails(),
    findAllPermissionsRegistry(),
    findUserRoleAndOverrideMaps(),
    listAllUserScopeMemberships(),
    getOrganizationScopeCatalog(),
  ]);

  const membershipsByUser = new Map<
    string,
    typeof allMemberships
  >();
  for (const m of allMemberships) {
    const list = membershipsByUser.get(m.userId) ?? [];
    list.push(m);
    membershipsByUser.set(m.userId, list);
  }

  const teacherUnitsByUserId = new Map<
    string,
    Array<{ serviceUnitId: string; serviceUnitName: string }>
  >();
  await Promise.all(
    scopeCatalog.serviceUnits.map(async (unit) => {
      const teachers = await listTeachersForServiceUnit(unit.id);
      for (const t of teachers) {
        if (!t.userId) continue;
        const list = teacherUnitsByUserId.get(t.userId) ?? [];
        list.push({ serviceUnitId: unit.id, serviceUnitName: unit.name });
        teacherUnitsByUserId.set(t.userId, list);
      }
    })
  );

  const adminUsers: AdminUserRecordDTO[] = identityUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    active: u.active,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    roles: roleOverrideMaps.rolesByUserId.get(u.id) ?? [],
    overrides: roleOverrideMaps.overridesByUserId.get(u.id) ?? [],
    memberships: membershipsByUser.get(u.id) ?? [],
    linkedTeacherUnits: teacherUnitsByUserId.get(u.id) ?? [],
  }));

  return ok({
    users: adminUsers,
    roles: rolesList,
    permissions: permissionsList,
    scopeCatalog,
    isSandboxAllowed: canAccessSandboxEnvironment(user),
  });
}

/**
 * Tab 1 — Provision New User via Supabase Admin API -> public.users -> user_roles -> user_memberships -> audit_logs (D-26, 05 §18).
 */
export async function provisionNewPlatformUser(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<ActionResult<{ userId: string; email: string }>> {
  const parsed = provisionUserSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ??
        getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const authz = authorizeManageUsers(user);
  if (!authz.success) return authz;
  if (!user?.id) {
    return fail("UNAUTHORIZED", getHumanErrorMessage("UNAUTHORIZED"));
  }

  const createdRes = await provisionIdentityUserViaAdminApi({
    name: parsed.data.name,
    email: parsed.data.email,
    initialPassword: parsed.data.initialPassword,
    actorId: user.id,
  });
  if (!createdRes.success) return createdRes;

  const newUserId = createdRes.data.id;

  await replaceUserRolesByCodes({
    userId: newUserId,
    roleCodes: [parsed.data.roleCode],
    actorId: user.id,
  });

  await assignOrUpdateUserScopeMembership({
    userId: newUserId,
    organizationId: parsed.data.organizationId,
    serviceUnitId: parsed.data.serviceUnitId,
    programId: parsed.data.programId ?? null,
    active: true,
    actorId: user.id,
  });

  await recordAuditLog({
    organizationId: parsed.data.organizationId,
    serviceUnitId: parsed.data.serviceUnitId,
    actorId: user.id,
    action: "UserProvisioned",
    entityType: "user",
    entityId: newUserId,
    description: `Membuat akun pengguna baru "${createdRes.data.name}" (${createdRes.data.email}) dengan peran ${parsed.data.roleCode}.`,
    metadata: {
      email: createdRes.data.email,
      roleCode: parsed.data.roleCode,
      organizationId: parsed.data.organizationId,
      serviceUnitId: parsed.data.serviceUnitId,
    },
  });

  return ok({
    userId: newUserId,
    email: createdRes.data.email,
  });
}

/**
 * Tab 1 — Update User Role Assignments + Audit ("Peran diperbarui" — 10 §19).
 */
export async function updateUserRoleAssignments(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<ActionResult<{ userId: string; roleCodes: string[] }>> {
  const parsed = updateUserRolesSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ??
        getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const authz = authorizeManageRoles(user);
  if (!authz.success) return authz;
  if (!user?.id) {
    return fail("UNAUTHORIZED", getHumanErrorMessage("UNAUTHORIZED"));
  }

  const replaced = await replaceUserRolesByCodes({
    userId: parsed.data.userId,
    roleCodes: parsed.data.roleCodes,
    actorId: user.id,
  });

  if (!replaced) {
    return fail("RESOURCE_NOT_FOUND", "Kode peran yang dipilih tidak ditemukan.");
  }

  await recordAuditLog({
    organizationId: user.memberships[0]?.organizationId ?? null,
    serviceUnitId: user.memberships[0]?.serviceUnitId ?? null,
    actorId: user.id,
    action: "UserRolesUpdated",
    entityType: "user",
    entityId: parsed.data.userId,
    description: `Peran diperbarui menjadi: ${parsed.data.roleCodes.join(", ")}.`,
    metadata: {
      roleCodes: parsed.data.roleCodes,
      reason: parsed.data.reason ?? null,
    },
  });

  return ok({
    userId: parsed.data.userId,
    roleCodes: parsed.data.roleCodes,
  });
}

/**
 * Tab 1 — Soft Activate / Deactivate User + Audit ("Pengguna dinonaktifkan" — 10 §19).
 */
export async function setPlatformUserActiveState(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<ActionResult<{ userId: string; active: boolean }>> {
  const parsed = setUserActiveStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ??
        getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const authz = authorizeManageUsers(user);
  if (!authz.success) return authz;
  if (!user?.id) {
    return fail("UNAUTHORIZED", getHumanErrorMessage("UNAUTHORIZED"));
  }

  if (!parsed.data.active && parsed.data.userId === user.id) {
    return fail(
      "POLICY_DENIED",
      "Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif."
    );
  }

  const updatedRes = await updateIdentityUserActiveState({
    userId: parsed.data.userId,
    active: parsed.data.active,
    actorId: user.id,
  });
  if (!updatedRes.success) return updatedRes;

  await recordAuditLog({
    organizationId: user.memberships[0]?.organizationId ?? null,
    serviceUnitId: user.memberships[0]?.serviceUnitId ?? null,
    actorId: user.id,
    action: parsed.data.active ? "UserActivated" : "UserDeactivated",
    entityType: "user",
    entityId: parsed.data.userId,
    description: parsed.data.active
      ? `Pengguna ${updatedRes.data.name} diaktifkan kembali.`
      : `Pengguna dinonaktifkan (${updatedRes.data.name}).`,
    metadata: {
      active: parsed.data.active,
      reason: parsed.data.reason ?? null,
    },
  });

  return ok({
    userId: updatedRes.data.id,
    active: updatedRes.data.active,
  });
}

/**
 * Tab 2 — Dynamic Custom Role Creation Without Code/Deploy (05 §16, Product Owner Rule #1).
 */
export async function createCustomRole(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<ActionResult<AdminRoleRecordDTO>> {
  const parsed = createCustomRoleSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ??
        getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const authz = authorizeManageRoles(user);
  if (!authz.success) return authz;
  if (!user?.id) {
    return fail("UNAUTHORIZED", getHumanErrorMessage("UNAUTHORIZED"));
  }

  const existingRoles = await findAllRolesWithDetails();
  if (existingRoles.some((r) => r.code === parsed.data.code)) {
    return fail(
      "RESOURCE_CONFLICT",
      `Kode peran "${parsed.data.code}" sudah digunakan. Silakan gunakan kode lain.`
    );
  }

  const created = await insertCustomRoleWithPermissions({
    code: parsed.data.code,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    permissionCodes: Array.from(new Set(parsed.data.permissionCodes)),
    actorId: user.id,
  });

  if (!created) {
    return fail(
      "VALIDATION_FAILED",
      "Terdapat kode hak akses yang tidak terdaftar pada registri sistem."
    );
  }

  await recordAuditLog({
    organizationId: user.memberships[0]?.organizationId ?? null,
    serviceUnitId: user.memberships[0]?.serviceUnitId ?? null,
    actorId: user.id,
    action: "CustomRoleCreated",
    entityType: "role",
    entityId: created.id,
    description: `Membuat peran kustom baru "${created.name}" (${created.code}) dengan ${created.permissionCodes.length} hak akses.`,
    metadata: {
      code: created.code,
      name: created.name,
      permissionCodes: created.permissionCodes,
    },
  });

  return ok(created);
}

/**
 * Tab 4 — Dynamic Per-User Permission Override (GRANT / REVOKE) + Audit (05 §10–11, §18, D-20).
 * Effective immediately on the next request without re-login or redeploy.
 */
export async function applyUserPermissionOverride(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<
  ActionResult<{
    userId: string;
    permissionCode: string;
    mode: "GRANT" | "REVOKE";
  }>
> {
  const parsed = setPermissionOverrideSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ??
        getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const authz = authorizeManagePermissions(user);
  if (!authz.success) return authz;
  if (!user?.id) {
    return fail("UNAUTHORIZED", getHumanErrorMessage("UNAUTHORIZED"));
  }

  const registry = await findAllPermissionsRegistry();
  if (!registry.some((p) => p.code === parsed.data.permissionCode)) {
    return fail(
      "RESOURCE_NOT_FOUND",
      `Kode hak akses "${parsed.data.permissionCode}" tidak ditemukan dalam registri.`
    );
  }

  await upsertUserPermissionOverride({
    userId: parsed.data.userId,
    permissionCode: parsed.data.permissionCode,
    mode: parsed.data.mode,
    reason: parsed.data.reason,
    actorId: user.id,
  });

  await recordAuditLog({
    organizationId: user.memberships[0]?.organizationId ?? null,
    serviceUnitId: user.memberships[0]?.serviceUnitId ?? null,
    actorId: user.id,
    action:
      parsed.data.mode === "GRANT"
        ? "PermissionOverrideGranted"
        : "PermissionOverrideRevoked",
    entityType: "user_permission",
    entityId: `${parsed.data.userId}:${parsed.data.permissionCode}`,
    description:
      parsed.data.mode === "GRANT"
        ? `Memberikan hak akses khusus "${parsed.data.permissionCode}" kepada pengguna (Alasan: ${parsed.data.reason}).`
        : `Mencabut hak akses "${parsed.data.permissionCode}" dari pengguna (Alasan: ${parsed.data.reason}).`,
    metadata: {
      targetUserId: parsed.data.userId,
      permissionCode: parsed.data.permissionCode,
      mode: parsed.data.mode,
      reason: parsed.data.reason,
    },
  });

  return ok({
    userId: parsed.data.userId,
    permissionCode: parsed.data.permissionCode,
    mode: parsed.data.mode,
  });
}

/**
 * Tab 5 — Assign / Update User Scope Membership + Audit (05 §12, §18).
 */
export async function updateUserScopeAssignment(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<
  ActionResult<{
    membershipId: string;
    userId: string;
    serviceUnitId: string;
    active: boolean;
  }>
> {
  const parsed = assignUserScopeSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ??
        getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const authz = authorizeManageUsers(user);
  if (!authz.success) return authz;
  if (!user?.id) {
    return fail("UNAUTHORIZED", getHumanErrorMessage("UNAUTHORIZED"));
  }

  const membership = await assignOrUpdateUserScopeMembership({
    userId: parsed.data.userId,
    organizationId: parsed.data.organizationId,
    serviceUnitId: parsed.data.serviceUnitId,
    programId: parsed.data.programId ?? null,
    active: parsed.data.active,
    actorId: user.id,
  });

  await recordAuditLog({
    organizationId: parsed.data.organizationId,
    serviceUnitId: parsed.data.serviceUnitId,
    actorId: user.id,
    action: "UserScopeUpdated",
    entityType: "user_membership",
    entityId: membership.id,
    description: parsed.data.active
      ? `Menetapkan lingkup penugasan unit layanan kepada pengguna.`
      : `Menonaktifkan lingkup penugasan unit layanan pengguna.`,
    metadata: {
      targetUserId: parsed.data.userId,
      organizationId: parsed.data.organizationId,
      serviceUnitId: parsed.data.serviceUnitId,
      programId: parsed.data.programId ?? null,
      active: parsed.data.active,
    },
  });

  return ok({
    membershipId: membership.id,
    userId: membership.userId,
    serviceUnitId: membership.serviceUnitId,
    active: membership.active,
  });
}

export async function resetUserToDefaultPassword(
  user: SessionUser | null | undefined,
  targetUserId: string
): Promise<ActionResult<{ reset: true }>> {
  const authz = authorizeManageUsers(user);
  if (!authz.success) return authz;

  if (!targetUserId || !user?.id) {
    return fail("VALIDATION_FAILED", getHumanErrorMessage("VALIDATION_FAILED"));
  }

  const res = await resetIdentityUserPasswordToDefault({
    userId: targetUserId,
    actorId: user.id,
  });
  if (!res.success) return res;

  await recordAuditLog({
    organizationId: user.memberships[0]?.organizationId ?? null,
    serviceUnitId: user.memberships[0]?.serviceUnitId ?? null,
    actorId: user.id,
    action: "USER_PASSWORD_RESET_TO_DEFAULT",
    entityType: "user",
    entityId: targetUserId,
    description:
      "Menyetel ulang kata sandi pengguna ke sandi bawaan (wajib ganti saat masuk berikutnya).",
    metadata: {
      targetUserId,
    },
  });

  return ok({ reset: true });
}
