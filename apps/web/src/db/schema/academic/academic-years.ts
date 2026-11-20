import { boolean, date, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { archiveColumns, auditColumns, newId } from "../_shared";
import { serviceUnits } from "../organization/service-units";

export const academicYears = pgTable(
  "academic_years",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    serviceUnitId: uuid("service_unit_id")
      .notNull()
      .references(() => serviceUnits.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    active: boolean("active").notNull().default(false),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [index("academic_years_unit_idx").on(t.serviceUnitId)]
);

