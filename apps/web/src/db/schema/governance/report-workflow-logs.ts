import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { newId, reportStatusEnum } from "../_shared";
import { reports } from "./reports";
import { users } from "../identity/users";

/**
 * Append-only Governance Workflow Log (04 §21, D-14).
 * Immutability (NO UPDATE / NO DELETE for all roles) enforced by PostgreSQL trigger.
 */
export const reportWorkflowLogs = pgTable(
  "report_workflow_logs",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "restrict" }),
    action: text("action").notNull(),
    fromStatus: reportStatusEnum("from_status"),
    toStatus: reportStatusEnum("to_status").notNull(),
    comment: text("comment"),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("report_workflow_logs_report_idx").on(t.reportId)]
);

