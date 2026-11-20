import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { archiveColumns, auditColumns, newId } from "../_shared";
import { serviceUnits } from "../organization/service-units";

export const developmentCategories = pgTable(
  "development_categories",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    serviceUnitId: uuid("service_unit_id")
      .notNull()
      .references(() => serviceUnits.id, { onDelete: "restrict" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [index("development_categories_unit_idx").on(t.serviceUnitId)]
);

