import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { archiveColumns, auditColumns, newId } from "../_shared";
import { organizations } from "../organization/organizations";
import { serviceUnits } from "../organization/service-units";
import { students } from "../students/students";
import { teachers } from "../academic/teachers";
import { users } from "../identity/users";
import { developmentCategories } from "./development-categories";

/**
 * Canonical `development_notes` (04 §17) with `confidential = true` by default
 * and `version` + `development_note_revisions` (B-lite per U-05 / 06 §14).
 */
export const developmentNotes = pgTable(
  "development_notes",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    serviceUnitId: uuid("service_unit_id")
      .notNull()
      .references(() => serviceUnits.id, { onDelete: "restrict" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => developmentCategories.id, { onDelete: "restrict" }),
    observation: text("observation").notNull(),
    progress: text("progress"),
    followUp: text("follow_up"),
    confidential: boolean("confidential").notNull().default(true),
    version: integer("version").notNull().default(1),
    recordedOfflineAt: timestamp("recorded_offline_at", { withTimezone: true }),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [
    index("development_notes_student_idx").on(t.studentId),
    index("development_notes_teacher_idx").on(t.teacherId),
    index("development_notes_created_at_idx").on(t.createdAt),
  ]
);

/**
 * Revision history for versioned development notes (U-05 B-lite, 06 §14).
 * Prevents silent overwrites when offline edits reconcile.
 */
export const developmentNoteRevisions = pgTable(
  "development_note_revisions",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    noteId: uuid("note_id")
      .notNull()
      .references(() => developmentNotes.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    observation: text("observation").notNull(),
    progress: text("progress"),
    followUp: text("follow_up"),
    confidential: boolean("confidential").notNull().default(true),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("dev_note_revisions_note_ver_uidx").on(t.noteId, t.version),
  ]
);

