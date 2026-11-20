import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  auditLogs,
  organizations,
  rolePermissions,
  roles,
  serviceUnits,
  userMemberships,
  userPermissions,
  userRoles,
  users,
} from "@/db/schema";
import { listAuditLogsForWorkspace } from "@/features/audit";
import type { SessionUser } from "@/server/auth/session";
import { can } from "@/server/permissions";
import {
  applyUserPermissionOverride,
  createCustomRole,
  provisionNewPlatformUser,
  resolveAccess,
  setPlatformUserActiveState,
  updateUserRoleAssignments,
  updateUserScopeAssignment,
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

describe("Fase 8 Integration — Dynamic Custom Roles, Admin API Provisioning, Instant Overrides & Audit Immutability", () => {
  let platformAdmin!: SessionUser;
  let auditorSession!: SessionUser;
  let teacherSession!: SessionUser;
  let orgId = "";
  let unitId = "";

  const createdRoleIds: string[] = [];
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    platformAdmin = await loadSessionByEmail("superadmin@pmki.org");
    auditorSession = await loadSessionByEmail("auditor@pmki.org");
    teacherSession = await loadSessionByEmail("guru.matematika@pmki.org");

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.code, "PMKI_MUPEL_JATIM"))
      .limit(1);
    const [unit] = await db
      .select()
      .from(serviceUnits)
      .where(eq(serviceUnits.code, "RB_GRIYA_ASIH_LAWANG"))
      .limit(1);

    if (!org || !unit) {
      throw new Error("Seeded org/unit missing.");
    }
    orgId = org.id;
    unitId = unit.id;
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await db
        .delete(userPermissions)
        .where(inArray(userPermissions.userId, createdUserIds));
      await db
        .delete(userRoles)
        .where(inArray(userRoles.userId, createdUserIds));
      await db
        .delete(userMemberships)
        .where(inArray(userMemberships.userId, createdUserIds));
      // Note: `users` referenced by `audit_logs.actor_id` are not hard-deleted;
      // provisioned test user was created by platformAdmin so its row has no actor_id references in audit_logs.
      await db.delete(users).where(inArray(users.id, createdUserIds));

      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      for (const uid of createdUserIds) {
        await supabaseAdmin.auth.admin.deleteUser(uid);
      }
    }

    if (createdRoleIds.length > 0) {
      await db
        .delete(rolePermissions)
        .where(inArray(rolePermissions.roleId, createdRoleIds));
      await db.delete(roles).where(inArray(roles.id, createdRoleIds));
    }
  });

  it("creates a custom role without code changes, provisions a user via Supabase Admin API, and applies instant GRANT/REVOKE overrides & scope updates with full audit trail", async () => {
    const customRoleCode = `KOORDINATOR_REMAJA_${Date.now() % 10000}`;

    // 1. Create custom role without coding ("Koordinator Remaja")
    const roleRes = await createCustomRole(platformAdmin, {
      code: customRoleCode,
      name: "Koordinator Remaja",
      description: "Pendamping kegiatan belajar dan karakter remaja SMP.",
      permissionCodes: ["student.read", "attendance.read", "development.read"],
    });
    expect(roleRes.success).toBe(true);
    if (!roleRes.success) return;
    createdRoleIds.push(roleRes.data.id);
    expect(roleRes.data.isSystem).toBe(false);
    expect(roleRes.data.permissionCodes).toEqual([
      "attendance.read",
      "development.read",
      "student.read",
    ]);

    // 2. Provision new user via Supabase Admin API assigned to the custom role
    const testEmail = `koordinator.remaja.${Date.now()}@pmki.org`;
    const provRes = await provisionNewPlatformUser(platformAdmin, {
      name: "Yohana Kartika S.Pd",
      email: testEmail,
      initialPassword: "PmkiUser2026!",
      roleCode: customRoleCode,
      organizationId: orgId,
      serviceUnitId: unitId,
    });
    expect(provRes.success).toBe(true);
    if (!provRes.success) return;
    const newUserId = provRes.data.userId;
    createdUserIds.push(newUserId);

    // 3. Verify custom role works end-to-end immediately via resolveAccess
    const initialAccess = await resolveAccess(newUserId);
    expect(initialAccess.active).toBe(true);
    expect(initialAccess.roles).toContain(customRoleCode);
    expect(initialAccess.permissions).toContain("student.read");
    expect(initialAccess.permissions).toContain("development.read");
    expect(initialAccess.permissions).not.toContain("guardian.read");

    const session1: SessionUser = {
      id: newUserId,
      email: testEmail,
      name: initialAccess.name,
      roles: initialAccess.roles,
      permissions: initialAccess.permissions,
      memberships: initialAccess.memberships,
    };
    expect(can(session1, "student.read", { serviceUnitId: unitId })).toBe(true);
    expect(can(session1, "guardian.read", { serviceUnitId: unitId })).toBe(
      false
    );

    // 4. Instant GRANT override (`guardian.read`) -> effective immediately on next resolveAccess
    const grantRes = await applyUserPermissionOverride(platformAdmin, {
      userId: newUserId,
      permissionCode: "guardian.read",
      mode: "GRANT",
      reason: "Pendampingan komunikasi wali remaja SMP.",
    });
    expect(grantRes.success).toBe(true);

    const afterGrant = await resolveAccess(newUserId);
    expect(afterGrant.permissions).toContain("guardian.read");

    // 5. Instant REVOKE override (`development.read`) -> REVOKE wins over custom role default!
    const revokeRes = await applyUserPermissionOverride(platformAdmin, {
      userId: newUserId,
      permissionCode: "development.read",
      mode: "REVOKE",
      reason: "Pembatasan akses catatan perkembangan selama masa orientasi.",
    });
    expect(revokeRes.success).toBe(true);

    const afterRevoke = await resolveAccess(newUserId);
    expect(afterRevoke.permissions).not.toContain("development.read");

    // 6. Update user role assignments -> audited as "Peran diperbarui"
    const roleUpdateRes = await updateUserRoleAssignments(platformAdmin, {
      userId: newUserId,
      roleCodes: [customRoleCode, "VOLUNTEER"],
      reason: "Penambahan peran relawan pendamping.",
    });
    expect(roleUpdateRes.success).toBe(true);

    // 7. Update scope assignment (deactivate membership) -> immediately removes scope access
    const scopeDisableRes = await updateUserScopeAssignment(platformAdmin, {
      userId: newUserId,
      organizationId: orgId,
      serviceUnitId: unitId,
      active: false,
    });
    expect(scopeDisableRes.success).toBe(true);

    const afterScopeDisable = await resolveAccess(newUserId);
    expect(afterScopeDisable.memberships.length).toBe(0);

    // 8. Soft deactivate user -> immediately denies all access (Default Deny)
    const deactivateRes = await setPlatformUserActiveState(platformAdmin, {
      userId: newUserId,
      active: false,
      reason: "Masa tugas koordinator remaja selesai.",
    });
    expect(deactivateRes.success).toBe(true);

    const afterDeactivate = await resolveAccess(newUserId);
    expect(afterDeactivate.active).toBe(false);
    expect(afterDeactivate.permissions).toEqual([]);

    // Self-deactivation by active admin MUST be rejected with POLICY_DENIED
    const selfDeactivate = await setPlatformUserActiveState(platformAdmin, {
      userId: platformAdmin.id,
      active: false,
      reason: "Uji nonaktifkan diri sendiri.",
    });
    expect(selfDeactivate.success).toBe(false);
    if (!selfDeactivate.success) {
      expect(selfDeactivate.error.code).toBe("POLICY_DENIED");
    }
  });

  it("verifies complete audit trail coverage for all administration actions and proves audit_logs immutability in PostgreSQL", async () => {
    // 1. Auditor can read audit trail; regular Teacher cannot
    const teacherAuditRes = await listAuditLogsForWorkspace(teacherSession);
    expect(teacherAuditRes.success).toBe(false);
    if (!teacherAuditRes.success) {
      expect(teacherAuditRes.error.code).toBe("PERMISSION_DENIED");
    }

    const auditorRes = await listAuditLogsForWorkspace(auditorSession, {
      pageSize: 50,
    });
    expect(auditorRes.success).toBe(true);
    if (!auditorRes.success) return;

    const recordedActions = new Set(auditorRes.data.items.map((i) => i.action));
    expect(recordedActions.has("CustomRoleCreated")).toBe(true);
    expect(recordedActions.has("UserProvisioned")).toBe(true);
    expect(recordedActions.has("PermissionOverrideGranted")).toBe(true);
    expect(recordedActions.has("PermissionOverrideRevoked")).toBe(true);
    expect(recordedActions.has("UserRolesUpdated")).toBe(true);
    expect(recordedActions.has("UserScopeUpdated")).toBe(true);
    expect(recordedActions.has("UserDeactivated")).toBe(true);

    // 2. Verify PostgreSQL trigger `trg_audit_logs_immutable` blocks UPDATE and DELETE
    const sampleAuditId = auditorRes.data.items[0]!.id;
    await expect(
      db
        .update(auditLogs)
        .set({ description: "Upaya manipulasi jejak audit" })
        .where(eq(auditLogs.id, sampleAuditId))
    ).rejects.toThrow();

    await expect(
      db.delete(auditLogs).where(eq(auditLogs.id, sampleAuditId))
    ).rejects.toThrow();
  });
});

