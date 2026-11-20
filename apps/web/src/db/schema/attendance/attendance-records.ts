import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { attendanceStatusEnum, auditColumns, newId } from "../_shared";
import { attendanceSessions } from "./attendance-sessions";
import { students } from "../students/students";

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => attendanceSessions.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    status: attendanceStatusEnum("status").notNull(),
    note: text("note"),
    recordedOfflineAt: timestamp("recorded_offline_at", { withTimezone: true }),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex("attendance_records_session_student_uidx").on(
      t.sessionId,
      t.studentId
    ),
    index("attendance_records_student_idx").on(t.studentId),
  ]
);

