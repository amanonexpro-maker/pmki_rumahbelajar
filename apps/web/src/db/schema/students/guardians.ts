import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { archiveColumns, auditColumns, newId } from "../_shared";
import { serviceUnits } from "../organization/service-units";

export const guardians = pgTable(
  "guardians",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    serviceUnitId: uuid("service_unit_id")
      .notNull()
      .references(() => serviceUnits.id, { onDelete: "restrict" }),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    occupation: text("occupation"),
    address: text("address"),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [index("guardians_unit_idx").on(t.serviceUnitId)]
);

