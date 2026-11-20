import { boolean, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { archiveColumns, auditColumns, newId } from "../_shared";
import { organizations } from "./organizations";
import { serviceUnits } from "./service-units";

/**
 * Programs owned by Organization domain (U-02) to support `user_memberships.program_id`.
 */
export const programs = pgTable(
  "programs",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    serviceUnitId: uuid("service_unit_id")
      .notNull()
      .references(() => serviceUnits.id, { onDelete: "restrict" }),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    active: boolean("active").notNull().default(true),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [index("programs_unit_idx").on(t.serviceUnitId)]
);

export type ProgramRow = typeof programs.$inferSelect;

