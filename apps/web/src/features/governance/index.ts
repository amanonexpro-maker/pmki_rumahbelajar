/**
 * Governance Domain Public API (11 §16).
 * Cross-domain consumers MUST ONLY import from this barrel file.
 */
export const DOMAIN_NAME = "governance" as const;

export {
  createGovernanceReport,
  generateStakeholderPublicationDraftFromReport,
  getGovernanceOperationalMetrics,
  isValidReportWorkflowTransition,
  listGovernanceReportsForWorkspace,
  transitionGovernanceReportStatus,
} from "./services/governance-service";

export {
  createGovernanceReportAction,
  generatePublicationFromReportAction,
  transitionGovernanceReportStatusAction,
} from "./actions/governance-actions";

export {
  authorizeApproveReportWithSoD,
  authorizeCreateReport,
  authorizeReadReports,
  authorizeReviewOrValidateReportWithSoD,
  canApproveReportWithSoD,
  canCreateReport,
  canReadReports,
  canReviewReportWithSoD,
} from "./permissions/governance-policy";

export {
  createReportSchema,
  DATA_CLASSIFICATION_VALUES,
  REPORT_STATUS_VALUES,
  REPORT_TYPE_VALUES,
  transitionReportStatusSchema,
  type CreateReportInput,
  type TransitionReportStatusInput,
} from "./validators/governance-validator";

export {
  REPORT_TYPE_LABELS,
  type ReportAggregateMetricsDTO,
  type ReportDTO,
  type ReportTypeCode,
  type ReportWorkflowLogDTO,
} from "./types/governance-types";

export { GovernanceWorkspaceClient } from "./components/governance-workspace-client";

