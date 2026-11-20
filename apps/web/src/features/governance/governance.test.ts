import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import { REPORT_STATUS_META } from "@/lib/status";
import type { SessionUser } from "@/server/auth/session";
import {
  authorizeApproveReportWithSoD,
  authorizeReviewOrValidateReportWithSoD,
  canApproveReportWithSoD,
} from "./permissions/governance-policy";
import { isValidReportWorkflowTransition } from "./services/governance-service";
import {
  createReportSchema,
  transitionReportStatusSchema,
} from "./validators/governance-validator";

const ORG_ID = "01950000-0000-7000-8000-000000000001";
const UNIT_ID = "01950000-0000-7000-8000-000000000010";

const creatorSession: SessionUser = {
  id: "creator-1",
  email: "koordinator.program@pmki.org",
  name: "Theresia Maria",
  roles: ["PROGRAM_COORDINATOR"],
  permissions: ["report.read", "report.create", "report.review"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

const approverSession: SessionUser = {
  id: "approver-1",
  email: "penyetuju.mupel@pmki.org",
  name: "Pdt. Andreas",
  roles: ["APPROVER"],
  permissions: ["report.read", "report.approve"],
  memberships: [{ organizationId: ORG_ID, serviceUnitId: UNIT_ID }],
};

const platformAdminSession: SessionUser = {
  id: "admin-1",
  email: "superadmin@pmki.org",
  name: "Admin PMKI",
  roles: ["PLATFORM_ADMIN"],
  permissions: [
    "report.read",
    "report.create",
    "report.review",
    "report.approve",
  ],
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

describe("Governance Domain — Workflow State Machine, SoD Policy, Labels & Boundaries", () => {
  it("uses canonical Indonesian report status labels (10 §7)", () => {
    expect(REPORT_STATUS_META.DRAFT.label).toBe("Draft");
    expect(REPORT_STATUS_META.PROGRAM_REVIEW.label).toBe("Tinjauan program");
    expect(REPORT_STATUS_META.UNIT_VALIDATION.label).toBe("Validasi unit");
    expect(REPORT_STATUS_META.ORGANIZATION_APPROVAL.label).toBe(
      "Persetujuan organisasi"
    );
    expect(REPORT_STATUS_META.APPROVED.label).toBe("Disetujui");
    expect(REPORT_STATUS_META.REJECTED.label).toBe("Ditolak");
  });

  it("enforces stored report workflow transitions and rejects illegal stage jumps", () => {
    expect(isValidReportWorkflowTransition("DRAFT", "PROGRAM_REVIEW")).toBe(
      true
    );
    expect(
      isValidReportWorkflowTransition("PROGRAM_REVIEW", "UNIT_VALIDATION")
    ).toBe(true);
    expect(
      isValidReportWorkflowTransition(
        "UNIT_VALIDATION",
        "ORGANIZATION_APPROVAL"
      )
    ).toBe(true);
    expect(
      isValidReportWorkflowTransition("ORGANIZATION_APPROVAL", "APPROVED")
    ).toBe(true);
    expect(isValidReportWorkflowTransition("PROGRAM_REVIEW", "REJECTED")).toBe(
      true
    );
    expect(isValidReportWorkflowTransition("REJECTED", "DRAFT")).toBe(true);

    // Illegal jumps
    expect(isValidReportWorkflowTransition("DRAFT", "APPROVED")).toBe(false);
    expect(isValidReportWorkflowTransition("PROGRAM_REVIEW", "APPROVED")).toBe(
      false
    );
    expect(isValidReportWorkflowTransition("UNIT_VALIDATION", "APPROVED")).toBe(
      false
    );
    expect(isValidReportWorkflowTransition("APPROVED", "DRAFT")).toBe(false);
  });

  it("enforces Separation of Duties with canonical 10 §23 message even for PLATFORM_ADMIN", () => {
    // Approver approving someone else's report -> ALLOWED
    expect(
      canApproveReportWithSoD(approverSession, UNIT_ID, creatorSession.id)
    ).toBe(true);
    expect(
      authorizeApproveReportWithSoD(approverSession, UNIT_ID, creatorSession.id)
        .success
    ).toBe(true);

    // Creator trying to validate/review their OWN report -> POLICY_DENIED with 10 §23 message
    const selfValidate = authorizeReviewOrValidateReportWithSoD(
      creatorSession,
      UNIT_ID,
      creatorSession.id
    );
    expect(selfValidate.success).toBe(false);
    if (!selfValidate.success) {
      expect(selfValidate.error.code).toBe("POLICY_DENIED");
      expect(selfValidate.error.message).toBe(
        PRIVACY_MESSAGES.sodApprovalRestricted
      );
    }

    // Approver trying to approve their OWN report -> POLICY_DENIED with 10 §23 message
    const selfApprove = authorizeApproveReportWithSoD(
      approverSession,
      UNIT_ID,
      approverSession.id
    );
    expect(selfApprove.success).toBe(false);
    if (!selfApprove.success) {
      expect(selfApprove.error.code).toBe("POLICY_DENIED");
      expect(selfApprove.error.message).toBe(
        PRIVACY_MESSAGES.sodApprovalRestricted
      );
    }

    // PLATFORM_ADMIN trying to approve their OWN report -> STILL POLICY_DENIED with 10 §23 message
    const adminSelfApprove = authorizeApproveReportWithSoD(
      platformAdminSession,
      UNIT_ID,
      platformAdminSession.id
    );
    expect(adminSelfApprove.success).toBe(false);
    if (!adminSelfApprove.success) {
      expect(adminSelfApprove.error.code).toBe("POLICY_DENIED");
      expect(adminSelfApprove.error.message).toBe(
        PRIVACY_MESSAGES.sodApprovalRestricted
      );
    }
  });

  it("validates createReportSchema and requires comment when REJECTED", () => {
    expect(
      createReportSchema.safeParse({
        title: "Laporan Kegiatan Belajar Triwulan IV 2026",
        reportType: "ACTIVITY",
        period: "Triwulan IV 2026",
        summary:
          "Pelaksanaan kegiatan bimbingan belajar Sabtu berjalan lancar dengan tingkat kehadiran tinggi.",
      }).success
    ).toBe(true);

    expect(
      transitionReportStatusSchema.safeParse({
        reportId: ORG_ID,
        targetStatus: "REJECTED",
        comment: "",
      }).success
    ).toBe(false);

    expect(
      transitionReportStatusSchema.safeParse({
        reportId: ORG_ID,
        targetStatus: "REJECTED",
        comment: "Mohon lengkapi rekap kehadiran sesi bulan Oktober.",
      }).success
    ).toBe(true);
  });

  it("verifies RED-LINE domain boundary: features/governance never imports other domains' repositories or tables", () => {
    const dir = path.resolve(__dirname);
    const files = collectTsFiles(dir);
    expect(files.length).toBeGreaterThan(4);

    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      expect(source).not.toMatch(
        /@\/features\/(?!governance)[a-z-]+\/(repositories|queries)/
      );
      expect(source).not.toMatch(
        /db\/schema\/(students|attendance|development|publishing|media|consent)/
      );
    }
  });
});

