import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { newId } from "../_shared";
import { users } from "../identity/users";
import { organizations } from "../organization/organizations";
import { serviceUnits } from "../organization/service-units";

/**
 * Append-only Audit Trail (04 §23, D-14).
 * Immutability (NO UPDATE / NO DELETE for all roles) enforced by PostgreSQL trigger.
 */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "restrict",
    }),
    serviceUnitId: uuid("service_unit_id").references(() => serviceUnits.id, {
      onDelete: "restrict",
    }),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    description: text("description").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    originalTimestamp: timestamp("original_timestamp", { withTimezone: true }),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_logs_actor_idx").on(t.actorId),
    index("audit_logs_action_idx").on(t.action),
    index("audit_logs_entity_idx").on(t.entityType),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ]
);

