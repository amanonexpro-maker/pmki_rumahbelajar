import { describe, expect, it } from "vitest";
import { computeEffectivePermissions } from "@/features/administration/services/permission-resolver";
import type { SessionUser } from "@/server/auth/session";
import { authorize, can, canAccessConfidential, hasScopeAccess } from "./can";

const ORG_ID = "01950000-0000-7000-8000-000000000001";
const UNIT_LAWANG = "01950000-0000-7000-8000-000000000010";
const UNIT_OTHER = "01950000-0000-7000-8000-000000000099";
const PROG_RUMAH_BELAJAR = "01950000-0000-7000-8000-000000000100";

const teacherSession: SessionUser = {
  id: "user-teacher-1",
  email: "guru.matematika@pmki.org",
  name: "Pak Budi",
  roles: ["TEACHER"],
  permissions: ["student.read", "attendance.record", "development.create"],
  memberships: [
    {
      organizationId: ORG_ID,
      serviceUnitId: UNIT_LAWANG,
      programId: PROG_RUMAH_BELAJAR,
    },
  ],
};

const approverSession: SessionUser = {
  id: "user-approver-1",
  email: "penyetuju.mupel@pmki.org",
  name: "Pdt. Andreas",
  roles: ["APPROVER"],
  permissions: ["report.read", "report.approve"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_LAWANG }],
};

const platformAdminSession: SessionUser = {
  id: "user-admin-1",
  email: "superadmin@pmki.org",
  name: "Admin PMKI",
  roles: ["PLATFORM_ADMIN"],
  permissions: ["report.read", "report.approve", "user.manage", "guardian.read"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_LAWANG }],
};

describe("computeEffectivePermissions (05 §11)", () => {
  it("resolves Role -> GRANT -> REVOKE where REVOKE always wins", () => {
    const result = computeEffectivePermissions(
      ["student.read", "attendance.record", "development.create"],
      ["guardian.read", "development.create"],
      ["development.create"]
    );

    expect(result).toContain("student.read");
    expect(result).toContain("attendance.record");
    expect(result).toContain("guardian.read");
    expect(result).not.toContain("development.create");
  });
});

describe("RBAC Authorization Engine (05 §3, §12, §13–15)", () => {
  it("denies unauthenticated users with UNAUTHORIZED (Default Deny)", () => {
    const res = authorize(null, "student.read");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("allows TEACHER attendance.record and denies guardian.read by default", () => {
    expect(can(teacherSession, "attendance.record", { serviceUnitId: UNIT_LAWANG })).toBe(true);

    const denied = authorize(teacherSession, "guardian.read", {
      serviceUnitId: UNIT_LAWANG,
    });
    expect(denied.success).toBe(false);
    if (!denied.success) {
      expect(denied.error.code).toBe("PERMISSION_DENIED");
    }
  });

  it("denies cross service-unit access with SCOPE_DENIED", () => {
    expect(hasScopeAccess(teacherSession, { serviceUnitId: UNIT_LAWANG })).toBe(true);
    expect(hasScopeAccess(teacherSession, { serviceUnitId: UNIT_OTHER })).toBe(false);

    const res = authorize(teacherSession, "attendance.record", {
      serviceUnitId: UNIT_OTHER,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe("SCOPE_DENIED");
    }
  });

  it("enforces Separation of Duties for APPROVER approving own report -> POLICY_DENIED", () => {
    const ownReport = authorize(approverSession, "report.approve", {
      serviceUnitId: UNIT_LAWANG,
      requireSeparationOfDuties: true,
      resourceOwnerId: approverSession.id,
    });
    expect(ownReport.success).toBe(false);
    if (!ownReport.success) {
      expect(ownReport.error.code).toBe("POLICY_DENIED");
    }

    const otherReport = authorize(approverSession, "report.approve", {
      serviceUnitId: UNIT_LAWANG,
      requireSeparationOfDuties: true,
      resourceOwnerId: "someone-else-id",
    });
    expect(otherReport.success).toBe(true);
  });

  it("enforces Separation of Duties EVEN for PLATFORM_ADMIN -> POLICY_DENIED", () => {
    const ownReport = authorize(platformAdminSession, "report.approve", {
      serviceUnitId: UNIT_LAWANG,
      requireSeparationOfDuties: true,
      resourceOwnerId: platformAdminSession.id,
    });
    expect(ownReport.success).toBe(false);
    if (!ownReport.success) {
      expect(ownReport.error.code).toBe("POLICY_DENIED");
    }
  });

  it("protects CONFIDENTIAL data by default unless explicit permission and scope match", () => {
    expect(
      canAccessConfidential(teacherSession, "guardian.read", {
        serviceUnitId: UNIT_LAWANG,
      })
    ).toBe(false);

    expect(
      canAccessConfidential(platformAdminSession, "guardian.read", {
        serviceUnitId: UNIT_LAWANG,
      })
    ).toBe(true);

    expect(
      canAccessConfidential(platformAdminSession, "guardian.read", {
        serviceUnitId: UNIT_OTHER,
      })
    ).toBe(false);
  });
});
