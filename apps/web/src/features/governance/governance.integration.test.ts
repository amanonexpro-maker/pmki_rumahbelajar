import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  auditLogs,
  publications,
  reportWorkflowLogs,
  users,
} from "@/db/schema";
import { resolveAccess } from "@/features/administration";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import type { SessionUser } from "@/server/auth/session";
import {
  createGovernanceReport,
  generateStakeholderPublicationDraftFromReport,
  getGovernanceOperationalMetrics,
  listGovernanceReportsForWorkspace,
  transitionGovernanceReportStatus,
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

describe("Fase 7 Integration — Governance Multi-Stage Approval, SoD Enforcement & Append-Only Workflow Logs", () => {
  let programCoordinator!: SessionUser;
  let unitCoordinator!: SessionUser;
  let reviewer!: SessionUser;
  let approver!: SessionUser;
  let platformAdmin!: SessionUser;
  let editor!: SessionUser;

  const createdPublicationIds: string[] = [];

  beforeAll(async () => {
    programCoordinator = await loadSessionByEmail(
      "koordinator.program@pmki.org"
    );
    unitCoordinator = await loadSessionByEmail("pengurus.lawang@pmki.org");
    reviewer = await loadSessionByEmail("peninjau.privasi@pmki.org");
    approver = await loadSessionByEmail("penyetuju.mupel@pmki.org");
    platformAdmin = await loadSessionByEmail("superadmin@pmki.org");
    editor = await loadSessionByEmail("lilian@pmki.org");
  });

  afterAll(async () => {
    if (createdPublicationIds.length > 0) {
      await db
        .delete(publications)
        .where(inArray(publications.id, createdPublicationIds));
    }
    // Note: `reports` with `report_workflow_logs` are not hard-deleted because
    // `report_workflow_logs` is enforced append-only by DB trigger `trg_report_workflow_logs_immutable`.
  });

  it("executes full workflow DRAFT -> PROGRAM_REVIEW -> UNIT_VALIDATION -> ORGANIZATION_APPROVAL -> APPROVED, blocks illegal jumps & self-approval (including PLATFORM_ADMIN), and logs immutable history", async () => {
    // 1. Cross-domain metrics aggregation via services
    const metrics = await getGovernanceOperationalMetrics(unitCoordinator);
    expect(metrics.activeStudentsCount).toBeGreaterThanOrEqual(0);

    // 2. Program Coordinator creates a report draft -> status DRAFT + initial workflow log
    const createRes = await createGovernanceReport(programCoordinator, {
      title: "Laporan Evaluasi Bimbingan Belajar Triwulan IV 2026",
      reportType: "ACTIVITY",
      period: "Triwulan IV 2026",
      summary:
        "Pelaksanaan kegiatan bimbingan belajar Sabtu berjalan konsisten dengan pendampingan literasi dan matematika.",
      classification: "STAKEHOLDER",
    });
    expect(createRes.success).toBe(true);
    if (!createRes.success) return;

    const reportId = createRes.data.id;
    expect(createRes.data.status).toBe("DRAFT");
    expect(createRes.data.workflowLogs.length).toBe(1);

    // 3. Illegal direct jump DRAFT -> APPROVED MUST be rejected with RESOURCE_CONFLICT
    const illegalJump = await transitionGovernanceReportStatus(approver, {
      reportId,
      targetStatus: "APPROVED",
    });
    expect(illegalJump.success).toBe(false);
    if (!illegalJump.success) {
      expect(illegalJump.error.code).toBe("RESOURCE_CONFLICT");
    }

    // 4. Submit DRAFT -> PROGRAM_REVIEW
    const toProgReview = await transitionGovernanceReportStatus(
      programCoordinator,
      {
        reportId,
        targetStatus: "PROGRAM_REVIEW",
        comment: "Draft lengkap dan siap ditinjau substansi programnya.",
      }
    );
    expect(toProgReview.success).toBe(true);

    // 5. Self-validation by report creator MUST be rejected with POLICY_DENIED & canonical 10 §23 message
    const selfValidation = await transitionGovernanceReportStatus(
      programCoordinator,
      {
        reportId,
        targetStatus: "UNIT_VALIDATION",
      }
    );
    expect(selfValidation.success).toBe(false);
    if (!selfValidation.success) {
      expect(selfValidation.error.code).toBe("POLICY_DENIED");
      expect(selfValidation.error.message).toBe(
        PRIVACY_MESSAGES.sodApprovalRestricted
      );
    }

    // 6. Reviewer advances PROGRAM_REVIEW -> UNIT_VALIDATION
    const toUnitVal = await transitionGovernanceReportStatus(reviewer, {
      reportId,
      targetStatus: "UNIT_VALIDATION",
      comment: "Substansi program dan indikator kehadiran sesuai.",
    });
    expect(toUnitVal.success).toBe(true);

    // 7. Unit Coordinator advances UNIT_VALIDATION -> ORGANIZATION_APPROVAL
    const toOrgApp = await transitionGovernanceReportStatus(unitCoordinator, {
      reportId,
      targetStatus: "ORGANIZATION_APPROVAL",
      comment: "Telah divalidasi oleh Koordinator Unit Griya Asih Lawang.",
    });
    expect(toOrgApp.success).toBe(true);

    // 8. Approver advances ORGANIZATION_APPROVAL -> APPROVED
    const toApproved = await transitionGovernanceReportStatus(approver, {
      reportId,
      targetStatus: "APPROVED",
      comment: "Disahkan secara resmi oleh BPH Mupel Jawa Timur.",
    });
    expect(toApproved.success).toBe(true);
    if (toApproved.success) {
      expect(toApproved.data.newStatus).toBe("APPROVED");
    }

    // 9. Verify all 5 workflow log entries are recorded chronologically & ReportApproved event is in audit_logs
    const listRes = await listGovernanceReportsForWorkspace(unitCoordinator);
    expect(listRes.success).toBe(true);
    if (listRes.success) {
      const target = listRes.data.find((r) => r.id === reportId);
      expect(target).toBeTruthy();
      expect(target?.status).toBe("APPROVED");
      expect(target?.workflowLogs.length).toBe(5);
    }

    const reportAudits = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entityId, reportId));
    expect(reportAudits.some((a) => a.action === "ReportApproved")).toBe(true);

    // 10. Allowed cross-domain integration (11 §20: Governance -> Publishing via PublishingService)
    const pubDraft = await generateStakeholderPublicationDraftFromReport(
      editor,
      reportId
    );
    expect(pubDraft.success).toBe(true);
    if (pubDraft.success) {
      createdPublicationIds.push(pubDraft.data.publicationId);
    }
  });

  it("blocks PLATFORM_ADMIN from self-approving their own report and enforces PostgreSQL append-only trigger on report_workflow_logs", async () => {
    // 1. PLATFORM_ADMIN creates a report
    const adminReport = await createGovernanceReport(platformAdmin, {
      title: "Laporan Uji SoD Administrator Platform",
      reportType: "STAKEHOLDER",
      period: "Tahunan 2026",
      summary:
        "Ringkasan evaluasi tahunan pelayanan Rumah Belajar untuk pengujian pemisahan tugas.",
    });
    expect(adminReport.success).toBe(true);
    if (!adminReport.success) return;

    const reportId = adminReport.data.id;
    const initialLogId = adminReport.data.workflowLogs[0]!.id;

    // 2. Advance to PROGRAM_REVIEW -> UNIT_VALIDATION -> ORGANIZATION_APPROVAL via other reviewers
    await transitionGovernanceReportStatus(platformAdmin, {
      reportId,
      targetStatus: "PROGRAM_REVIEW",
    });
    await transitionGovernanceReportStatus(reviewer, {
      reportId,
      targetStatus: "UNIT_VALIDATION",
    });
    await transitionGovernanceReportStatus(unitCoordinator, {
      reportId,
      targetStatus: "ORGANIZATION_APPROVAL",
    });

    // 3. PLATFORM_ADMIN attempting final approval on their OWN report MUST be rejected with POLICY_DENIED
    const adminSelfApprove = await transitionGovernanceReportStatus(
      platformAdmin,
      {
        reportId,
        targetStatus: "APPROVED",
      }
    );
    expect(adminSelfApprove.success).toBe(false);
    if (!adminSelfApprove.success) {
      expect(adminSelfApprove.error.code).toBe("POLICY_DENIED");
      expect(adminSelfApprove.error.message).toBe(
        PRIVACY_MESSAGES.sodApprovalRestricted
      );
    }

    // 4. Verify PostgreSQL trigger `trg_report_workflow_logs_immutable` rejects UPDATE and DELETE
    await expect(
      db
        .update(reportWorkflowLogs)
        .set({ comment: "Manipulasi riwayat" })
        .where(eq(reportWorkflowLogs.id, initialLogId))
    ).rejects.toThrow();

    await expect(
      db
        .delete(reportWorkflowLogs)
        .where(eq(reportWorkflowLogs.id, initialLogId))
    ).rejects.toThrow();
  });
});
