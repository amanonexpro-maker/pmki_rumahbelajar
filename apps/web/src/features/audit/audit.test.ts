import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { SessionUser } from "@/server/auth/session";
import {
  authorizeReadAuditLogs,
  canReadAuditLogs,
} from "./permissions/audit-policy";
import { AUDIT_ACTION_LABELS, getAuditActionLabel } from "./types/audit-types";

const ORG_ID = "01950000-0000-7000-8000-000000000001";
const UNIT_ID = "01950000-0000-7000-8000-000000000010";

const auditorSession: SessionUser = {
  id: "auditor-1",
  email: "auditor@pmki.org",
  name: "Auditor PMKI",
  roles: ["AUDITOR"],
  permissions: ["audit.read", "report.read"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

const teacherSession: SessionUser = {
  id: "teacher-1",
  email: "guru.matematika@pmki.org",
  name: "Pak Budi",
  roles: ["TEACHER"],
  permissions: ["student.read", "attendance.record"],
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

describe("Audit Domain — Canonical Labels, Read-Only Policy, Code Immutability & Boundaries", () => {
  it("maps canonical Indonesian audit action labels (10 §19)", () => {
    expect(AUDIT_ACTION_LABELS.StudentVerified).toBe(
      "Status pendaftaran diperbarui"
    );
    expect(AUDIT_ACTION_LABELS.PublicationPublished).toBe(
      "Publikasi ditayangkan"
    );
    expect(AUDIT_ACTION_LABELS.UserRolesUpdated).toBe("Peran diperbarui");
    expect(AUDIT_ACTION_LABELS.UserDeactivated).toBe("Pengguna dinonaktifkan");
    expect(getAuditActionLabel("UnknownCustomEvent")).toBe(
      "UnknownCustomEvent"
    );
  });

  it("enforces read-only audit.read permission", () => {
    expect(canReadAuditLogs(auditorSession)).toBe(true);
    expect(authorizeReadAuditLogs(auditorSession).success).toBe(true);

    expect(canReadAuditLogs(teacherSession)).toBe(false);
    const denied = authorizeReadAuditLogs(teacherSession);
    expect(denied.success).toBe(false);
    if (!denied.success) {
      expect(denied.error.code).toBe("PERMISSION_DENIED");
    }
  });

  it("proves zero UPDATE or DELETE code paths exist in audit repository and enforces domain boundary", () => {
    const repoPath = path.resolve(
      __dirname,
      "repositories/audit-repository.ts"
    );
    const repoSource = fs.readFileSync(repoPath, "utf8");
    expect(repoSource).not.toMatch(/\.update\s*\(/);
    expect(repoSource).not.toMatch(/\.delete\s*\(/);

    const dir = path.resolve(__dirname);
    const files = collectTsFiles(dir);
    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      expect(source).not.toMatch(
        /@\/features\/(?!audit)[a-z-]+\/(repositories|queries)/
      );
    }
  });
});

