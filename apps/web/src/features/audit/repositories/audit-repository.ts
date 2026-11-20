import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLogs } from "@/db/schema";

export interface CreateAuditLogInput {
  organizationId?: string | null;
  serviceUnitId?: string | null;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
  originalTimestamp?: Date | null;
  syncedAt?: Date | null;
}

/**
 * Audit Domain Repository (11 §18, 04 §23).
 * APPEND-ONLY BY DESIGN: Contains only `insertAuditLog` and read queries (`find*`).
 * Zero UPDATE or DELETE methods exist in this repository, and PostgreSQL trigger
 * `trg_audit_logs_immutable` blocks UPDATE/DELETE at the database level.
 */
export async function insertAuditLog(input: CreateAuditLogInput) {
  const [inserted] = await db
    .insert(auditLogs)
    .values({
      organizationId: input.organizationId ?? null,
      serviceUnitId: input.serviceUnitId ?? null,
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      description: input.description,
      metadata: input.metadata ?? {},
      originalTimestamp: input.originalTimestamp ?? null,
      syncedAt: input.syncedAt ?? null,
    })
    .returning();
  return inserted;
}

export async function findAuditLogsByEntity(
  entityType: string,
  entityId: string
) {
  return db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.entityType, entityType),
        eq(auditLogs.entityId, entityId)
      )
    )
    .orderBy(desc(auditLogs.createdAt));
}

export async function findAuditLogsFiltered(params: {
  search?: string;
  action?: string;
  entityType?: string;
  actorId?: string;
}) {
  const conditions = [];

  if (params.action && params.action !== "ALL") {
    conditions.push(eq(auditLogs.action, params.action));
  }
  if (params.entityType && params.entityType !== "ALL") {
    conditions.push(eq(auditLogs.entityType, params.entityType));
  }
  if (params.actorId && params.actorId !== "ALL") {
    conditions.push(eq(auditLogs.actorId, params.actorId));
  }

  const trimmedSearch = params.search?.trim();
  if (trimmedSearch) {
    const pattern = `%${trimmedSearch}%`;
    const searchCond = or(
      ilike(auditLogs.description, pattern),
      ilike(auditLogs.entityId, pattern),
      ilike(auditLogs.action, pattern)
    );
    if (searchCond) conditions.push(searchCond);
  }

  return db
    .select()
    .from(auditLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);
}
