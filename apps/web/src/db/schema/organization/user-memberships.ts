import { boolean, index, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { archiveColumns, auditColumns, newId } from "../_shared";
import { users } from "../identity/users";
import { organizations } from "./organizations";
import { serviceUnits } from "./service-units";
import { programs } from "./programs";

export const userMemberships = pgTable(
  "user_memberships",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    serviceUnitId: uuid("service_unit_id")
      .notNull()
      .references(() => serviceUnits.id, { onDelete: "restrict" }),
    programId: uuid("program_id").references(() => programs.id, {
      onDelete: "set null",
    }),
    active: boolean("active").notNull().default(true),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [
    uniqueIndex("user_memberships_user_org_unit_uidx").on(
      t.userId,
      t.organizationId,
      t.serviceUnitId
    ),
    index("user_memberships_user_idx").on(t.userId),
  ]
);

