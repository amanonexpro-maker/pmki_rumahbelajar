import { getUserNamesByIds } from "@/features/identity";
import type { SessionUser } from "@/server/auth/session";
import { ok, type ActionResult } from "@/server/contracts/result";
import {
  emitDomainEvent,
  subscribeDomainEvent,
  type DomainEventPayload,
} from "@/server/events/domain-events";
import { authorizeReadAuditLogs } from "../permissions/audit-policy";
import {
  findAuditLogsByEntity,
  findAuditLogsFiltered,
  insertAuditLog,
  type CreateAuditLogInput,
} from "../repositories/audit-repository";
import {
  getAuditActionLabel,
  type AuditLogFilterParams,
  type AuditLogItemDTO,
  type AuditLogListResultDTO,
} from "../types/audit-types";

let subscribed = false;

/**
 * Ensures the Audit Domain subscribes once to all canonical Domain Events (11 §18, §31).
 */
export function ensureAuditEventSubscriber(): void {
  if (subscribed) return;
  subscribed = true;

  subscribeDomainEvent("*", async (event: DomainEventPayload) => {
    await insertAuditLog({
      organizationId: event.organizationId,
      serviceUnitId: event.serviceUnitId,
      actorId: event.actorId,
      action: event.name,
      entityType: event.entityType,
      entityId: event.entityId,
      description: event.description,
      metadata: event.metadata,
      originalTimestamp: event.occurredAt ?? new Date(),
    });
  });
}

ensureAuditEventSubscriber();

export async function recordAuditLog(input: CreateAuditLogInput) {
  return insertAuditLog(input);
}

export async function recordDomainAuditEvent(event: DomainEventPayload) {
  ensureAuditEventSubscriber();
  await emitDomainEvent(event);
}

export async function listEntityAuditLogs(
  entityType: string,
  entityId: string
) {
  return findAuditLogsByEntity(entityType, entityId);
}

export async function listAuditLogsForWorkspace(
  user: SessionUser | null | undefined,
  filters: AuditLogFilterParams = {}
): Promise<ActionResult<AuditLogListResultDTO>> {
  const authz = authorizeReadAuditLogs(user);
  if (!authz.success) return authz;

  const rows = await findAuditLogsFiltered({
    search: filters.search,
    action: filters.action,
    entityType: filters.entityType,
    actorId: filters.actorId,
  });

  const actorIds = rows
    .map((r) => r.actorId ?? "")
    .filter((id) => id.length > 0);
  const actorNameMap = await getUserNamesByIds(actorIds);

  const allItems: AuditLogItemDTO[] = rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    serviceUnitId: row.serviceUnitId,
    actorId: row.actorId,
    actorName: row.actorId
      ? (actorNameMap.get(row.actorId) ?? "Pengguna PMKI")
      : "Sistem / Publik",
    action: row.action,
    actionLabel: getAuditActionLabel(row.action),
    entityType: row.entityType,
    entityId: row.entityId,
    description: row.description,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    originalTimestamp: row.originalTimestamp
      ? row.originalTimestamp.toISOString()
      : null,
    syncedAt: row.syncedAt ? row.syncedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }));

  const pageSize = Math.max(1, Math.min(50, filters.pageSize ?? 20));
  const totalCount = allItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.max(1, Math.min(totalPages, filters.page ?? 1));
  const startIdx = (page - 1) * pageSize;

  return ok({
    items: allItems.slice(startIdx, startIdx + pageSize),
    totalCount,
    page,
    pageSize,
    totalPages,
  });
}
