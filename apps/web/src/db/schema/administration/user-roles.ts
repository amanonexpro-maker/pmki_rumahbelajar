import { pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { auditColumns, newId } from "../_shared";
import { users } from "../identity/users";
import { roles } from "./roles";

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    ...auditColumns,
  },
  (t) => [uniqueIndex("user_roles_user_role_uidx").on(t.userId, t.roleId)]
);

