import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { auditColumns, newId, permissionOverrideModeEnum } from "../_shared";
import { users } from "../identity/users";
import { permissions } from "./permissions";

/**
 * Dynamic per-user permission overrides (05 §10–11).
 * Resolution order: Role Permissions -> GRANT overrides -> REVOKE overrides (REVOKE always wins).
 */
export const userPermissions = pgTable(
  "user_permissions",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    mode: permissionOverrideModeEnum("mode").notNull(),
    reason: text("reason"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex("user_permissions_user_perm_uidx").on(t.userId, t.permissionId),
  ]
);

