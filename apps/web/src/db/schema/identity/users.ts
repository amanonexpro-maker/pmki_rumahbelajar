import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { archiveColumns, auditColumns } from "../_shared";

/**
 * Identity Domain — `public.users` (ADR-13 / D-25 / D-26 / U-09).
 * - `id` MUST match `auth.users.id` (UUID v4 from Supabase Auth).
 * - NO `password_hash` (owned by Supabase Auth).
 * - NO single `role` column (Dynamic RBAC lives in `administration/user_roles`).
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    avatarUrl: text("avatar_url"),
    publicBio: text("public_bio"),
    showOnPublic: boolean("show_on_public").notNull().default(false),
    active: boolean("active").notNull().default(true),
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [index("users_email_idx").on(t.email)]
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;

