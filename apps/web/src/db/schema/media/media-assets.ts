import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  archiveColumns,
  auditColumns,
  mediaCategoryEnum,
  newId,
} from "../_shared";
import { organizations } from "../organization/organizations";
import { serviceUnits } from "../organization/service-units";
import { users } from "../identity/users";

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    serviceUnitId: uuid("service_unit_id")
      .notNull()
      .references(() => serviceUnits.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description"),
    filePath: text("file_path").notNull(),
    mimeType: text("mime_type"),
    fileSize: integer("file_size"),
    category: mediaCategoryEnum("category").notNull(),
    privacyReviewed: boolean("privacy_reviewed").notNull().default(false),
    eligibleForPublic: boolean("eligible_for_public").notNull().default(false),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    capturedDate: date("captured_date"),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [
    index("media_assets_unit_idx").on(t.serviceUnitId),
    index("media_assets_public_idx").on(t.eligibleForPublic),
  ]
);

