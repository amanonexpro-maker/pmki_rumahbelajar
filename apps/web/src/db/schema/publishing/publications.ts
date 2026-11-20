import { date, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import {
  archiveColumns,
  auditColumns,
  newId,
  publicationStatusEnum,
} from "../_shared";
import { organizations } from "../organization/organizations";
import { serviceUnits } from "../organization/service-units";
import { mediaAssets } from "../media/media-assets";

export const publications = pgTable(
  "publications",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    serviceUnitId: uuid("service_unit_id")
      .notNull()
      .references(() => serviceUnits.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    category: text("category").notNull().default("BERITA"),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    coverMediaId: uuid("cover_media_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    status: publicationStatusEnum("status").notNull().default("DRAFT"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    eventDate: date("event_date"),
    eventLocation: text("event_location"),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [
    index("publications_slug_idx").on(t.slug),
    index("publications_status_idx").on(t.status),
    index("publications_published_at_idx").on(t.publishedAt),
  ]
);

