import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { archiveColumns, auditColumns, newId } from "../_shared";

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().$defaultFn(newId),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(true),
  ...auditColumns,
  ...archiveColumns,
});

export type RoleRow = typeof roles.$inferSelect;
export type NewRoleRow = typeof roles.$inferInsert;

