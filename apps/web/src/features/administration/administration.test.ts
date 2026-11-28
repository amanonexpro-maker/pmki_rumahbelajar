import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { SessionUser } from "@/server/auth/session";
import {
  authorizeManageRoles,
  authorizeManageUsers,
  canAccessSandboxEnvironment,
} from "./permissions/administration-policy";
import {
  createCustomRoleSchema,
  deleteCustomRoleSchema,
  isPermissionCodePolicySafe,
  setPermissionOverrideSchema,
  setUserActiveStatusSchema,
  updateCustomRoleSchema,
} from "./validators/administration-validator";

const ORG_ID = "01950000-0000-7000-8000-000000000001";
const UNIT_ID = "01950000-0000-7000-8000-000000000010";

const platformAdmin: SessionUser = {
  id: "admin-1",
  email: "superadmin@pmki.org",
  name: "Admin PMKI",
  roles: ["PLATFORM_ADMIN"],
  permissions: [
    "user.read",
    "user.create",
    "user.update",
    "role.manage",
    "permission.manage",
  ],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

const unitCoordinator: SessionUser = {
  id: "coord-1",
  email: "pengurus.lawang@pmki.org",
  name: "Ms. Evi",
  roles: ["UNIT_COORDINATOR"],
  permissions: ["user.read", "student.read"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

function collectTsFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      !entry.name.endsWith(".test.ts")
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("Administration Domain — Custom Role Validators, Sandbox Isolation, Policy Guardrails & Boundaries", () => {
  it("validates custom role creation and blocks policy-violating permissions (audit.delete / policy.bypass)", () => {
    expect(isPermissionCodePolicySafe("student.read")).toBe(true);
    expect(isPermissionCodePolicySafe("audit.read")).toBe(true);
    expect(isPermissionCodePolicySafe("audit.delete")).toBe(false);
    expect(isPermissionCodePolicySafe("audit.update")).toBe(false);
    expect(isPermissionCodePolicySafe("policy.bypass")).toBe(false);

    const validCustomRole = createCustomRoleSchema.safeParse({
      code: "KOORDINATOR_REMAJA",
      name: "Koordinator Remaja",
      description: "Mengelola kegiatan pendampingan remaja SMP.",
      permissionCodes: ["student.read", "attendance.read", "development.read"],
    });
    expect(validCustomRole.success).toBe(true);

    const forbiddenCustomRole = createCustomRoleSchema.safeParse({
      code: "ILLEGAL_AUDIT_ROLE",
      name: "Peran Terlarang",
      permissionCodes: ["audit.read", "audit.delete"],
    });
    expect(forbiddenCustomRole.success).toBe(false);

    const validUpdate = updateCustomRoleSchema.safeParse({
      roleId: ORG_ID,
      name: "Koordinator Remaja Senior",
      description: "Pembaruan cakupan pendampingan.",
      permissionCodes: ["student.read", "attendance.read"],
    });
    expect(validUpdate.success).toBe(true);

    const forbiddenUpdate = updateCustomRoleSchema.safeParse({
      roleId: ORG_ID,
      name: "Koordinator Remaja Senior",
      permissionCodes: ["audit.delete"],
    });
    expect(forbiddenUpdate.success).toBe(false);

    expect(deleteCustomRoleSchema.safeParse({ roleId: ORG_ID }).success).toBe(
      true
    );
    expect(
      deleteCustomRoleSchema.safeParse({ roleId: "not-a-uuid" }).success
    ).toBe(false);
  });

  it("requires mandatory reason for permission overrides and user deactivation", () => {
    expect(
      setPermissionOverrideSchema.safeParse({
        userId: ORG_ID,
        permissionCode: "guardian.read",
        mode: "GRANT",
        reason: "",
      }).success
    ).toBe(false);

    expect(
      setPermissionOverrideSchema.safeParse({
        userId: ORG_ID,
        permissionCode: "guardian.read",
        mode: "GRANT",
        reason: "Ditugaskan menghubungi wali peserta didik baru.",
      }).success
    ).toBe(true);

    expect(
      setUserActiveStatusSchema.safeParse({
        userId: ORG_ID,
        active: false,
        reason: "",
      }).success
    ).toBe(false);

    expect(
      setUserActiveStatusSchema.safeParse({
        userId: ORG_ID,
        active: false,
        reason: "Masa tugas relawan telah selesai.",
      }).success
    ).toBe(true);
  });

  it("isolates Lingkungan Uji Coba (Sandbox) strictly to PLATFORM_ADMIN in non-production (10 §26, U-08, U-12)", () => {
    expect(canAccessSandboxEnvironment(platformAdmin, "development")).toBe(
      true
    );
    expect(canAccessSandboxEnvironment(platformAdmin, "test")).toBe(true);
    // Blocked in production even for PLATFORM_ADMIN!
    expect(canAccessSandboxEnvironment(platformAdmin, "production")).toBe(
      false
    );
    // Blocked for non-PLATFORM_ADMIN even in development!
    expect(canAccessSandboxEnvironment(unitCoordinator, "development")).toBe(
      false
    );

    expect(authorizeManageRoles(platformAdmin).success).toBe(true);
    expect(authorizeManageRoles(unitCoordinator).success).toBe(false);
    expect(authorizeManageUsers(unitCoordinator).success).toBe(false);
  });

  it("verifies RED-LINE domain boundary: features/administration never imports other domains' repositories or tables", () => {
    const dir = path.resolve(__dirname);
    const files = collectTsFiles(dir);
    expect(files.length).toBeGreaterThan(4);

    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      expect(source).not.toMatch(
        /@\/features\/(?!administration)[a-z-]+\/(repositories|queries)/
      );
      expect(source).not.toMatch(
        /db\/schema\/(identity|organization|audit|students|academic|attendance|development|consent|media|governance|publishing)/
      );
    }
  });
});

