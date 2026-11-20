"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/server/auth/session";
import type { ActionResult } from "@/server/contracts/result";
import type { ReportStatus } from "@/lib/status";
import {
  createGovernanceReport,
  generateStakeholderPublicationDraftFromReport,
  transitionGovernanceReportStatus,
} from "../services/governance-service";
import type { ReportDTO } from "../types/governance-types";

/**
 * Thin Server Actions for Governance Domain (09 §6–8).
 */
export async function createGovernanceReportAction(
  payload: unknown
): Promise<ActionResult<ReportDTO>> {
  const session = await getCurrentSession();
  const result = await createGovernanceReport(session, payload);
  if (result.success) {
    revalidatePath("/workspace/reports");
  }
  return result;
}

export async function transitionGovernanceReportStatusAction(
  payload: unknown
): Promise<
  ActionResult<{
    reportId: string;
    previousStatus: ReportStatus;
    newStatus: ReportStatus;
    workflowLogId: string;
  }>
> {
  const session = await getCurrentSession();
  const result = await transitionGovernanceReportStatus(session, payload);
  if (result.success) {
    revalidatePath("/workspace/reports");
  }
  return result;
}

export async function generatePublicationFromReportAction(
  reportId: string
): Promise<ActionResult<{ publicationId: string; title: string }>> {
  const session = await getCurrentSession();
  const result = await generateStakeholderPublicationDraftFromReport(
    session,
    reportId
  );
  if (result.success) {
    revalidatePath("/workspace/publishing");
  }
  return result;
}

