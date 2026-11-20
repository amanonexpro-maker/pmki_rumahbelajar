import {
  date,
  index,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { archiveColumns, auditColumns, newId } from "../_shared";
import { organizations } from "../organization/organizations";
import { serviceUnits } from "../organization/service-units";
import { classes } from "../academic/classes";
import { teachers } from "../academic/teachers";

/**
 * Attendance Sessions (04 §16).
 * Enforces UNIQUE(class_id, session_date) at DB level to prevent double sessions.
 */
export const attendanceSessions = pgTable(
  "attendance_sessions",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    serviceUnitId: uuid("service_unit_id")
      .notNull()
      .references(() => serviceUnits.id, { onDelete: "restrict" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "restrict" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    sessionDate: date("session_date").notNull(),
    notes: text("notes"),
    ...auditColumns,
    ...archiveColumns,
  },
  (t) => [
    uniqueIndex("attendance_sessions_class_date_uidx").on(
      t.classId,
      t.sessionDate
    ),
    index("attendance_sessions_date_idx").on(t.sessionDate),
    index("attendance_sessions_class_idx").on(t.classId),
  ]
);

