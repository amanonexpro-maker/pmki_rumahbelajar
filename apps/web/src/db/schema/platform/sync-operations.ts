import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { newId, syncOperationStatusEnum } from "../_shared";
import { users } from "../identity/users";

/**
 * Shared Platform Idempotency Ledger for Offline Sync (09 §29, U-04).
 * Guarantees duplicate `operation_id` requests from offline clients are rejected.
 */
export const syncOperations = pgTable(
  "sync_operations",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    operationId: text("operation_id").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    operationType: text("operation_type").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    status: syncOperationStatusEnum("status").notNull().default("PROCESSED"),
    clientCreatedAt: timestamp("client_created_at", {
      withTimezone: true,
    }).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    errorMessage: text("error_message"),
  },
  (t) => [index("sync_operations_user_idx").on(t.userId)]
);

