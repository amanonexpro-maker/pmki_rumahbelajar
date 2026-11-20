import { and, asc, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db/client";
import {
  permissions,
  rolePermissions,
  roles,
  userPermissions,
  userRoles,
} from "@/db/schema";
import type {
  AdminPermissionRecordDTO,
  AdminRoleRecordDTO,
  AdminUserOverrideDTO,
  AdminUserRoleTagDTO,
} from "../types/administration-types";

export interface UserRoleAndPermissionRaw {
  roleCodes: string[];
  rolePermissionCodes: string[];
  grantedCodes: string[];
  revokedCodes: string[];
}

export async function findUserRoleAndPermissionRaw(
  userId: string
): Promise<UserRoleAndPermissionRaw> {
  const assignedRoles = await db
    .select({
      roleId: roles.id,
      roleCode: roles.code,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(and(eq(userRoles.userId, userId), isNull(roles.archivedAt)));

  const roleCodes = assignedRoles.map((r) => r.roleCode);

  const rolePermRows = await db
    .select({
      code: permissions.code,
    })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, userId));

  const now = new Date();
  const overrideRows = await db
    .select({
      code: permissions.code,
      mode: userPermissions.mode,
    })
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(
      and(
        eq(userPermissions.userId, userId),
        or(
          isNull(userPermissions.expiresAt),
          gt(userPermissions.expiresAt, now)
        )
      )
    );

  const grantedCodes: string[] = [];
  const revokedCodes: string[] = [];
  for (const ov of overrideRows) {
    if (ov.mode === "GRANT") grantedCodes.push(ov.code);
    if (ov.mode === "REVOKE") revokedCodes.push(ov.code);
  }

  return {
    roleCodes,
    rolePermissionCodes: rolePermRows.map((p) => p.code),
    grantedCodes,
    revokedCodes,
  };
}

export async function upsertUserPermissionOverride(params: {
  userId: string;
  permissionCode: string;
  mode: "GRANT" | "REVOKE";
  reason?: string;
  actorId?: string | null;
}): Promise<void> {
  const [perm] = await db
    .select({ id: permissions.id })
    .from(permissions)
    .where(eq(permissions.code, params.permissionCode))
    .limit(1);

  if (!perm) {
    throw new Error(`Unknown permission code: ${params.permissionCode}`);
  }

  await db
    .insert(userPermissions)
    .values({
      userId: params.userId,
      permissionId: perm.id,
      mode: params.mode,
      reason: params.reason ?? null,
      createdBy: params.actorId ?? null,
      updatedBy: params.actorId ?? null,
    })
    .onConflictDoUpdate({
      target: [userPermissions.userId, userPermissions.permissionId],
      set: {
        mode: params.mode,
        reason: params.reason ?? null,
        updatedAt: new Date(),
        updatedBy: params.actorId ?? null,
      },
    });
}

export async function deleteUserPermissionOverride(params: {
  userId: string;
  permissionCode: string;
}): Promise<void> {
  const [perm] = await db
    .select({ id: permissions.id })
    .from(permissions)
    .where(eq(permissions.code, params.permissionCode))
    .limit(1);

  if (!perm) return;

  await db
    .delete(userPermissions)
    .where(
      and(
        eq(userPermissions.userId, params.userId),
        eq(userPermissions.permissionId, perm.id)
      )
    );
}

export async function findAllPermissionsRegistry(): Promise<
  AdminPermissionRecordDTO[]
> {
  const rows = await db
    .select()
    .from(permissions)
    .orderBy(asc(permissions.module), asc(permissions.code));

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    module: r.module,
    description: r.description,
  }));
}

export async function findAllRolesWithDetails(): Promise<AdminRoleRecordDTO[]> {
  const [roleRows, rpRows, urRows] = await Promise.all([
    db
      .select()
      .from(roles)
      .where(isNull(roles.archivedAt))
      .orderBy(asc(roles.name)),
    db
      .select({
        roleId: rolePermissions.roleId,
        permCode: permissions.code,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id)),
    db
      .select({
        roleId: userRoles.roleId,
        userId: userRoles.userId,
      })
      .from(userRoles),
  ]);

  const permsByRole = new Map<string, string[]>();
  for (const rp of rpRows) {
    const list = permsByRole.get(rp.roleId) ?? [];
    list.push(rp.permCode);
    permsByRole.set(rp.roleId, list);
  }

  const userCountByRole = new Map<string, number>();
  for (const ur of urRows) {
    userCountByRole.set(ur.roleId, (userCountByRole.get(ur.roleId) ?? 0) + 1);
  }

  return roleRows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    permissionCodes: (permsByRole.get(r.id) ?? []).sort(),
    assignedUserCount: userCountByRole.get(r.id) ?? 0,
  }));
}

