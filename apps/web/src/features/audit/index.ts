/**
 * Audit Domain Public API (11 §18).
 */
export const DOMAIN_NAME = "audit" as const;

export {
  ensureAuditEventSubscriber,
  listAuditLogsForWorkspace,
  listEntityAuditLogs,
  recordAuditLog,
  recordDomainAuditEvent,
} from "./services/audit-service";

export {
  authorizeReadAuditLogs,
  canReadAuditLogs,
} from "./permissions/audit-policy";

export {
  AUDIT_ACTION_LABELS,
  getAuditActionLabel,
  type AuditLogFilterParams,
  type AuditLogItemDTO,
  type AuditLogListResultDTO,
} from "./types/audit-types";

export { AuditWorkspaceClient } from "./components/audit-workspace-client";

