import { boolean, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { archiveColumns, auditColumns, newId } from "../_shared";
import { serviceUnits } from "../organization/service-units";

export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    serviceUnitId: uuid("service_unit_id")
      .notNull()
      .references(() => serviceUnits.id, { onDelete: "restrict" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    active: boolean("active").notNull().default(true),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [index("subjects_unit_idx").on(t.serviceUnitId)]
);

