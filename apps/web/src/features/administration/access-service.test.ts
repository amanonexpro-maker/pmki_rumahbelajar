import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionUser } from "@/server/auth/session";

const mocks = vi.hoisted(() => ({
  recordAuditLog: vi.fn(),
  findRoleByIdWithUsage: vi.fn(),
  updateCustomRoleWithPermissions: vi.fn(),
  archiveCustomRole: vi.fn(),
  findAllPermissionsRegistry: vi.fn(),
  upsertUserPermissionOverride: vi.fn(),
  deleteUserPermissionOverride: vi.fn(),
  updateIdentityUserActiveState: vi.fn(),
  resetIdentityUserPasswordToDefault: vi.fn(),
}));

vi.mock("@/features/audit", () => ({
  recordAuditLog: mocks.recordAuditLog,
}));

vi.mock("@/features/identity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/identity")>();
  return {
    ...actual,
    updateIdentityUserActiveState: mocks.updateIdentityUserActiveState,
    resetIdentityUserPasswordToDefault: mocks.resetIdentityUserPasswordToDefault,
  };
});

vi.mock("./repositories/rbac-repository", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("./repositories/rbac-repository")>();
  return {
    ...actual,
    findRoleByIdWithUsage: mocks.findRoleByIdWithUsage,
    updateCustomRoleWithPermissions: mocks.updateCustomRoleWithPermissions,
    archiveCustomRole: mocks.archiveCustomRole,
    findAllPermissionsRegistry: mocks.findAllPermissionsRegistry,
    upsertUserPermissionOverride: mocks.upsertUserPermissionOverride,
    deleteUserPermissionOverride: mocks.deleteUserPermissionOverride,
  };
});

import {
  applyUserPermissionOverride,
  computeEffectivePermissions,
  deleteCustomRole,
  removeUserPermissionOverride,
  resetUserToDefaultPassword,
  setPlatformUserActiveState,
  updateCustomRole,
} from "./services/access-service";

const ORG_ID = "01950000-0000-7000-8000-000000000001";
const UNIT_ID = "01950000-0000-7000-8000-000000000010";
const ROLE_ID = "01950000-0000-7000-8000-000000000050";
const TARGET_USER_ID = "01950000-0000-7000-8000-000000000099";

const adminSession: SessionUser = {
  id: "01950000-0000-7000-8000-000000000088",
  email: "superadmin@pmki.org",
  name: "Admin PMKI",
  roles: ["PLATFORM_ADMIN"],
  permissions: ["user.read", "user.update", "role.manage", "permission.manage"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

describe("Administration Access Service — RBAC Resolution, Custom Role Lifecycle & Overrides", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enforces REVOKE-always-wins in computeEffectivePermissions (05 §11)", () => {
    const resolved = computeEffectivePermissions(
      ["student.read", "attendance.read", "development.read"],
      ["guardian.read", "development.read"],
      ["development.read"]
    );
    expect(resolved).toEqual([
      "attendance.read",
      "guardian.read",
      "student.read",
    ]);
    expect(resolved).not.toContain("development.read");
  });

  it("blocks editing or deleting system roles, blocks deleting assigned custom roles, and archives unused custom roles with audit", async () => {
    mocks.findRoleByIdWithUsage.mockResolvedValueOnce({
      id: ROLE_ID,
      code: "TEACHER",
      name: "Pengajar",
      description: null,
      isSystem: true,
      archivedAt: null,
      assignedUserCount: 3,
    });
    const sysEdit = await updateCustomRole(adminSession, {
      roleId: ROLE_ID,
      name: "Pengajar Baru",
      permissionCodes: ["student.read"],
    });
    expect(sysEdit.success).toBe(false);
    if (!sysEdit.success) expect(sysEdit.error.code).toBe("POLICY_DENIED");

    mocks.findRoleByIdWithUsage.mockResolvedValueOnce({
      id: ROLE_ID,
      code: "RELAWAN_MEDIA",
      name: "Relawan Media",
      description: null,
      isSystem: false,
      archivedAt: null,
      assignedUserCount: 2,
    });
    const inUseDelete = await deleteCustomRole(adminSession, { roleId: ROLE_ID });
    expect(inUseDelete.success).toBe(false);
    if (!inUseDelete.success) {
      expect(inUseDelete.error.code).toBe("RESOURCE_CONFLICT");
    }

    mocks.findRoleByIdWithUsage.mockResolvedValueOnce({
      id: ROLE_ID,
      code: "RELAWAN_MEDIA",
      name: "Relawan Media",
      description: null,
      isSystem: false,
      archivedAt: null,
      assignedUserCount: 0,
    });
    mocks.archiveCustomRole.mockResolvedValueOnce(true);
    const okArchive = await deleteCustomRole(adminSession, { roleId: ROLE_ID });
    expect(okArchive.success).toBe(true);
    expect(mocks.recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CustomRoleArchived" })
    );
  });

  it("records PascalCase audit actions for overrides and one-time password resets without leaking password to audit metadata", async () => {
    mocks.findAllPermissionsRegistry.mockResolvedValueOnce([
      {
        id: "p1",
        code: "guardian.read",
        name: "Lihat data wali",
        module: "students",
        description: null,
      },
    ]);
    const grantRes = await applyUserPermissionOverride(adminSession, {
      userId: TARGET_USER_ID,
      permissionCode: "guardian.read",
      mode: "GRANT",
      reason: "Menghubungi wali peserta didik baru.",
    });
    expect(grantRes.success).toBe(true);
    expect(mocks.recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "PermissionOverrideGranted" })
    );

    const removeRes = await removeUserPermissionOverride(
      adminSession,
      TARGET_USER_ID,
      "guardian.read"
    );
    expect(removeRes.success).toBe(true);
    expect(mocks.recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "PermissionOverrideRemoved" })
    );

    mocks.resetIdentityUserPasswordToDefault.mockResolvedValueOnce({
      success: true,
      data: { reset: true, temporaryPassword: "Pmki-Ab23-Cd45!" },
    });
    const resetRes = await resetUserToDefaultPassword(
      adminSession,
      TARGET_USER_ID
    );
    expect(resetRes.success).toBe(true);
    if (resetRes.success) {
      expect(resetRes.data.temporaryPassword).toBe("Pmki-Ab23-Cd45!");
    }
    const lastAuditCall = mocks.recordAuditLog.mock.calls.at(-1)?.[0];
    expect(lastAuditCall?.action).toBe("UserPasswordReset");
    expect(JSON.stringify(lastAuditCall?.metadata)).not.toContain(
      "Pmki-Ab23-Cd45!"
    );
  });

  it("prevents administrators from deactivating their own active account", async () => {
    const selfDeactivate = await setPlatformUserActiveState(adminSession, {
      userId: adminSession.id,
      active: false,
      reason: "Mencoba menonaktifkan diri sendiri.",
    });
    expect(selfDeactivate.success).toBe(false);
    if (!selfDeactivate.success) {
      expect(selfDeactivate.error.code).toBe("POLICY_DENIED");
    }
  });
});

