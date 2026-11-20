import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import {
  archiveColumns,
  auditColumns,
  dataClassificationEnum,
  newId,
  reportStatusEnum,
  reportTypeEnum,
} from "../_shared";
import { organizations } from "../organization/organizations";
import { serviceUnits } from "../organization/service-units";

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    serviceUnitId: uuid("service_unit_id")
      .notNull()
      .references(() => serviceUnits.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    reportType: reportTypeEnum("report_type").notNull(),
    period: text("period").notNull(),
    summary: text("summary").notNull(),
    status: reportStatusEnum("status").notNull().default("DRAFT"),
    classification: dataClassificationEnum("classification")
      .notNull()
      .default("INTERNAL"),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [
    index("reports_status_idx").on(t.status),
    index("reports_period_idx").on(t.period),
    index("reports_created_by_idx").on(t.createdBy),
  ]
);

