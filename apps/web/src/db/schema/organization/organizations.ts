import {
  boolean,
  type AnyPgColumn,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import {
  archiveColumns,
  auditColumns,
  newId,
  organizationTypeEnum,
} from "../_shared";

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().$defaultFn(newId),
  parentId: uuid("parent_id").references((): AnyPgColumn => organizations.id, {
    onDelete: "restrict",
  }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  type: organizationTypeEnum("type").notNull(),
  address: text("address"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  active: boolean("active").notNull().default(true),
  ...auditColumns,
  ...archiveColumns,
});

export type OrganizationRow = typeof organizations.$inferSelect;

