import { boolean, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { archiveColumns, auditColumns, newId } from "../_shared";
import { users } from "../identity/users";
import { organizations } from "../organization/organizations";
import { serviceUnits } from "../organization/service-units";

export const teachers = pgTable(
  "teachers",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    serviceUnitId: uuid("service_unit_id")
      .notNull()
      .references(() => serviceUnits.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    originSchool: text("origin_school"),
    isCoordinator: boolean("is_coordinator").notNull().default(false),
    active: boolean("active").notNull().default(true),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [
    index("teachers_unit_idx").on(t.serviceUnitId),
    index("teachers_org_idx").on(t.organizationId),
  ]
);

