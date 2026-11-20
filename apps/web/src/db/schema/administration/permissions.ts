import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { auditColumns, newId } from "../_shared";

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().$defaultFn(newId),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  module: text("module").notNull(),
  description: text("description"),
  ...auditColumns,
});

export type PermissionRow = typeof permissions.$inferSelect;
export type NewPermissionRow = typeof permissions.$inferInsert;

