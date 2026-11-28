import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { rolePermissions, roles, users } from "@/db/schema";
import type { SessionUser } from "@/server/auth/session";
import {
  applyUserPermissionOverride,
  createCustomRole,
  deleteCustomRole,
  removeUserPermissionOverride,
  resolveAccess,
  updateCustomRole,
  updateUserRoleAssignments,
} from "./index";

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

describe("Administration RBAC Integration — Custom Roles, Assignment Guard & Live Override Resolution", () => {
  let adminSession!: SessionUser;
  let volunteerSession!: SessionUser;
  let originalVolunteerRoles: string[] = [];
  const createdRoleIds: string[] = [];
  const uniqueSuffix = Date.now().toString().slice(-6);
  const testRoleCode = `TEST_ROLE_${uniqueSuffix}`;

  beforeAll(async () => {
    adminSession = await loadSessionByEmail("superadmin@pmki.org");
    volunteerSession = await loadSessionByEmail("relawan.lawang@pmki.org");
    originalVolunteerRoles = [...volunteerSession.roles];
  });

  afterAll(async () => {
    if (volunteerSession && originalVolunteerRoles.length > 0) {
      await updateUserRoleAssignments(adminSession, {
        userId: volunteerSession.id,
        roleCodes: originalVolunteerRoles,
      });
      await removeUserPermissionOverride(
        adminSession,
        volunteerSession.id,
        "schedule.read"
      );
      await removeUserPermissionOverride(
        adminSession,
        volunteerSession.id,
        "audit.read"
      );
    }
    if (createdRoleIds.length > 0) {
      await db
        .delete(rolePermissions)
        .where(inArray(rolePermissions.roleId, createdRoleIds));
      await db.delete(roles).where(inArray(roles.id, createdRoleIds));
    }
  });

  it("executes end-to-end custom role CRUD, live per-request override resolution (GRANT & REVOKE), and archive guard", async () => {
    const createRes = await createCustomRole(adminSession, {
      code: testRoleCode,
      name: `Relawan Uji ${uniqueSuffix}`,
      description: "Peran uji integrasi RBAC.",
      permissionCodes: ["student.read", "media.read"],
    });
    expect(createRes.success).toBe(true);
    if (!createRes.success) return;
    createdRoleIds.push(createRes.data.id);

    const updateRes = await updateCustomRole(adminSession, {
      roleId: createRes.data.id,
      name: `Relawan Uji Terpadu ${uniqueSuffix}`,
      description: "Diperbarui dalam integration test.",
      permissionCodes: ["student.read", "media.read", "consent.read"],
    });
    expect(updateRes.success).toBe(true);
    if (updateRes.success) {
      expect(updateRes.data.permissionCodes).toContain("consent.read");
    }

    const assignRes = await updateUserRoleAssignments(adminSession, {
      userId: volunteerSession.id,
      roleCodes: [...originalVolunteerRoles, testRoleCode],
    });
    expect(assignRes.success).toBe(true);

    const blockedDelete = await deleteCustomRole(adminSession, {
      roleId: createRes.data.id,
    });
    expect(blockedDelete.success).toBe(false);
    if (!blockedDelete.success) {
      expect(blockedDelete.error.code).toBe("RESOURCE_CONFLICT");
    }

    // Grant extra permission + Revoke role-inherited permission (REVOKE wins immediately)
    await applyUserPermissionOverride(adminSession, {
      userId: volunteerSession.id,
      permissionCode: "audit.read",
      mode: "GRANT",
      reason: "Uji integrasi pemberian izin khusus.",
    });
    await applyUserPermissionOverride(adminSession, {
      userId: volunteerSession.id,
      permissionCode: "schedule.read",
      mode: "REVOKE",
      reason: "Uji integrasi pencabutan paksa REVOKE.",
    });

    const liveAccess = await resolveAccess(volunteerSession.id);
    expect(liveAccess.permissions).toContain("consent.read");
    expect(liveAccess.permissions).toContain("audit.read");
    expect(liveAccess.permissions).not.toContain("schedule.read");

    // Remove override -> restores role default immediately
    await removeUserPermissionOverride(
      adminSession,
      volunteerSession.id,
      "schedule.read"
    );
    await removeUserPermissionOverride(
      adminSession,
      volunteerSession.id,
      "audit.read"
    );
    const restoredAccess = await resolveAccess(volunteerSession.id);
    expect(restoredAccess.permissions).toContain("schedule.read");

    // Unassign custom role -> soft-archive succeeds & archived role permissions no longer apply
    await updateUserRoleAssignments(adminSession, {
      userId: volunteerSession.id,
      roleCodes: originalVolunteerRoles,
    });
    const archiveRes = await deleteCustomRole(adminSession, {
      roleId: createRes.data.id,
    });
    expect(archiveRes.success).toBe(true);
  });
});