export async function findUserRoleAndOverrideMaps(): Promise<{
  rolesByUserId: Map<string, AdminUserRoleTagDTO[]>;
  overridesByUserId: Map<string, AdminUserOverrideDTO[]>;
}> {
  const [urRows, ovRows] = await Promise.all([
    db
      .select({
        userId: userRoles.userId,
        roleId: roles.id,
        roleCode: roles.code,
        roleName: roles.name,
        isSystem: roles.isSystem,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(isNull(roles.archivedAt)),
    db
      .select({
        userId: userPermissions.userId,
        permissionCode: permissions.code,
        permissionName: permissions.name,
        mode: userPermissions.mode,
        reason: userPermissions.reason,
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id)),
  ]);

  const rolesByUserId = new Map<string, AdminUserRoleTagDTO[]>();
  for (const ur of urRows) {
    const list = rolesByUserId.get(ur.userId) ?? [];
    list.push({
      id: ur.roleId,
      code: ur.roleCode,
      name: ur.roleName,
      isSystem: ur.isSystem,
    });
    rolesByUserId.set(ur.userId, list);
  }

  const overridesByUserId = new Map<string, AdminUserOverrideDTO[]>();
  for (const ov of ovRows) {
    const list = overridesByUserId.get(ov.userId) ?? [];
    list.push({
      permissionCode: ov.permissionCode,
      permissionName: ov.permissionName,
      mode: ov.mode,
      reason: ov.reason,
    });
    overridesByUserId.set(ov.userId, list);
  }

  return { rolesByUserId, overridesByUserId };
}

export async function insertCustomRoleWithPermissions(params: {
  code: string;
  name: string;
  description?: string | null;
  permissionCodes: string[];
  actorId: string;
}): Promise<AdminRoleRecordDTO | null> {
  const permRows = await db
    .select({ id: permissions.id, code: permissions.code })
    .from(permissions)
    .where(inArray(permissions.code, params.permissionCodes));

  if (permRows.length !== params.permissionCodes.length) {
    return null;
  }

  return db.transaction(async (tx) => {
    const [createdRole] = await tx
      .insert(roles)
      .values({
        code: params.code,
        name: params.name,
        description: params.description ?? null,
        isSystem: false,
        createdBy: params.actorId,
        updatedBy: params.actorId,
      })
      .returning();

    for (const perm of permRows) {
      await tx
        .insert(rolePermissions)
        .values({
          roleId: createdRole.id,
          permissionId: perm.id,
        })
        .onConflictDoNothing();
    }

    return {
      id: createdRole.id,
      code: createdRole.code,
      name: createdRole.name,
      description: createdRole.description,
      isSystem: createdRole.isSystem,
      permissionCodes: permRows.map((p) => p.code).sort(),
      assignedUserCount: 0,
    };
  });
}

export async function replaceUserRolesByCodes(params: {
  userId: string;
  roleCodes: string[];
  actorId: string;
}): Promise<boolean> {
  const matchingRoles = await db
    .select({ id: roles.id, code: roles.code })
    .from(roles)
    .where(
      and(inArray(roles.code, params.roleCodes), isNull(roles.archivedAt))
    );

  if (matchingRoles.length === 0) {
    return false;
  }

  await db.transaction(async (tx) => {
    await tx.delete(userRoles).where(eq(userRoles.userId, params.userId));
    for (const roleRow of matchingRoles) {
      await tx
        .insert(userRoles)
        .values({
          userId: params.userId,
          roleId: roleRow.id,
          createdBy: params.actorId,
          updatedBy: params.actorId,
        })
        .onConflictDoNothing();
    }
  });

  return true;
}
