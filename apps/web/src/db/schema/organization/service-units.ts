import { boolean, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { archiveColumns, auditColumns, newId } from "../_shared";
import { organizations } from "./organizations";

export const serviceUnits = pgTable(
  "service_units",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    location: text("location"),
    active: boolean("active").notNull().default(true),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [index("service_units_org_idx").on(t.organizationId)]
);

export type ServiceUnitRow = typeof serviceUnits.$inferSelect;

